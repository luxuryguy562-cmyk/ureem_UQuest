import { randomUUID } from "crypto";

import { finalFallbackAppConfig } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  FinalAdminAuditLog,
  FinalAttendance,
  FinalAxCategory,
  FinalAxSubmission,
  FinalBadge,
  FinalCoupon,
  FinalCouponRequest,
  FinalCurriculum,
  FinalLearningCompletion,
  FinalNotification,
  FinalPointHistory,
  FinalQuizQuestion,
  FinalQuizSubmission,
  FinalRewardConfig,
  FinalStore,
  FinalUQuestConfig,
  FinalUser
} from "@/types/uquest";

// 정규화 테이블 ↔ FinalUQuestConfig 어댑터.
// - 읽기: 여러 테이블에서 조회해 FinalUQuestConfig 로 조립한다.
// - 쓰기: 저장 직전 DB 상태(before)와 도메인이 만든 결과(next)를 비교해 "바뀐 줄"만 기록한다.
// 배지(FinalBadge.id)는 도메인 로직이 코드 문자열에 의존하므로 badges.code 를 id 로 사용한다.
// 그 외 엔티티의 id 는 DB uuid 를 그대로 쓴다(도메인은 uuid 로 식별자를 생성).

type Supabase = NonNullable<ReturnType<typeof createServerSupabaseClient>>;

export async function getUQuestAppConfig(): Promise<FinalUQuestConfig> {
  const supabase = createServerSupabaseClient();
  const today = getOperationalToday();

  if (!supabase) {
    return { ...finalFallbackAppConfig, today };
  }

  const config = await assembleConfigFromDb(supabase, today);

  // 운영 데이터가 아직 없으면(시드 전) 폴백 목업으로 동작한다.
  if (config.users.length === 0 || config.curriculums.length === 0) {
    return { ...finalFallbackAppConfig, today };
  }

  return config;
}

export async function getMutableUQuestConfig(): Promise<FinalUQuestConfig> {
  return getUQuestAppConfig();
}

export async function saveMutableUQuestConfig(next: FinalUQuestConfig): Promise<FinalUQuestConfig> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    // DB 미연결: 폴백 모드(메모리). 이전 동작 유지.
    return { ...next, source: "fallback" };
  }

  const before = await assembleConfigFromDb(supabase, next.today);
  await persistDeltas(supabase, before, next);

  return assembleConfigFromDb(supabase, next.today);
}

export async function uploadAxEvidence(userId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "evidence.png";
  const path = `${userId}/${Date.now()}-${safeName}`;
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return `/mock/ax-evidence/${path}`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let { error } = await supabase.storage.from("ax-evidence").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    await supabase.storage.createBucket("ax-evidence", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
    });

    const retry = await supabase.storage.from("ax-evidence").upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
    error = retry.error;
  }

  if (error) {
    throw new Error(`ax_evidence_upload_failed:${error.message}`);
  }

  const { data } = supabase.storage.from("ax-evidence").getPublicUrl(path);
  return data.publicUrl || `/storage/ax-evidence/${path}`;
}

// ===========================================================================
// 읽기: 테이블 → FinalUQuestConfig 조립
// ===========================================================================

async function assembleConfigFromDb(supabase: Supabase, today: string): Promise<FinalUQuestConfig> {
  const [
    storesRes,
    usersRes,
    userBadgesRes,
    curriculumsRes,
    quizzesRes,
    attendancesRes,
    learningRes,
    submissionsRes,
    answersRes,
    axCategoriesRes,
    axSubmissionsRes,
    badgesRes,
    pointsRes,
    couponsRes,
    couponRequestsRes,
    notificationsRes,
    auditRes
  ] = await Promise.all([
    supabase.from("stores").select("*"),
    supabase.from("users").select("*"),
    supabase.from("user_badges").select("user_id, badges(code)"),
    supabase.from("curriculums").select("*").order("day_number", { ascending: true }),
    supabase.from("quizzes").select("*").order("sort_order", { ascending: true }),
    supabase.from("attendances").select("*"),
    supabase.from("learning_completions").select("*"),
    supabase.from("quiz_submissions").select("*"),
    supabase.from("quiz_answers").select("*"),
    supabase.from("ax_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("ax_submissions").select("*"),
    supabase.from("badges").select("*").order("sort_order", { ascending: true }),
    supabase.from("point_histories").select("*"),
    supabase.from("coupons").select("*").order("required_points", { ascending: true }),
    supabase.from("coupon_requests").select("*"),
    supabase.from("notifications").select("*"),
    supabase.from("admin_audit_logs").select("*")
  ]);

  // 보상 단위 설정은 단일 스냅샷(app_config_snapshots)에 저장한다.
  const snapshotRes = await supabase.from("app_config_snapshots").select("payload").eq("id", "current").maybeSingle();
  const rewardConfig = ((snapshotRes.data?.payload ?? null) as { rewardConfig?: FinalRewardConfig } | null)?.rewardConfig;

  const badgeCodesByUser = new Map<string, string[]>();
  for (const row of (userBadgesRes.data ?? []) as Row[]) {
    // 조인된 badges 는 supabase 추론상 객체 또는 배열일 수 있어 양쪽을 처리한다.
    const badgesField = row.badges;
    const code: string | undefined = Array.isArray(badgesField) ? badgesField[0]?.code : badgesField?.code;
    if (!code) continue;
    const list = badgeCodesByUser.get(row.user_id) ?? [];
    list.push(code);
    badgeCodesByUser.set(row.user_id, list);
  }

  const stores: FinalStore[] = (storesRes.data ?? []).map((r: Row) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    district: r.district ?? undefined,
    team: r.team ?? undefined,
    isActive: r.is_active
  }));

  const users: FinalUser[] = (usersRes.data ?? []).map((r: Row) => ({
    id: r.id,
    role: r.role,
    name: r.name,
    avatarGender: r.avatar_gender ?? undefined,
    phone: r.phone,
    loginId: r.login_id,
    passwordHash: r.password_hash ?? undefined,
    storeId: r.store_id ?? null,
    hireDate: r.hire_date ?? null,
    status: r.status,
    rejectReason: r.reject_reason ?? undefined,
    approvedAt: r.approved_at ?? undefined,
    completedAt: r.completed_at ?? undefined,
    inactiveAt: r.inactive_at ?? undefined,
    exp: r.exp ?? 0,
    badgeIds: badgeCodesByUser.get(r.id) ?? []
  }));

  const curriculums: FinalCurriculum[] = (curriculumsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    dayNumber: r.day_number,
    title: r.title,
    description: r.description,
    learningRewardPoints: r.learning_reward_points,
    isPublished: r.is_published
  }));

  const quizzes: FinalQuizQuestion[] = (quizzesRes.data ?? []).map((r: Row) => ({
    id: r.id,
    curriculumId: r.curriculum_id,
    question: r.question,
    options: [r.option_1, r.option_2, r.option_3, r.option_4],
    correctOption: r.correct_option,
    explanation: r.explanation ?? "",
    rewardPoints: r.reward_points
  }));

  const attendances: FinalAttendance[] = (attendancesRes.data ?? []).map((r: Row) => ({
    id: r.id,
    userId: r.user_id,
    attendanceDate: r.attendance_date,
    rewardPoints: r.reward_points
  }));

  const learningCompletions: FinalLearningCompletion[] = (learningRes.data ?? []).map((r: Row) => ({
    id: r.id,
    userId: r.user_id,
    curriculumId: r.curriculum_id,
    rewardPoints: r.reward_points,
    createdAt: r.created_at
  }));

  const answersBySubmission = new Map<string, Row[]>();
  for (const a of (answersRes.data ?? []) as Row[]) {
    const list = answersBySubmission.get(a.submission_id) ?? [];
    list.push(a);
    answersBySubmission.set(a.submission_id, list);
  }

  const quizSubmissions: FinalQuizSubmission[] = (submissionsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    userId: r.user_id,
    curriculumId: r.curriculum_id,
    totalCount: r.total_count,
    correctCount: r.correct_count,
    earnedPoints: r.earned_points,
    submittedAt: r.submitted_at,
    answers: (answersBySubmission.get(r.id) ?? []).map((a) => ({
      questionId: a.quiz_id,
      selectedOption: a.selected_option,
      correctOption: a.correct_option,
      isCorrect: a.is_correct,
      rewardPoints: a.reward_points
    }))
  }));

  const axCategories: FinalAxCategory[] = (axCategoriesRes.data ?? []).map((r: Row) => ({
    id: r.id,
    code: r.code,
    type: r.type,
    title: r.title,
    description: r.description,
    rewardPoints: r.reward_points,
    exampleImageUrl: r.example_image_url ?? undefined,
    isPublished: r.is_published,
    sortOrder: r.sort_order
  }));

  const axSubmissions: FinalAxSubmission[] = (axSubmissionsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    userId: r.user_id,
    categoryId: r.category_id,
    imageUrl: r.image_url,
    rewardPoints: r.reward_points,
    createdAt: r.created_at
  }));

  const badges: FinalBadge[] = (badgesRes.data ?? []).map((r: Row) => ({
    id: r.code, // 도메인 로직 식별자 = code
    category: r.category,
    name: r.name,
    description: r.description,
    conditionLabel: r.condition_label,
    rewardPoints: r.reward_points,
    imageKey: r.image_key,
    isRare: r.is_rare,
    isHidden: r.is_hidden,
    sortOrder: r.sort_order
  }));

  const pointHistories: FinalPointHistory[] = (pointsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    userId: r.user_id,
    amount: r.amount,
    balanceAfter: r.balance_after,
    type: r.type,
    reason: r.reason,
    referenceType: r.reference_type ?? undefined,
    referenceId: r.reference_id ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at
  }));

  const coupons: FinalCoupon[] = (couponsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    actualPrice: r.actual_price,
    requiredPoints: r.required_points,
    stockQuantity: r.stock_quantity ?? null,
    isPublished: r.is_published
  }));

  const couponRequests: FinalCouponRequest[] = (couponRequestsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    userId: r.user_id,
    couponId: r.coupon_id,
    requiredPoints: r.required_points,
    status: r.status,
    requestedAt: r.requested_at,
    canceledAt: r.canceled_at ?? undefined,
    sentAt: r.sent_at ?? undefined,
    expiresAt: r.expires_at ?? undefined,
    processedBy: r.processed_by ?? undefined,
    cancelReason: r.cancel_reason ?? undefined
  }));

  const notifications: FinalNotification[] = (notificationsRes.data ?? []).map((r: Row) => ({
    id: r.id,
    targetRole: r.target_role ?? "admin",
    targetUserId: r.target_user_id ?? undefined,
    type: r.type,
    title: r.title,
    message: r.message,
    isRead: r.is_read,
    createdAt: r.created_at
  }));

  const adminAuditLogs: FinalAdminAuditLog[] = (auditRes.data ?? []).map((r: Row) => ({
    id: r.id,
    actorId: r.actor_id ?? "",
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id ?? "",
    reason: r.reason,
    createdAt: r.created_at
  }));

  return {
    source: "supabase",
    today,
    activeUserId: users.find((u) => u.role === "rookie" && u.status === "active")?.id ?? "",
    managerUserId: users.find((u) => u.role === "manager")?.id ?? "",
    adminUserId: users.find((u) => u.role === "admin")?.id ?? "",
    rewardConfig,
    stores,
    users,
    curriculums,
    quizzes,
    attendances,
    learningCompletions,
    quizSubmissions,
    axCategories,
    axSubmissions,
    badges,
    pointHistories,
    coupons,
    couponRequests,
    notifications,
    adminAuditLogs
  };
}

// ===========================================================================
// 쓰기: before vs next 비교 → 바뀐 줄만 반영
// ===========================================================================

async function persistDeltas(supabase: Supabase, before: FinalUQuestConfig, next: FinalUQuestConfig) {
  // 1) 신규/변경 사용자 (회원가입, 승인/반려/수료 등)
  const beforeUsers = byId(before.users);
  const newUsers: FinalUser[] = [];
  const changedUsers: FinalUser[] = [];
  for (const u of next.users) {
    const prev = beforeUsers.get(u.id);
    if (!prev) newUsers.push(u);
    else if (userChanged(prev, u)) changedUsers.push(u);
  }

  if (newUsers.length > 0) {
    await throwOnError(
      supabase.from("users").insert(
        newUsers.map((u) => ({
          id: u.id,
          role: u.role,
          name: u.name,
          avatar_gender: u.avatarGender ?? null,
          phone: u.phone,
          login_id: u.loginId,
          password_hash: u.passwordHash ?? null,
          store_id: u.storeId,
          hire_date: u.hireDate,
          status: u.status,
          exp: u.exp
        }))
      ),
      "users.insert"
    );
  }

  for (const u of changedUsers) {
    await throwOnError(
      supabase
        .from("users")
        .update({
          name: u.name,
          avatar_gender: u.avatarGender ?? null,
          phone: u.phone,
          store_id: u.storeId,
          hire_date: u.hireDate,
          status: u.status,
          reject_reason: u.rejectReason ?? null,
          approved_at: u.approvedAt ?? null,
          completed_at: u.completedAt ?? null,
          inactive_at: u.inactiveAt ?? null,
          exp: u.exp
        })
        .eq("id", u.id),
      "users.update"
    );
  }

  // 2) append-only 기록들 (신규 행 insert)
  await insertNew(supabase, "attendances", before.attendances, next.attendances, (a) => ({
    id: a.id,
    user_id: a.userId,
    attendance_date: a.attendanceDate,
    reward_points: a.rewardPoints
  }));

  await insertNew(supabase, "learning_completions", before.learningCompletions, next.learningCompletions, (l) => ({
    id: l.id,
    user_id: l.userId,
    curriculum_id: l.curriculumId,
    completion_date: l.createdAt.slice(0, 10),
    reward_points: l.rewardPoints,
    created_at: l.createdAt
  }));

  // 퀴즈 제출 + 답안 (부모 → 자식)
  const newSubmissions = newRows(before.quizSubmissions, next.quizSubmissions);
  if (newSubmissions.length > 0) {
    await throwOnError(
      supabase.from("quiz_submissions").insert(
        newSubmissions.map((s) => ({
          id: s.id,
          user_id: s.userId,
          curriculum_id: s.curriculumId,
          total_count: s.totalCount,
          correct_count: s.correctCount,
          earned_points: s.earnedPoints,
          submitted_at: s.submittedAt
        }))
      ),
      "quiz_submissions.insert"
    );

    const answerRows = newSubmissions.flatMap((s) =>
      s.answers.map((a) => ({
        id: randomUUID(),
        submission_id: s.id,
        quiz_id: a.questionId,
        selected_option: a.selectedOption,
        correct_option: a.correctOption,
        is_correct: a.isCorrect,
        reward_points: a.rewardPoints
      }))
    );
    if (answerRows.length > 0) {
      await throwOnError(supabase.from("quiz_answers").insert(answerRows), "quiz_answers.insert");
    }
  }

  await insertNew(supabase, "ax_submissions", before.axSubmissions, next.axSubmissions, (a) => ({
    id: a.id,
    user_id: a.userId,
    category_id: a.categoryId,
    image_url: a.imageUrl,
    reward_points: a.rewardPoints,
    created_at: a.createdAt
  }));

  await insertNew(supabase, "point_histories", before.pointHistories, next.pointHistories, (p) => ({
    id: p.id,
    user_id: p.userId,
    amount: p.amount,
    balance_after: p.balanceAfter,
    type: p.type,
    reason: p.reason,
    reference_type: p.referenceType ?? null,
    reference_id: p.referenceId ?? null,
    created_by: p.createdBy ?? null,
    created_at: p.createdAt
  }));

  // 3) 배지 획득 (user.badgeIds 의 신규 코드 → user_badges)
  await persistUserBadges(supabase, before, next);

  // 4) 쿠폰 요청 (신규 + 상태 변경)
  const beforeReq = byId(before.couponRequests);
  const newReqs: FinalCouponRequest[] = [];
  const changedReqs: FinalCouponRequest[] = [];
  for (const r of next.couponRequests) {
    const prev = beforeReq.get(r.id);
    if (!prev) newReqs.push(r);
    else if (couponRequestChanged(prev, r)) changedReqs.push(r);
  }
  if (newReqs.length > 0) {
    await throwOnError(
      supabase.from("coupon_requests").insert(
        newReqs.map((r) => ({
          id: r.id,
          user_id: r.userId,
          coupon_id: r.couponId,
          required_points: r.requiredPoints,
          status: r.status,
          requested_at: r.requestedAt,
          canceled_at: r.canceledAt ?? null,
          sent_at: r.sentAt ?? null,
          expires_at: r.expiresAt ?? null,
          processed_by: r.processedBy ?? null,
          cancel_reason: r.cancelReason ?? null
        }))
      ),
      "coupon_requests.insert"
    );
  }
  for (const r of changedReqs) {
    await throwOnError(
      supabase
        .from("coupon_requests")
        .update({
          status: r.status,
          canceled_at: r.canceledAt ?? null,
          sent_at: r.sentAt ?? null,
          expires_at: r.expiresAt ?? null,
          processed_by: r.processedBy ?? null,
          cancel_reason: r.cancelReason ?? null
        })
        .eq("id", r.id),
      "coupon_requests.update"
    );
  }

  // 5) 쿠폰 재고 변경 (발송 처리)
  const beforeCoupons = byId(before.coupons);
  for (const c of next.coupons) {
    const prev = beforeCoupons.get(c.id);
    if (prev && prev.stockQuantity !== c.stockQuantity) {
      await throwOnError(
        supabase.from("coupons").update({ stock_quantity: c.stockQuantity }).eq("id", c.id),
        "coupons.update"
      );
    }
  }

  // 6) 커리큘럼/퀴즈 수정 (관리자)
  const beforeCurriculums = byId(before.curriculums);
  for (const cur of next.curriculums) {
    const prev = beforeCurriculums.get(cur.id);
    if (prev && curriculumChanged(prev, cur)) {
      await throwOnError(
        supabase
          .from("curriculums")
          .update({
            title: cur.title,
            description: cur.description,
            learning_reward_points: cur.learningRewardPoints,
            is_published: cur.isPublished
          })
          .eq("id", cur.id),
        "curriculums.update"
      );
    }
  }
  await persistQuizSets(supabase, before, next);

  // 6-1) 배지 보상 포인트 수정 (관리자 시뮬레이터)
  const beforeBadges = byId(before.badges);
  for (const badge of next.badges) {
    const prev = beforeBadges.get(badge.id);
    if (prev && prev.rewardPoints !== badge.rewardPoints) {
      await throwOnError(
        supabase.from("badges").update({ reward_points: badge.rewardPoints }).eq("code", badge.id),
        "badges.update"
      );
    }
  }

  // 6-2) AX 항목 수정 (예시 이미지 등)
  const beforeAx = byId(before.axCategories);
  for (const category of next.axCategories) {
    const prev = beforeAx.get(category.id);
    if (prev && (prev.exampleImageUrl !== category.exampleImageUrl || prev.rewardPoints !== category.rewardPoints || prev.description !== category.description || prev.isPublished !== category.isPublished)) {
      await throwOnError(
        supabase
          .from("ax_categories")
          .update({
            description: category.description,
            reward_points: category.rewardPoints,
            example_image_url: category.exampleImageUrl ?? null,
            is_published: category.isPublished
          })
          .eq("id", category.id),
        "ax_categories.update"
      );
    }
  }

  // 6-3) 매장 추가/수정 (관리자 CSV 임포트)
  const beforeStores = byId(before.stores);
  const newStores: FinalStore[] = [];
  for (const store of next.stores) {
    const prev = beforeStores.get(store.id);
    if (!prev) {
      newStores.push(store);
    } else if (prev.name !== store.name || prev.district !== store.district || prev.team !== store.team || prev.isActive !== store.isActive) {
      await throwOnError(
        supabase.from("stores").update({ name: store.name, district: store.district ?? null, team: store.team ?? null, is_active: store.isActive }).eq("id", store.id),
        "stores.update"
      );
    }
  }
  if (newStores.length > 0) {
    await throwOnError(
      supabase.from("stores").insert(
        newStores.map((store) => ({ id: store.id, code: store.code, name: store.name, district: store.district ?? null, team: store.team ?? null, is_active: store.isActive }))
      ),
      "stores.insert"
    );
  }

  // 7) 알림 / 감사 로그 (append-only)
  await insertNew(supabase, "notifications", before.notifications, next.notifications, (n) => ({
    id: n.id,
    target_role: n.targetRole,
    target_user_id: n.targetUserId ?? null,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.isRead,
    created_at: n.createdAt
  }));

  await insertNew(supabase, "admin_audit_logs", before.adminAuditLogs, next.adminAuditLogs, (a) => ({
    id: a.id,
    actor_id: a.actorId || null,
    action: a.action,
    target_type: a.targetType,
    target_id: a.targetId || null,
    reason: a.reason,
    created_at: a.createdAt
  }));

  // 보상 단위 설정 변경 시 단일 스냅샷에 저장.
  if (next.rewardConfig && JSON.stringify(before.rewardConfig ?? null) !== JSON.stringify(next.rewardConfig)) {
    await throwOnError(
      supabase.from("app_config_snapshots").upsert({
        id: "current",
        payload: { rewardConfig: next.rewardConfig },
        updated_at: new Date().toISOString()
      }),
      "app_config_snapshots upsert"
    );
  }
}

async function persistUserBadges(supabase: Supabase, before: FinalUQuestConfig, next: FinalUQuestConfig) {
  const beforeBadgeCodes = new Map(before.users.map((u) => [u.id, new Set(u.badgeIds)]));
  const additions: Array<{ userId: string; code: string }> = [];
  for (const u of next.users) {
    const prev = beforeBadgeCodes.get(u.id) ?? new Set<string>();
    for (const code of u.badgeIds) {
      if (!prev.has(code)) additions.push({ userId: u.id, code });
    }
  }
  if (additions.length === 0) return;

  const { data, error } = await supabase.from("badges").select("id, code");
  if (error) throw new Error(`uquest_persist_failed:badges.select:${error.message}`);
  const idByCode = new Map((data ?? []).map((r: Row) => [r.code, r.id]));

  const rows = additions
    .map((a) => ({ id: randomUUID(), user_id: a.userId, badge_id: idByCode.get(a.code) }))
    .filter((r) => Boolean(r.badge_id));
  if (rows.length === 0) return;

  await throwOnError(
    supabase.from("user_badges").upsert(rows, { onConflict: "user_id,badge_id", ignoreDuplicates: true }),
    "user_badges.insert"
  );
}

async function persistQuizSets(supabase: Supabase, before: FinalUQuestConfig, next: FinalUQuestConfig) {
  const beforeByCurriculum = groupBy(before.quizzes, (q) => q.curriculumId);
  const nextByCurriculum = groupBy(next.quizzes, (q) => q.curriculumId);

  for (const [curriculumId, nextQuizzes] of nextByCurriculum) {
    const beforeQuizzes = beforeByCurriculum.get(curriculumId) ?? [];
    if (quizSetEqual(beforeQuizzes, nextQuizzes)) continue;

    // 해당 커리큘럼 퀴즈를 교체한다(관리자 수정).
    await throwOnError(supabase.from("quizzes").delete().eq("curriculum_id", curriculumId), "quizzes.delete");
    await throwOnError(
      supabase.from("quizzes").insert(
        nextQuizzes.map((q, index) => ({
          id: q.id,
          curriculum_id: q.curriculumId,
          question: q.question,
          option_1: q.options[0] ?? "",
          option_2: q.options[1] ?? "",
          option_3: q.options[2] ?? "",
          option_4: q.options[3] ?? "",
          correct_option: q.correctOption,
          explanation: q.explanation,
          reward_points: q.rewardPoints,
          sort_order: index + 1,
          is_published: true
        }))
      ),
      "quizzes.insert"
    );
  }
}

// ===========================================================================
// 헬퍼
// ===========================================================================

type Row = Record<string, any>;

async function insertNew<T extends { id: string }>(
  supabase: Supabase,
  table: string,
  before: T[],
  next: T[],
  toRow: (item: T) => Row
) {
  const rows = newRows(before, next).map(toRow);
  if (rows.length === 0) return;
  await throwOnError(supabase.from(table).insert(rows), `${table}.insert`);
}

function newRows<T extends { id: string }>(before: T[], next: T[]): T[] {
  const ids = new Set(before.map((r) => r.id));
  return next.filter((r) => !ids.has(r.id));
}

function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]));
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}

function userChanged(a: FinalUser, b: FinalUser): boolean {
  return (
    a.name !== b.name ||
    a.avatarGender !== b.avatarGender ||
    a.phone !== b.phone ||
    a.storeId !== b.storeId ||
    a.hireDate !== b.hireDate ||
    a.status !== b.status ||
    a.rejectReason !== b.rejectReason ||
    a.approvedAt !== b.approvedAt ||
    a.completedAt !== b.completedAt ||
    a.inactiveAt !== b.inactiveAt ||
    a.exp !== b.exp
  );
}

function couponRequestChanged(a: FinalCouponRequest, b: FinalCouponRequest): boolean {
  return (
    a.status !== b.status ||
    a.canceledAt !== b.canceledAt ||
    a.sentAt !== b.sentAt ||
    a.expiresAt !== b.expiresAt ||
    a.processedBy !== b.processedBy ||
    a.cancelReason !== b.cancelReason
  );
}

function curriculumChanged(a: FinalCurriculum, b: FinalCurriculum): boolean {
  return (
    a.title !== b.title ||
    a.description !== b.description ||
    a.learningRewardPoints !== b.learningRewardPoints ||
    a.isPublished !== b.isPublished
  );
}

function quizSetEqual(a: FinalQuizQuestion[], b: FinalQuizQuestion[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (q: FinalQuizQuestion) =>
    JSON.stringify([q.id, q.question, q.options, q.correctOption, q.explanation, q.rewardPoints]);
  const sa = a.map(norm).sort();
  const sb = b.map(norm).sort();
  return sa.every((value, index) => value === sb[index]);
}

async function throwOnError(query: PromiseLike<{ error: { message: string } | null }>, label: string) {
  const { error } = await query;
  if (error) throw new Error(`uquest_persist_failed:${label}:${error.message}`);
}

function getOperationalToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}
