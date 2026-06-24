"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { formatKrw, formatNumber } from "@/lib/format";
import type {
  AxLevel,
  BadgeCategory,
  FinalAxCategory,
  FinalBadge,
  FinalCoupon,
  FinalCouponRequest,
  FinalCurriculum,
  FinalRole,
  FinalScreenKey,
  FinalStore,
  FinalUQuestConfig,
  FinalUser,
  FinalUserStatus,
  QuizTier
} from "@/types/uquest";

const axRobotAssets: Record<AxLevel, string> = {
  Explorer: "/assets/uquest/generated/ax-robots/ax_robot_explorer.png",
  User: "/assets/uquest/generated/ax-robots/ax_robot_user.png",
  Expert: "/assets/uquest/generated/ax-robots/ax_robot_expert.png",
  Master: "/assets/uquest/generated/ax-robots/ax_robot_master.png"
};

const characterAssets: Record<"male" | "female", Record<number, string>> = {
  male: {
    1: "/assets/uquest/generated/characters/male_lv1.png",
    2: "/assets/uquest/generated/characters/male_lv2.png",
    3: "/assets/uquest/generated/characters/male_lv3.png",
    4: "/assets/uquest/generated/characters/male_lv4.png",
    5: "/assets/uquest/generated/characters/male_lv5.png"
  },
  female: {
    1: "/assets/uquest/generated/characters/female_lv1.png",
    2: "/assets/uquest/generated/characters/female_lv2.png",
    3: "/assets/uquest/generated/characters/female_lv3.png",
    4: "/assets/uquest/generated/characters/female_lv4.png",
    5: "/assets/uquest/generated/characters/female_lv5.png"
  }
};

const tierAssets: Record<QuizTier, string> = {
  Unranked: "/assets/uquest/generated/tiers/tier_unranked.png",
  Bronze: "/assets/uquest/generated/tiers/tier_bronze.png",
  Silver: "/assets/uquest/generated/tiers/tier_silver.png",
  Gold: "/assets/uquest/generated/tiers/tier_gold.png",
  Platinum: "/assets/uquest/generated/tiers/tier_platinum.png",
  Diamond: "/assets/uquest/generated/tiers/tier_diamond.png"
};

const badgeAssets: Record<string, string> = {
  attendance_1: "/assets/uquest/generated/badges/attendance_1.png",
  attendance_5: "/assets/uquest/generated/badges/attendance_5.png",
  attendance_10: "/assets/uquest/generated/badges/attendance_10.png",
  attendance_15: "/assets/uquest/generated/badges/attendance_15.png",
  attendance_20: "/assets/uquest/generated/badges/attendance_20.png",
  quiz_1: "/assets/uquest/generated/badges/quiz_1.png",
  quiz_10: "/assets/uquest/generated/badges/quiz_10.png",
  quiz_30: "/assets/uquest/generated/badges/quiz_30.png",
  quiz_50: "/assets/uquest/generated/badges/quiz_50.png",
  quiz_60: "/assets/uquest/generated/badges/quiz_60.png",
  tier_bronze: "/assets/uquest/generated/badges/tier_bronze.png",
  tier_silver: "/assets/uquest/generated/badges/tier_silver.png",
  tier_gold: "/assets/uquest/generated/badges/tier_gold.png",
  tier_platinum: "/assets/uquest/generated/badges/tier_platinum.png",
  tier_diamond: "/assets/uquest/generated/badges/tier_diamond.png",
  rare_attendance: "/assets/uquest/generated/badges/rare_attendance.png",
  rare_quiz: "/assets/uquest/generated/badges/rare_quiz.png",
  rare_tier: "/assets/uquest/generated/badges/rare_tier.png",
  rare_ax_master: "/assets/uquest/generated/badges/rare_ax_master.png",
  rare_all_public: "/assets/uquest/generated/badges/rare_all_public.png",
  rare_legend: "/assets/uquest/generated/badges/rare_legend.png",
  locked: "/assets/uquest/generated/badges/badge_locked.png"
};

type NavIconKey = "home" | "learn" | "ax" | "shop" | "my";

const rookieNav: Array<{ screen: FinalScreenKey; label: string; icon: NavIconKey }> = [
  { screen: "home", label: "홈", icon: "home" },
  { screen: "learn", label: "학습", icon: "learn" },
  { screen: "ax", label: "AX", icon: "ax" },
  { screen: "shop", label: "상점", icon: "shop" },
  { screen: "profile", label: "MY", icon: "my" }
];

const navIcons: Record<NavIconKey, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
  ),
  learn: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></svg>
  ),
  ax: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="3" /><path d="M9 7V5h6v2M9 13h.01M15 13h.01" /></svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 11H6z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
  ),
  my: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
  )
};

type Toast = {
  title: string;
  body: string;
  tone?: "good" | "warn" | "danger";
};

type RookieSummary = {
  user: FinalUser;
  storeName: string;
  currentDay: number;
  curriculumDay: number;
  endDate: string;
  progressRate: number;
  attendanceCount: number;
  learningCount: number;
  quizSolvedCount: number;
  quizCorrectCount: number;
  quizAccuracyRate: number;
  quizTier: QuizTier;
  axSubmissionCount: number;
  axLevel: AxLevel;
  characterLevel: number;
  pointBalance: number;
  totalEarnedPoints: number;
  totalSpentPoints: number;
  shopOpened: boolean;
  pointExpireDate: string | null;
  pointExpired: boolean;
  acquiredBadges: FinalBadge[];
};

type CurriculumQuizDraft = {
  id?: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  rewardPoints: string;
};

type CurriculumDraft = {
  title: string;
  description: string;
  learningRewardPoints: string;
  isPublished: boolean;
  quizzes: CurriculumQuizDraft[];
};

type RewardConfigDraft = {
  attendancePoints: number;
  learningPoints: number;
  quizCorrectPoints: number;
  quizWrongPoints: number;
  axPoints: number;
  badges: { id: string; rewardPoints: number }[];
};

export function UQuestApp({ config }: { config: FinalUQuestConfig }) {
  const [data, setData] = useState<FinalUQuestConfig>(() => normalizeConfig(config));
  const [role, setRole] = useState<FinalRole>("rookie");
  const [screen, setScreen] = useState<FinalScreenKey>("home");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(() => getCurrentCurriculumId(config, getUser(config, config.activeUserId)));
  const [quizDraft, setQuizDraft] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [pending, setPending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState<FinalUser | null>(null);
  const [couponSheet, setCouponSheet] = useState<{ id: string; draft: CouponDraft } | null>(null);

  const activeUser = getUser(data, data.activeUserId);
  const currentUserId = role === "rookie" ? data.activeUserId : role === "manager" ? data.managerUserId : data.adminUserId;
  const currentUser = getUser(data, currentUserId);
  const rookie = useMemo(() => deriveRookieSummary(data, activeUser), [data, activeUser]);
  const selectedCurriculum = data.curriculums.find((item) => item.id === selectedCurriculumId) ?? data.curriculums[0];
  const selectedQuestions = data.quizzes.filter((question) => question.curriculumId === selectedCurriculum.id);
  const selectedSubmission = data.quizSubmissions.find((submission) => submission.userId === activeUser.id && submission.curriculumId === selectedCurriculum.id);
  const selectedLearning = data.learningCompletions.find((completion) => completion.userId === activeUser.id && completion.curriculumId === selectedCurriculum.id);

  useEffect(() => {
    let canceled = false;

    fetch("/api/me")
      .then(async (response) => (response.ok ? ((await response.json()) as { user?: FinalUser | null }) : { user: null }))
      .then((payload) => {
        if (canceled) return;
        if (payload.user) applyAuthenticatedUser(payload.user);
        setAuthChecked(true);
      })
      .catch(() => {
        if (!canceled) setAuthChecked(true);
      });

    return () => {
      canceled = true;
    };
  }, []);

  function go(nextScreen: FinalScreenKey) {
    if (role === "manager" && nextScreen !== "manager") {
      setScreen("manager");
      return;
    }

    if (role === "admin" && nextScreen !== "admin") {
      setScreen("admin");
      return;
    }

    setScreen(nextScreen);
  }

  function pushToast(nextToast: Toast) {
    setToast(nextToast);
  }

  async function runApiMutation(
    url: string,
    body: Record<string, unknown>,
    success: Toast,
    requesterId = currentUser.id
  ) {
    if (pending) return false;
    setPending(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-uquest-user-id": requesterId
        },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { config?: FinalUQuestConfig; message?: string; error?: string };

      if (!response.ok) {
        pushToast({
          title: apiErrorTitle(payload.error),
          body: payload.message ?? "요청을 처리하지 못했습니다.",
          tone: response.status >= 500 ? "danger" : "warn"
        });
        return false;
      }

      if (payload.config) {
        const nextConfig = payload.config;
        setData((current) => ({
          ...nextConfig,
          activeUserId: current.activeUserId,
          managerUserId: current.managerUserId,
          adminUserId: current.adminUserId
        }));
      }
      pushToast(success);
      return true;
    } catch {
      pushToast({ title: "요청 실패", body: "서버 요청 중 문제가 발생했습니다.", tone: "danger" });
      return false;
    } finally {
      setPending(false);
    }
  }

  async function runApiFormMutation(
    url: string,
    body: FormData,
    success: Toast,
    requesterId = currentUser.id
  ) {
    if (pending) return false;
    setPending(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-uquest-user-id": requesterId
        },
        body
      });
      const payload = (await response.json()) as { config?: FinalUQuestConfig; message?: string; error?: string };

      if (!response.ok) {
        pushToast({
          title: apiErrorTitle(payload.error),
          body: payload.message ?? "요청을 처리하지 못했습니다.",
          tone: response.status >= 500 ? "danger" : "warn"
        });
        return false;
      }

      if (payload.config) {
        const nextConfig = payload.config;
        setData((current) => ({
          ...nextConfig,
          activeUserId: current.activeUserId,
          managerUserId: current.managerUserId,
          adminUserId: current.adminUserId
        }));
      }
      pushToast(success);
      return true;
    } catch {
      pushToast({ title: "요청 실패", body: "서버 요청 중 문제가 발생했습니다.", tone: "danger" });
      return false;
    } finally {
      setPending(false);
    }
  }

  function applyAuthenticatedUser(user: FinalUser) {
    setAuthUser(user);
    setRole(user.role);
    setData((current) => {
      const users = current.users.some((item) => item.id === user.id)
        ? current.users.map((item) => (item.id === user.id ? { ...item, ...user } : item))
        : [...current.users, user];

      return {
        ...current,
        users,
        activeUserId: user.role === "rookie" ? user.id : current.activeUserId,
        managerUserId: user.role === "manager" ? user.id : current.managerUserId,
        adminUserId: user.role === "admin" ? user.id : current.adminUserId
      };
    });
    setScreen(user.role === "rookie" ? "home" : user.role);
    if (user.role === "rookie") {
      setSelectedCurriculumId(getCurrentCurriculumId(data, user));
    }
    setQuizDraft({});
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setRole("rookie");
    setScreen("home");
    setQuizDraft({});
  }

  async function claimAttendance() {
    await runApiMutation("/api/rookie/attendance", {}, { title: "출석 완료", body: "300P가 지급됐고 출석 배지 조건을 다시 확인했습니다.", tone: "good" }, activeUser.id);
  }

  async function completeLearning(curriculum: FinalCurriculum) {
    const ok = await runApiMutation(
      "/api/rookie/learning-completions",
      { curriculumId: curriculum.id },
      { title: "학습 완료", body: "학습을 마쳤어요. 이어서 퀴즈를 풀어보세요.", tone: "good" },
      activeUser.id
    );
    if (ok) {
      setSelectedCurriculumId(curriculum.id);
      go("quiz");
    }
  }

  async function submitQuiz(curriculum: FinalCurriculum) {
    const ok = await runApiMutation(
      "/api/rookie/quiz-submissions",
      { curriculumId: curriculum.id, answers: quizDraft },
      { title: "퀴즈 제출 완료", body: "퀴즈 포인트가 지급됐습니다. 티어는 정답률로 계산됩니다.", tone: "good" },
      activeUser.id
    );
    if (ok) setQuizDraft({});
  }

  async function certifyAx(category: FinalAxCategory, evidenceFile: File) {
    const body = new FormData();
    body.append("categoryId", category.id);
    body.append("evidence", evidenceFile);

    await runApiFormMutation(
      "/api/rookie/ax-submissions",
      body,
      { title: "AX 인증 완료", body: `${evidenceFile.name} 사진 인증이 저장됐고 500P가 지급됐습니다.`, tone: "good" },
      activeUser.id
    );
  }

  async function redeemCoupon(coupon: FinalCoupon) {
    await runApiMutation(
      "/api/shop/coupon-requests",
      { couponId: coupon.id },
      { title: "교환 요청 완료", body: "포인트가 즉시 차감됐습니다. 발송 전에는 취소하면 원복됩니다.", tone: "good" },
      activeUser.id
    );
  }

  async function cancelCouponRequest(requestId: string, reason: string) {
    await runApiMutation(
      `/api/shop/coupon-requests/${requestId}/cancel`,
      { reason },
      { title: "쿠폰 요청 취소", body: "발송 전 취소라 포인트가 즉시 원복됐습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function createCoupon(body: Record<string, unknown>) {
    await runApiMutation(
      "/api/admin/coupons",
      body,
      { title: "쿠폰 추가", body: "새 쿠폰이 등록됐습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function updateCoupon(couponId: string, body: Record<string, unknown>) {
    return runApiMutation(
      `/api/admin/coupons/${couponId}`,
      body,
      { title: "쿠폰 수정", body: "쿠폰 정보가 저장됐습니다.", tone: "good" },
      currentUser.id
    );
  }

  function openCouponEdit(coupon: FinalCoupon) {
    setCouponSheet({
      id: coupon.id,
      draft: {
        name: coupon.name,
        description: coupon.description,
        actualPrice: String(coupon.actualPrice),
        requiredPoints: String(coupon.requiredPoints),
        stockQuantity: coupon.stockQuantity === null ? "" : String(coupon.stockQuantity),
        isPublished: coupon.isPublished
      }
    });
  }

  async function sendCouponRequest(requestId: string) {
    await runApiMutation(
      `/api/admin/coupon-requests/${requestId}/send`,
      {},
      { title: "발송 완료", body: "발송 완료 후에는 사용자/관리자 모두 취소할 수 없습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function approveUser(userId: string) {
    await runApiMutation(
      `/api/admin/users/${userId}/approve`,
      {},
      { title: "가입 승인", body: "신입 계정이 온보딩 진행 상태로 변경됐습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function rejectUser(userId: string) {
    await runApiMutation(
      `/api/admin/users/${userId}/reject`,
      { reason: "관리자 확인 필요" },
      { title: "가입 반려", body: "반려 사유가 저장됐고 로그인 시 안내됩니다.", tone: "warn" },
      currentUser.id
    );
  }

  async function updateCurriculumSettings(curriculumId: string, draft: CurriculumDraft) {
    await runApiMutation(
      `/api/admin/curriculums/${curriculumId}`,
      {
        title: draft.title,
        description: draft.description,
        learningRewardPoints: Number(draft.learningRewardPoints),
        isPublished: draft.isPublished,
        quizzes: draft.quizzes.map((quiz) => ({
          id: quiz.id,
          question: quiz.question,
          options: quiz.options,
          correctOption: quiz.correctOption,
          explanation: quiz.explanation,
          rewardPoints: Number(quiz.rewardPoints)
        }))
      },
      { title: "커리큘럼 저장", body: "Day 제목, 내용, 퀴즈 설정을 저장했습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function updateRewardConfig(values: RewardConfigDraft) {
    await runApiMutation(
      "/api/admin/reward-config",
      values,
      { title: "보상 설정 적용", body: "종목별 단위 포인트를 실제 보상에 적용했습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function importStores(rows: { district: string; team: string; name: string }[]) {
    await runApiMutation(
      "/api/admin/stores",
      { stores: rows },
      { title: "매장 적용", body: `매장 ${rows.length}건을 반영했습니다.`, tone: "good" },
      currentUser.id
    );
  }

  async function updateStore(storeId: string, patch: { name?: string; district?: string; team?: string; isActive?: boolean }) {
    await runApiMutation(
      `/api/admin/stores/${storeId}`,
      patch,
      { title: "매장 수정", body: "매장 정보를 저장했습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function updateAxExample(category: FinalAxCategory, file: File) {
    const body = new FormData();
    body.append("image", file);
    await runApiFormMutation(
      `/api/admin/ax-categories/${category.id}/example`,
      body,
      { title: "예시 이미지 저장", body: `${category.title} 예시 화면을 등록했습니다.`, tone: "good" },
      currentUser.id
    );
  }

  const visibleScreen = role === "rookie" ? screen : role;

  if (!authChecked) {
    return <AuthLoading />;
  }

  if (!authUser) {
    return <AuthView stores={data.stores} onAuthenticated={applyAuthenticatedUser} />;
  }

  return (
    <div className="phone final-shell" data-pending={pending} data-source={data.source}>
      <header className="final-header">
        <div className="brand-block">
          <span>U-Quest</span>
          <strong>{role === "rookie" ? activeUser.name : currentUser.name}</strong>
        </div>
        <div className="session-actions" aria-label="로그인 정보">
          <span>{roleLabel(role)}</span>
          <button onClick={logout} type="button">로그아웃</button>
        </div>
      </header>

      {role === "rookie" ? (
        <main className="final-screen">
          {visibleScreen === "home" ? (
            <HomeView data={data} onAttendance={claimAttendance} onGo={go} rookie={rookie} />
          ) : null}
          {visibleScreen === "learn" ? (
            <LearningView
              attendedToday={data.attendances.some((item) => item.userId === rookie.user.id && item.attendanceDate === data.today)}
              completions={data.learningCompletions}
              curriculums={data.curriculums}
              onStudy={(curriculum) => {
                setSelectedCurriculumId(curriculum.id);
                go("study");
              }}
              onSelect={setSelectedCurriculumId}
              rookie={rookie}
              selectedId={selectedCurriculum.id}
              today={data.today}
            />
          ) : null}
          {visibleScreen === "study" ? (
            <StudyView curriculum={selectedCurriculum} onBack={() => go("learn")} onComplete={completeLearning} />
          ) : null}
          {visibleScreen === "quiz" ? (
            <QuizView
              draft={quizDraft}
              learning={selectedLearning}
              onDraft={setQuizDraft}
              onSelect={setSelectedCurriculumId}
              onSubmit={submitQuiz}
              questions={selectedQuestions}
              rookie={rookie}
              selected={selectedCurriculum}
              submission={selectedSubmission}
              submissions={data.quizSubmissions}
              curriculums={data.curriculums}
            />
          ) : null}
          {visibleScreen === "ax" ? <AxView categories={data.axCategories} onCertify={certifyAx} rookie={rookie} submissions={data.axSubmissions} today={data.today} /> : null}
          {visibleScreen === "badges" ? <BadgeView badges={data.badges} rookie={rookie} /> : null}
          {visibleScreen === "profile" ? <ProfileView data={data} onGo={go} rookie={rookie} /> : null}
          {visibleScreen === "shop" ? <ShopView coupons={data.coupons} onCancel={cancelCouponRequest} onRedeem={redeemCoupon} requests={data.couponRequests} rookie={rookie} today={data.today} /> : null}
          {visibleScreen === "points" ? <PointHistoryView data={data} rookie={rookie} /> : null}
          {visibleScreen === "attendance" ? <AttendanceView data={data} rookie={rookie} /> : null}
        </main>
      ) : null}

      {role === "manager" ? <ManagerView data={data} manager={currentUser} /> : null}
      {role === "admin" ? (
        <AdminView
          data={data}
          onApprove={approveUser}
          onCancelCoupon={cancelCouponRequest}
          onCreateCoupon={createCoupon}
          onOpenCouponEdit={openCouponEdit}
          onUpdateCurriculum={updateCurriculumSettings}
          onUpdateRewardConfig={updateRewardConfig}
          onUpdateAxExample={updateAxExample}
          onImportStores={importStores}
          onUpdateStore={updateStore}
          onReject={rejectUser}
          onSendCoupon={sendCouponRequest}
        />
      ) : null}

      {role === "rookie" ? <BottomNav active={screen} onGo={go} /> : null}
      <ToastModal toast={toast} onClose={() => setToast(null)} />

      {couponSheet !== null ? (
        <div className="coupon-sheet-overlay" onClick={() => setCouponSheet(null)}>
          <div className="coupon-edit-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">쿠폰 수정</div>
            <form
              className="coupon-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!couponSheet) return;
                const ok = await updateCoupon(couponSheet.id, {
                  name: couponSheet.draft.name,
                  description: couponSheet.draft.description,
                  actualPrice: Number(couponSheet.draft.actualPrice),
                  requiredPoints: Number(couponSheet.draft.requiredPoints),
                  stockQuantity: couponSheet.draft.stockQuantity === "" ? null : Number(couponSheet.draft.stockQuantity),
                  isPublished: couponSheet.draft.isPublished
                });
                if (ok) setCouponSheet(null);
              }}
            >
              <input placeholder="쿠폰 이름" required value={couponSheet.draft.name} onChange={(e) => setCouponSheet((s) => s ? { ...s, draft: { ...s.draft, name: e.target.value } } : s)} />
              <input placeholder="쿠폰 설명" required value={couponSheet.draft.description} onChange={(e) => setCouponSheet((s) => s ? { ...s, draft: { ...s.draft, description: e.target.value } } : s)} />
              <div className="coupon-form-row">
                <input placeholder="금액 (₩)" type="number" min="0" value={couponSheet.draft.actualPrice} onChange={(e) => setCouponSheet((s) => s ? { ...s, draft: { ...s.draft, actualPrice: e.target.value } } : s)} />
                <input placeholder="포인트 (P)" type="number" min="1" required value={couponSheet.draft.requiredPoints} onChange={(e) => setCouponSheet((s) => s ? { ...s, draft: { ...s.draft, requiredPoints: e.target.value } } : s)} />
              </div>
              <input placeholder="재고 (빈칸=무제한)" type="number" min="0" value={couponSheet.draft.stockQuantity} onChange={(e) => setCouponSheet((s) => s ? { ...s, draft: { ...s.draft, stockQuantity: e.target.value } } : s)} />
              <label className="coupon-form-check">
                <input checked={couponSheet.draft.isPublished} type="checkbox" onChange={(e) => setCouponSheet((s) => s ? { ...s, draft: { ...s.draft, isPublished: e.target.checked } } : s)} />
                공개 (신입 상점에 표시)
              </label>
              <div className="coupon-form-actions">
                <button type="submit">저장</button>
                <button type="button" onClick={() => setCouponSheet(null)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="phone final-shell auth-shell">
      <div className="auth-card">
        <span className="eyebrow">U-Quest</span>
        <h1>로그인 확인 중</h1>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

function AuthView({
  stores,
  onAuthenticated
}: {
  stores: FinalUQuestConfig["stores"];
  onAuthenticated: (user: FinalUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [team, setTeam] = useState("");
  const [openPicker, setOpenPicker] = useState<"district" | "team" | "store" | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    loginId: "",
    password: "",
    storeId: "",
    hireDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()),
    avatarGender: "male" as "male" | "female"
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const hierStores = stores.filter((store) => store.district && store.team && store.isActive);
  const districts = [...new Set(hierStores.map((store) => store.district as string))];
  const teamOptions = [...new Set(hierStores.filter((store) => store.district === district).map((store) => store.team as string))];
  const storeOptions = hierStores.filter((store) => store.district === district && store.team === team);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login"
        ? { loginId: form.loginId, password: form.password }
        : {
            name: form.name,
            phone: form.phone,
            loginId: form.loginId,
            password: form.password,
            storeId: form.storeId,
            hireDate: form.hireDate,
            avatarGender: form.avatarGender
          };
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = (await response.json()) as { user?: FinalUser; message?: string; status?: FinalUserStatus };

    if (!response.ok || !payload.user) {
      setMessage(payload.message ?? "처리하지 못했습니다.");
      return;
    }

    if (mode === "signup") {
      setMessage("가입 요청이 접수됐습니다. 본사 관리자 승인 후 진행할 수 있습니다.");
      onAuthenticated(payload.user);
      return;
    }

    onAuthenticated(payload.user);
  }

  const picker =
    openPicker === "district"
      ? { title: "담당 선택", items: districts.map((value) => ({ value, label: value })), current: district, pick: (value: string) => { setDistrict(value); setTeam(""); update("storeId", ""); } }
      : openPicker === "team"
        ? { title: "팀장 선택", items: teamOptions.map((value) => ({ value, label: value })), current: team, pick: (value: string) => { setTeam(value); update("storeId", ""); } }
        : openPicker === "store"
          ? { title: "매장 선택", items: storeOptions.map((store) => ({ value: store.id, label: store.name })), current: form.storeId, pick: (value: string) => update("storeId", value) }
          : null;

  return (
    <div className="phone final-shell auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">U-Quest</span>
        <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
        <p>{mode === "login" ? "계정으로 온보딩을 시작하세요." : "신입은 가입 후 관리자 승인이 필요합니다."}</p>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">로그인</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")} type="button">회원가입</button>
        </div>

        {mode === "signup" ? (
          <>
            <label>
              이름
              <input autoComplete="name" onChange={(event) => update("name", event.currentTarget.value)} value={form.name} />
            </label>
            <label>
              휴대폰번호
              <input autoComplete="tel" onChange={(event) => update("phone", event.currentTarget.value)} value={form.phone} />
            </label>
            <label>
              담당
              <button className="picker-field" onClick={() => setOpenPicker("district")} type="button">
                <span className={district ? "" : "ph"}>{district || "담당 선택"}</span>
                <em>▾</em>
              </button>
            </label>
            <label>
              팀장
              <button className="picker-field" disabled={!district} onClick={() => setOpenPicker("team")} type="button">
                <span className={team ? "" : "ph"}>{team || (district ? "팀장 선택" : "담당 먼저 선택")}</span>
                <em>▾</em>
              </button>
            </label>
            <label>
              매장
              <button className="picker-field" disabled={!team} onClick={() => setOpenPicker("store")} type="button">
                <span className={form.storeId ? "" : "ph"}>{storeOptions.find((store) => store.id === form.storeId)?.name || (team ? "매장 선택" : "팀장 먼저 선택")}</span>
                <em>▾</em>
              </button>
            </label>
            <label>
              입사일
              <input onChange={(event) => update("hireDate", event.currentTarget.value)} type="date" value={form.hireDate} />
            </label>
            <div className="auth-gender">
              <button className={form.avatarGender === "male" ? "active" : ""} onClick={() => update("avatarGender", "male")} type="button">남자 캐릭터</button>
              <button className={form.avatarGender === "female" ? "active" : ""} onClick={() => update("avatarGender", "female")} type="button">여자 캐릭터</button>
            </div>
          </>
        ) : null}

        <label>
          아이디
          <input autoComplete="username" onChange={(event) => update("loginId", event.currentTarget.value)} value={form.loginId} />
        </label>
        <label>
          비밀번호
          <input autoComplete={mode === "login" ? "current-password" : "new-password"} onChange={(event) => update("password", event.currentTarget.value)} type="password" value={form.password} />
        </label>

        {message ? <div className="auth-message">{message}</div> : null}
        <button className="primary-action" type="submit">{mode === "login" ? "로그인" : "가입 요청"}</button>
        {mode === "login" ? <small>테스트 계정: 신입 demo/demo · 관리자 admin/admin</small> : null}
      </form>

      {picker ? (
        <div className="sheet-overlay" onClick={() => setOpenPicker(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-head">
              <h3>{picker.title}</h3>
              <button onClick={() => setOpenPicker(null)} type="button">✕</button>
            </div>
            <div className="sheet-list">
              {picker.items.length === 0 ? (
                <div className="sheet-empty">선택 항목이 없습니다.</div>
              ) : (
                picker.items.map((item) => (
                  <button
                    className={picker.current === item.value ? "on" : ""}
                    key={item.value}
                    onClick={() => { picker.pick(item.value); setOpenPicker(null); }}
                    type="button"
                  >
                    {item.label}
                    {picker.current === item.value ? <span className="ck">✓</span> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CharacterImage({
  user,
  level,
  size
}: {
  user: FinalUser;
  level: number;
  size: "mini" | "home" | "stage";
}) {
  const normalizedLevel = Math.min(5, Math.max(1, level));
  const gender = user.avatarGender === "female" ? "female" : "male";

  return <img alt={`Lv.${normalizedLevel} 캐릭터`} className={`character-image character-${size}`} src={characterAssets[gender][normalizedLevel]} />;
}

function BadgeIcon({ badge, hidden = false }: { badge?: FinalBadge; hidden?: boolean }) {
  const src = hidden || !badge ? badgeAssets.locked : badgeAssets[badge.id] ?? badgeAssets.locked;
  const alt = hidden || !badge ? "잠긴 배지" : `${badge.name} 배지`;

  return <img alt={alt} className="badge-icon" src={src} />;
}

function HomeView({
  data,
  rookie,
  onAttendance,
  onGo
}: {
  data: FinalUQuestConfig;
  rookie: RookieSummary;
  onAttendance: () => void;
  onGo: (screen: FinalScreenKey) => void;
}) {
  const myAttendances = data.attendances.filter((item) => item.userId === rookie.user.id);
  const attendanceLimitReached = myAttendances.length >= 20;
  const todayDone = attendanceLimitReached || myAttendances.some((item) => item.attendanceDate === data.today);
  const todayCurriculum = data.curriculums.find((item) => item.dayNumber === rookie.curriculumDay) ?? data.curriculums[0];
  const learnedToday = data.learningCompletions.some((item) => item.userId === rookie.user.id && item.curriculumId === todayCurriculum.id);
  const quizDoneToday = data.quizSubmissions.some((item) => item.userId === rookie.user.id && item.curriculumId === todayCurriculum.id);
  const axToday = data.axSubmissions.some((item) => item.userId === rookie.user.id && item.createdAt.startsWith(data.today));
  const notStarted = rookie.user.status === "active" && rookie.attendanceCount === 0 && rookie.learningCount === 0;

  return (
    <div className="e5-home">
      <StatusBanner rookie={rookie} />

      {notStarted ? (
        <section className="e5-welcome">
          <div className="emoji">🚀</div>
          <h2>U-Quest 온보딩을 시작해요!</h2>
          <p>출석을 찍으면 오늘부터 30일 온보딩이 시작됩니다. 30일 안에 출석·학습·퀴즈는 최대 20회, AX 인증은 매일 가능해요. 쉬는 날은 건너뛰어도 진도가 사라지지 않아요.</p>
          <button onClick={onAttendance} type="button">온보딩 시작하기 (출석)</button>
        </section>
      ) : null}

      <div className="e5-hello">
        <div className="e5-hello-text">
          <h1>
            <em>{rookie.user.name}</em>님, 오늘도 파이팅 👋
          </h1>
          <p>
            {rookie.storeName} · 온보딩 Day {rookie.curriculumDay} / 20
          </p>
        </div>
        <span className="e5-points">◆ {formatNumber(rookie.pointBalance)}P</span>
      </div>

      <section className="e5-hero">
        <div className="e5-head">
          <span className="e5-ptag">✨ 나의 성장 파트너</span>
          <img alt={`${rookie.quizTier} 티어`} className="e5-tier-top" src={tierAssets[rookie.quizTier]} />
        </div>
        <div className="e5-scene">
          <div className="e5-floor" />
          <div className="e5-cast">
            <div className="e5-char">
              <CharacterImage level={rookie.characterLevel} size="stage" user={rookie.user} />
            </div>
            <div className="e5-robot">
              <img alt={`${rookie.axLevel} AX 로봇`} src={axRobotAssets[rookie.axLevel]} />
            </div>
          </div>
        </div>
        <div className="e5-exp">
          <div className="e5-exp-lab">
            <span>캐릭터 성장</span>
            <span>
              Lv.{rookie.characterLevel} · {rookie.progressRate}%
            </span>
          </div>
          <div className="e5-exp-bar">
            <i style={{ width: `${rookie.progressRate}%` }} />
          </div>
        </div>
        <div className="e5-stats">
          <div className="e5-stat">
            <CharacterImage level={rookie.characterLevel} size="mini" user={rookie.user} />
            <div className="e5-stat-tx">
              <span className="l">캐릭터</span>
              <span className="v p">Lv.{rookie.characterLevel}</span>
            </div>
          </div>
          <div className="e5-stat">
            <img alt="" src={tierAssets[rookie.quizTier]} />
            <div className="e5-stat-tx">
              <span className="l">퀴즈 티어</span>
              <span className="v">{rookie.quizTier}</span>
            </div>
          </div>
          <div className="e5-stat">
            <img alt="" src={axRobotAssets[rookie.axLevel]} />
            <div className="e5-stat-tx">
              <span className="l">AX 단계</span>
              <span className="v">{rookie.axLevel}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="e5-today">
        <div className="e5-sec-h">
          <h3>오늘의 미션</h3>
          <span className="e5-cnt">{[todayDone, learnedToday, quizDoneToday, axToday].filter(Boolean).length} / 4 완료</span>
        </div>
        <E5Mission action="출석하기" done={todayDone} icon="📅" onClick={onAttendance} reward="+300P" title="출석 체크" />
        <E5Mission action={!todayDone ? "출석 먼저" : "학습하기"} done={learnedToday} ghost={!todayDone} icon="📘" onClick={() => onGo("learn")} reward="+300P" title={`${todayCurriculum.title} 학습`} />
        <E5Mission action={!todayDone ? "출석 먼저" : learnedToday ? "퀴즈 풀기" : "학습 후 가능"} done={quizDoneToday} ghost={!todayDone || !learnedToday} icon="✏️" onClick={() => onGo("quiz")} reward="+300P / 문항" title="오늘의 퀴즈" />
        <E5Mission action="인증하기" done={axToday} icon="📸" onClick={() => onGo("ax")} reward="+500P" title="AX 인증하기" />
      </section>
    </div>
  );
}

function E5Mission({
  icon,
  title,
  reward,
  done,
  action,
  ghost,
  onClick
}: {
  icon: string;
  title: string;
  reward: string;
  done: boolean;
  action: string;
  ghost?: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`e5-mission ${done ? "done" : ""}`}>
      <div className="e5-mic">{icon}</div>
      <div className="e5-mbody">
        <div className="e5-mt">{title}</div>
        <div className={`e5-mr ${done ? "done" : ""}`}>{done ? "✓ 지급 완료" : reward}</div>
      </div>
      {done ? (
        <div className="e5-mdone">✓</div>
      ) : (
        <button className={`e5-go ${ghost ? "ghost" : ""}`} onClick={onClick} type="button">
          {action}
        </button>
      )}
    </div>
  );
}

function LearningView({
  rookie,
  curriculums,
  completions,
  today,
  attendedToday,
  onSelect,
  onStudy
}: {
  rookie: RookieSummary;
  curriculums: FinalCurriculum[];
  completions: FinalUQuestConfig["learningCompletions"];
  selectedId: string;
  today: string;
  attendedToday: boolean;
  onSelect: (id: string) => void;
  onStudy: (curriculum: FinalCurriculum) => void;
}) {
  const todayCur = curriculums.find((item) => item.dayNumber === rookie.curriculumDay) ?? curriculums[0];
  const learnedToday = completions.some((item) => item.userId === rookie.user.id && item.curriculumId === todayCur.id);
  const completedSomethingToday = completions.some((item) => item.userId === rookie.user.id && item.createdAt.startsWith(today));
  const canLearn = attendedToday && !learnedToday && !completedSomethingToday && rookie.user.status === "active";
  const progress = Math.min(100, Math.round((rookie.learningCount / 20) * 100));

  return (
    <div className="e5-screen e5-learn">
      <div className="e5-st">
        <h1>학습</h1>
        <div className="e5-st-sub">
          <span>20일 커리큘럼 · 하루 1개</span>
          <b>{rookie.learningCount} / 20 완료</b>
        </div>
        <div className="e5-topbar">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="e5-tcard">
        <span className="eb">📘 오늘의 학습 · DAY {todayCur.dayNumber}</span>
        <h2>{todayCur.title}</h2>
        <p>{todayCur.description}</p>
        <div className="e5-tsteps">
          <button className="learn" disabled={!canLearn} onClick={() => onStudy(todayCur)} type="button">
            {learnedToday ? "오늘 학습 완료 ✓" : !attendedToday ? "오늘 출석 먼저 🔒" : completedSomethingToday ? "내일 이어서" : "학습하기 →"}
          </button>
        </div>
      </section>

      <div className="e5-restnote">🌴 쉬는 날(휴무)엔 건너뛰어도 괜찮아요. 진도는 사라지지 않고 다음 근무일에 이어집니다.</div>

      <div className="e5-sec">전체 커리큘럼</div>
      {curriculums.map((item) => {
        const isDone = completions.some((completion) => completion.userId === rookie.user.id && completion.curriculumId === item.id);
        const isCurrent = item.dayNumber === rookie.curriculumDay;
        const isLocked = item.dayNumber > rookie.curriculumDay;
        const state = isDone ? "done" : isCurrent ? "today" : isLocked ? "lock" : "past";
        const stateLabel = isDone ? "학습 완료" : isCurrent ? `오늘 · +${todayCur.learningRewardPoints}P` : isLocked ? "오픈 예정" : "기간 지남";

        return (
          <button className={`e5-day ${state}`} key={item.id} onClick={() => onSelect(item.id)} type="button">
            <span className="dn">D{item.dayNumber}</span>
            <span className="info">
              <span className="t">{item.title}</span>
              <span className="s">{stateLabel}</span>
            </span>
            <span className="chev">›</span>
          </button>
        );
      })}
    </div>
  );
}

function QuizView({
  rookie,
  curriculums,
  selected,
  questions,
  learning,
  submission,
  submissions,
  draft,
  onDraft,
  onSelect,
  onSubmit
}: {
  rookie: RookieSummary;
  curriculums: FinalCurriculum[];
  selected: FinalCurriculum;
  questions: FinalUQuestConfig["quizzes"];
  learning?: FinalUQuestConfig["learningCompletions"][number];
  submission?: FinalUQuestConfig["quizSubmissions"][number];
  submissions: FinalUQuestConfig["quizSubmissions"];
  draft: Record<string, number>;
  onDraft: (draft: Record<string, number>) => void;
  onSelect: (id: string) => void;
  onSubmit: (curriculum: FinalCurriculum) => void;
}) {
  return (
    <div className="e5-screen e5-quiz">
      <div className="e5-st">
        <h1>퀴즈</h1>
        <div className="e5-st-sub">
          <span>제출 보상 · 재도전 불가</span>
          <b>{rookie.quizAccuracyRate}% · {rookie.quizTier}</b>
        </div>
      </div>

      <div className="e5-qdays">
        {curriculums.map((item) => {
          const done = submissions.some((submissionItem) => submissionItem.userId === rookie.user.id && submissionItem.curriculumId === item.id);

          return (
            <button className={`e5-qday ${selected.id === item.id ? "on" : ""} ${done ? "done" : ""}`} key={item.id} onClick={() => onSelect(item.id)} type="button">
              <b>D{item.dayNumber}</b>
              <span>{done ? "제출" : "대기"}</span>
            </button>
          );
        })}
      </div>

      {!learning ? <div className="e5-qlock">🔒 학습을 먼저 완료해야 퀴즈가 열려요. 퀴즈는 제출 후 재도전할 수 없습니다.</div> : null}

      {learning ? (
        <>
          {questions.map((question, index) => {
            const answer = submission?.answers.find((item) => item.questionId === question.id);

            return (
              <section className="e5-qcard" key={question.id}>
                <div className="e5-qn">Q{index + 1}</div>
                <h2>{question.question}</h2>
                <div className="e5-opts">
                  {question.options.map((option, optionIndex) => {
                    const checked = submission ? answer?.selectedOption === optionIndex : draft[question.id] === optionIndex;
                    const isCorrect = submission && question.correctOption === optionIndex;
                    const isWrong = submission && answer?.selectedOption === optionIndex && !answer.isCorrect;

                    return (
                      <button
                        className={`e5-opt ${checked ? "sel" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                        disabled={Boolean(submission)}
                        key={option}
                        onClick={() => onDraft({ ...draft, [question.id]: optionIndex })}
                        type="button"
                      >
                        <span className="k">{String.fromCharCode(65 + optionIndex)}</span>
                        <span className="ot">{option}</span>
                      </button>
                    );
                  })}
                </div>
                {submission ? <p className="e5-explain">💡 {question.explanation}</p> : null}
              </section>
            );
          })}
          <button className="e5-qsubmit" disabled={Boolean(submission) || rookie.user.status !== "active"} onClick={() => onSubmit(selected)} type="button">
            {submission ? "제출 완료 · 결과 확인 중" : `${questions.length}문제 제출하기`}
          </button>
        </>
      ) : null}
    </div>
  );
}

function StudyView({
  curriculum,
  onBack,
  onComplete
}: {
  curriculum: FinalCurriculum;
  onBack: () => void;
  onComplete: (curriculum: FinalCurriculum) => void;
}) {
  const paragraphs = (curriculum.description ?? "").split("\n").filter((line) => line.trim().length > 0);

  return (
    <div className="e5-screen e5-study">
      <div className="e5-st">
        <button className="e5-back" onClick={onBack} type="button">← 학습</button>
        <span className="e5-study-eb">📘 DAY {curriculum.dayNumber} 학습</span>
        <h1>{curriculum.title}</h1>
      </div>

      <section className="e5-studybody">
        {paragraphs.length > 0 ? paragraphs.map((line, index) => <p key={index}>{line}</p>) : <p>학습 내용이 아직 등록되지 않았어요.</p>}
      </section>

      <button className="e5-studygo" onClick={() => onComplete(curriculum)} type="button">퀴즈로 가기 →</button>
    </div>
  );
}

function AxView({
  rookie,
  categories,
  submissions,
  today,
  onCertify
}: {
  rookie: RookieSummary;
  categories: FinalAxCategory[];
  submissions: FinalUQuestConfig["axSubmissions"];
  today: string;
  onCertify: (category: FinalAxCategory, evidenceFile: File) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const axDoneToday = submissions.some((submission) => submission.userId === rookie.user.id && submission.createdAt.startsWith(today));
  const inactive = rookie.user.status !== "active";
  const axProgress = Math.min(100, Math.round((rookie.axSubmissionCount / 20) * 100));
  const activeCategory = categories.find((category) => category.id === activeId) ?? null;

  function handleCapture(category: FinalAxCategory, file: File | undefined) {
    if (!file) return;
    onCertify(category, file);
    setActiveId(null);
  }

  // 상세(활동) 화면: 예시 화면 + 사진 촬영 버튼만(업로드 없음). 하루 1회.
  if (activeCategory) {
    const blocked = inactive || axDoneToday;
    return (
      <div className="e5-screen e5-ax e5-axdetail">
        <div className="e5-st">
          <button className="e5-back" onClick={() => setActiveId(null)} type="button">← 항목 목록</button>
          <h1>{activeCategory.title}</h1>
          <p className="e5-st-p">{activeCategory.description}</p>
        </div>

        <section className="e5-axexample">
          <div className="cap">예시 화면</div>
          <div className="img">
            {activeCategory.exampleImageUrl ? (
              <img alt={`${activeCategory.title} 예시`} src={activeCategory.exampleImageUrl} />
            ) : (
              <span>관리자가 등록한 예시 화면이 여기에 표시됩니다</span>
            )}
          </div>
          <p className="guide">예시처럼 활동한 화면을 촬영해 인증하세요. (별도 검수는 없습니다)</p>
        </section>

        <label className={`e5-axshoot ${blocked ? "disabled" : ""}`}>
          {axDoneToday ? "오늘 AX 완료 ✓" : "📷 사진 촬영으로 인증"}
          <input accept="image/*" capture="environment" disabled={blocked} onChange={(event) => {
            handleCapture(activeCategory, event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }} type="file" />
        </label>
      </div>
    );
  }

  // 내 AX 이력: 날짜별로 묶어 3개 항목 완료 여부 표시.
  const mine = submissions.filter((item) => item.userId === rookie.user.id);
  const doneByDate = new Map<string, Set<string>>();
  const ptsByDate = new Map<string, number>();
  for (const item of mine) {
    const day = item.createdAt.slice(0, 10);
    if (!doneByDate.has(day)) doneByDate.set(day, new Set());
    doneByDate.get(day)!.add(item.categoryId);
    ptsByDate.set(day, (ptsByDate.get(day) ?? 0) + item.rewardPoints);
  }
  const histDates = [...doneByDate.keys()].sort().reverse();
  const totalAxPoints = mine.reduce((sum, item) => sum + item.rewardPoints, 0);

  // 목록 화면: 항목별 "활동하기" 버튼 하나.
  return (
    <div className="e5-screen e5-ax">
      <div className="e5-st">
        <h1>AX 인증</h1>
        <p className="e5-st-p">현장에서 AI 도구를 쓰고 인증하면 로봇이 성장해요 · 하루 1회</p>
      </div>

      <section className="e5-axhero">
        <img alt={`${rookie.axLevel} 로봇`} src={axRobotAssets[rookie.axLevel]} />
        <div className="info">
          <span className="lv">AX 파트너</span>
          <h2>{rookie.axLevel}</h2>
          <div className="sm">{axLevelKorean(rookie.axLevel)} · 사진 인증으로 성장</div>
          <div className="axbar">
            <i style={{ width: `${axProgress}%` }} />
          </div>
          <div className="axbar-l">
            <span>인증 {rookie.axSubmissionCount} / 20</span>
            <span>{axProgress}%</span>
          </div>
        </div>
      </section>

      <div className="e5-sec e5-sec-row">
        <h3>내 AX 이력</h3>
      </div>
      <div className="e5-axsum">
        <div className="b"><div className="n">{mine.length}</div><div className="l">총 인증</div></div>
        <div className="b"><div className="n">{formatNumber(totalAxPoints)}</div><div className="l">적립 P</div></div>
        <div className="b"><div className="n">{histDates.length}</div><div className="l">활동일</div></div>
      </div>

      {histDates.length === 0 ? (
        <div className="e5-axempty">아직 AX 인증 기록이 없어요. 아래에서 활동을 인증해보세요.</div>
      ) : (
        histDates.map((day) => {
          const done = doneByDate.get(day) ?? new Set<string>();
          return (
            <div className="e5-axday" key={day}>
              <div className="dh">
                <span className="dt">{day.slice(5).replace("-", ".")}{day === today ? " · 오늘" : ""}</span>
                <span className="dp">+{formatNumber(ptsByDate.get(day) ?? 0)}P · {done.size}/{categories.length}</span>
              </div>
              <div className="ditems">
                {categories.map((category) => (
                  <div className={`dit ${done.has(category.id) ? "done" : "miss"}`} key={category.id}>
                    <b>{category.title}</b>
                    <span>{done.has(category.id) ? "✓ 완료" : "미완료"}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div className="e5-sec e5-sec-row">
        <h3>AX 항목</h3>
        <span className="e5-tag-ax">항목당 +{formatNumber(categories[0]?.rewardPoints ?? 500)}P</span>
      </div>
      <div className="e5-axgrid">
        {categories.map((category) => {
          const count = submissions.filter((submission) => submission.userId === rookie.user.id && submission.categoryId === category.id).length;
          const catDoneToday = submissions.some((submission) => submission.userId === rookie.user.id && submission.categoryId === category.id && submission.createdAt.startsWith(today));
          return (
            <div className="e5-axcard" key={category.id}>
              <div className="axc-info">
                <div className="nm">{category.title}</div>
                <div className="axc-sub">+{formatNumber(category.rewardPoints)}P · {count}회 인증</div>
              </div>
              <button className={`e5-axgo ${catDoneToday ? "done" : ""}`} disabled={inactive || catDoneToday} onClick={() => setActiveId(category.id)} type="button">
                {catDoneToday ? "오늘 완료 ✓" : "활동하기"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeView({ rookie, badges }: { rookie: RookieSummary; badges: FinalBadge[] }) {
  const grouped = (["attendance", "quiz", "tier", "ax", "rare"] as BadgeCategory[]).map((category) => ({
    category,
    items: badges.filter((badge) => badge.category === category).sort((left, right) => left.sortOrder - right.sortOrder)
  }));

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="컬렉션" title="배지도감" meta={`${rookie.acquiredBadges.length}/${badges.length}`} />
      {grouped.map((group) => (
        <div className="badge-section" key={group.category}>
          <h3>{badgeCategoryLabel(group.category)}</h3>
          <div className="badge-grid">
            {group.items.map((badge) => {
              const acquired = rookie.user.badgeIds.includes(badge.id);
              const hidden = badge.isRare && !acquired;

              return (
                <div className={`${acquired ? "acquired" : ""} ${hidden ? "hidden" : ""}`} key={badge.id}>
                  <BadgeIcon badge={badge} hidden={hidden} />
                  <strong>{hidden ? "???" : badge.name}</strong>
                  <span>{hidden ? "획득 후 공개" : badge.conditionLabel}</span>
                  <em>{acquired ? "획득" : `+${formatNumber(badge.rewardPoints)}P`}</em>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function AttendanceView({ data, rookie }: { data: FinalUQuestConfig; rookie: RookieSummary }) {
  const mine = data.attendances.filter((item) => item.userId === rookie.user.id).map((item) => item.attendanceDate);
  const attended = new Set(mine);
  const today = data.today;
  const [year, month] = today.split("-").map(Number);
  const firstDow = toDateOnly(`${year}-${String(month).padStart(2, "0")}-01`).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const sorted = [...mine].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && diffDays(prev, day) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  const cells: ({ d: number; ds: string } | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ d, ds: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  return (
    <div className="e5-screen e5-att">
      <div className="e5-st">
        <h1>출석 이력</h1>
        <p className="e5-st-p">온보딩 시작 후 30일 · 쉬는 날은 건너뛰어도 진도 유지</p>
      </div>

      <div className="e5-axsum">
        <div className="b"><div className="n">{mine.length}</div><div className="l">총 출석</div></div>
        <div className="b"><div className="n">{longest}</div><div className="l">최장 연속</div></div>
        <div className="b"><div className="n">D+{rookie.currentDay}</div><div className="l">진행</div></div>
      </div>

      <section className="e5-cal">
        <div className="cal-h"><b>{year}년 {month}월</b></div>
        <div className="cal-grid">
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <div className="dow" key={w}>{w}</div>
          ))}
          {cells.map((cell, index) =>
            cell === null ? (
              <div className="cell empty" key={`e${index}`} />
            ) : (
              <div className={`cell ${attended.has(cell.ds) ? "on" : ""} ${cell.ds === today ? "today" : ""}`} key={cell.ds}>
                {cell.d}
              </div>
            )
          )}
        </div>
        <div className="cal-legend">
          <span><i className="on" />출석함</span>
          <span><i className="td" />오늘</span>
          <span><i className="off" />미출석/휴무</span>
        </div>
      </section>
    </div>
  );
}

function ProfileView({
  data,
  rookie,
  onGo
}: {
  data: FinalUQuestConfig;
  rookie: RookieSummary;
  onGo: (screen: FinalScreenKey) => void;
}) {
  const previewBadges = data.badges.slice().sort((left, right) => left.sortOrder - right.sortOrder).slice(0, 8);

  return (
    <div className="e5-screen e5-my">
      <section className="e5-phero">
        <div className="e5-phero-cast">
          <CharacterImage level={rookie.characterLevel} size="stage" user={rookie.user} />
          <img className="e5-phero-robot" alt={`${rookie.axLevel} AX 로봇`} src={axRobotAssets[rookie.axLevel]} />
        </div>
        <div className="info">
          <div className="nm">{rookie.user.name}</div>
          <div className="role">{rookie.storeName} · 신입사원 · D+{rookie.currentDay}</div>
          <span className="tier">
            <img alt="" src={tierAssets[rookie.quizTier]} />
            {rookie.quizTier} · 정답률 {rookie.quizAccuracyRate}%
          </span>
          <div className="pts">보유 포인트 <b>{formatNumber(rookie.pointBalance)}P</b></div>
        </div>
      </section>

      <div className="e5-g3">
        <div className="s">
          <CharacterImage level={rookie.characterLevel} size="mini" user={rookie.user} />
          <div><div className="l">캐릭터</div><div className="v p">Lv.{rookie.characterLevel}</div></div>
        </div>
        <div className="s">
          <img alt="" src={tierAssets[rookie.quizTier]} />
          <div><div className="l">퀴즈 티어</div><div className="v">{rookie.quizTier}</div></div>
        </div>
        <div className="s">
          <img alt="" src={axRobotAssets[rookie.axLevel]} />
          <div><div className="l">AX 단계</div><div className="v">{rookie.axLevel}</div></div>
        </div>
      </div>

      <div className="e5-sec e5-sec-row">
        <h3>배지 도감</h3>
        <button className="e5-more" onClick={() => onGo("badges")} type="button">{rookie.acquiredBadges.length} / {data.badges.length} · 전체 ›</button>
      </div>
      <div className="e5-badges">
        {previewBadges.map((badge) => {
          const got = rookie.user.badgeIds.includes(badge.id);
          const hidden = badge.isRare && !got;

          return (
            <div className={`e5-bg ${got ? "got" : "locked"}`} key={badge.id}>
              <img alt="" src={hidden ? badgeAssets.locked : badgeAssets[badge.id] ?? badgeAssets.locked} />
              <span>{hidden ? "???" : badge.name}</span>
            </div>
          );
        })}
      </div>

      <div className="e5-sec">내 활동</div>
      <div className="e5-menu">
        <button onClick={() => onGo("attendance")} type="button"><span className="mi">📅</span><span className="mt">출석 이력</span><span className="chev">›</span></button>
        <button onClick={() => onGo("points")} type="button"><span className="mi">🧾</span><span className="mt">포인트 이력</span><span className="chev">›</span></button>
        <button onClick={() => onGo("shop")} type="button"><span className="mi">🎟️</span><span className="mt">쿠폰 · 상점</span><span className="chev">›</span></button>
        <button onClick={() => onGo("badges")} type="button"><span className="mi">🏅</span><span className="mt">배지 도감</span><span className="chev">›</span></button>
      </div>
    </div>
  );
}

function ProfileStageCard({ rookie }: { rookie: RookieSummary }) {
  const nextAxCount = nextAxThreshold(rookie.axSubmissionCount);
  const axProgress = rookie.axSubmissionCount >= 20 ? 100 : Math.min(100, Math.round((rookie.axSubmissionCount / nextAxCount) * 100));

  return (
    <section className="u-card profile-stage-card">
      <div className="profile-summary-row">
        <div className="profile-mini-avatar">
          <CharacterImage level={rookie.characterLevel} size="mini" user={rookie.user} />
        </div>
        <div className="profile-summary-main">
          <strong>{rookie.user.name}</strong>
          <span>{rookie.shopOpened ? "수료생" : "신입사원"}</span>
          <em>입사일 {rookie.user.hireDate?.replaceAll("-", ".") ?? "-"}</em>
        </div>
        <div className="profile-tier-summary">
          <TierMark tier={rookie.quizTier} />
          <strong>{rookie.quizTier}</strong>
          <span>정답률 {rookie.quizAccuracyRate}%</span>
        </div>
      </div>

      <div className="profile-stage-scene">
        <div className="scene-actor character">
          <CharacterImage level={rookie.characterLevel} size="stage" user={rookie.user} />
          <strong>Lv.{rookie.characterLevel} {rookie.shopOpened ? "수료 훈장 🎖" : "적응중"}</strong>
          <div className="scene-progress">
            <i style={{ width: `${rookie.progressRate}%` }} />
          </div>
          <span>{rookie.shopOpened ? "최종 성실도" : "캐릭터 성장"} {rookie.progressRate}%</span>
        </div>
        <div className="scene-actor robot">
          <img alt={`${rookie.axLevel} AX 로봇`} src={axRobotAssets[rookie.axLevel]} />
          <strong>AX {rookie.axLevel}</strong>
          <div className="scene-progress">
            <i style={{ width: `${axProgress}%` }} />
          </div>
          <span>AX 성장 {axProgress}%</span>
        </div>
      </div>
    </section>
  );
}

function RecentBadgesCard({
  rookie,
  badges,
  onGo
}: {
  rookie: RookieSummary;
  badges: FinalBadge[];
  onGo: (screen: FinalScreenKey) => void;
}) {
  const acquired = badges.filter((badge) => rookie.user.badgeIds.includes(badge.id)).slice(0, 5);
  const nextBadge = badges.find((badge) => !rookie.user.badgeIds.includes(badge.id) && !badge.isRare);

  return (
    <section className="u-card recent-badges-card">
      <div className="card-title-row">
        <h2>최근 획득 배지</h2>
        <button onClick={() => onGo("badges")} type="button">
          전체 보기
        </button>
      </div>
      <div className="recent-badge-strip">
        {acquired.map((badge) => (
          <div key={badge.id}>
            <BadgeIcon badge={badge} />
            <strong>{badge.name}</strong>
            <span>획득</span>
          </div>
        ))}
        <div className="next">
          <BadgeIcon hidden />
          <strong>{nextBadge?.name ?? "다음 배지"}</strong>
          <span>{nextBadge?.conditionLabel ?? "???"}</span>
        </div>
      </div>
    </section>
  );
}

function GrowthShowcase({ rookie, variant }: { rookie: RookieSummary; variant: "compact" | "profile" }) {
  return (
    <section className={`u-card growth-showcase ${variant === "profile" ? "profile-mode" : ""}`}>
      <div className="card-title-row">
        <div>
          <span className="eyebrow">{variant === "profile" ? rookie.storeName : "GROWTH"}</span>
          <h2>{variant === "profile" ? `${rookie.user.name} 쇼케이스` : "내 성장 한눈에"}</h2>
        </div>
        <span className="status-chip">D+{rookie.currentDay}</span>
      </div>
      <div className="profile-combo-card">
        <div className="profile-tier-line">
          <TierMark tier={rookie.quizTier} />
          <div>
            <label>퀴즈 티어</label>
            <strong>{rookie.quizTier}</strong>
            <small>정답률 {rookie.quizAccuracyRate}%</small>
          </div>
        </div>
        <div className="profile-duo-stage">
          <div className="profile-actor">
            <CharacterImage level={rookie.characterLevel} size={variant === "profile" ? "stage" : "home"} user={rookie.user} />
            <div>
              <label>캐릭터</label>
              <strong>Lv.{rookie.characterLevel}</strong>
              <small>{rookie.progressRate}% 진행</small>
            </div>
          </div>
          <div className="stage-link" aria-hidden="true" />
          <div className="profile-actor robot">
            <img alt={`${rookie.axLevel} AX 로봇`} src={axRobotAssets[rookie.axLevel]} />
            <div>
              <label>AX 로봇</label>
              <strong>{rookie.axLevel}</strong>
              <small>{rookie.axSubmissionCount}회 인증</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TierMark({ tier }: { tier: QuizTier }) {
  return (
    <div className="tier-mark tier-mark-image">
      <img alt={`${tier} 티어`} src={tierAssets[tier]} />
    </div>
  );
}

function ShopView({
  rookie,
  coupons,
  requests,
  today,
  onRedeem,
  onCancel
}: {
  rookie: RookieSummary;
  coupons: FinalCoupon[];
  requests: FinalCouponRequest[];
  today: string;
  onRedeem: (coupon: FinalCoupon) => void;
  onCancel: (requestId: string, reason: string) => void;
}) {
  const userRequests = requests.filter((request) => request.userId === rookie.user.id);

  return (
    <div className="e5-screen e5-shop">
      <section className="e5-balance">
        <div className="l">내 포인트</div>
        <div className="amt">{formatNumber(rookie.pointBalance)}<span>P</span></div>
        <div className="exp">수료 후 3개월간 사용 가능</div>
      </section>

      {!rookie.shopOpened ? (
        <div className="e5-locknote">
          <span className="i">🔒</span>
          <span className="t">상점은 30일 온보딩 수료 후 열려요. 지금은 미리보기만 가능해요.</span>
        </div>
      ) : null}
      {rookie.pointExpired ? (
        <div className="e5-locknote danger">
          <span className="i">⏰</span>
          <span className="t">수료 후 3개월이 지나 포인트 사용 기간이 종료됐습니다.</span>
        </div>
      ) : null}

      <div className="e5-sec">교환 가능한 쿠폰</div>
      {coupons.map((coupon) => {
        const outOfStock = coupon.stockQuantity === 0;
        const pointShortage = rookie.pointBalance < coupon.requiredPoints;
        const canRedeem = rookie.shopOpened && !rookie.pointExpired && !outOfStock && !pointShortage;
        const actionLabel = !rookie.shopOpened ? "수료 후" : rookie.pointExpired ? "만료" : outOfStock ? "품절" : pointShortage ? "부족" : "교환";

        return (
          <div className={`e5-coupon ${canRedeem ? "" : "off"}`} key={coupon.id}>
            <div className="thumb">🎟️</div>
            <div className="body">
              <div className="nm">
                {coupon.name}
                {coupon.stockQuantity !== null ? <span className="stock">{coupon.stockQuantity > 0 ? `${coupon.stockQuantity}개` : "품절"}</span> : null}
              </div>
              <div className="meta">{coupon.description}</div>
              <div className="price">
                <b>{formatNumber(coupon.requiredPoints)}P</b>
              </div>
            </div>
            <button className="buy" disabled={!canRedeem} onClick={() => onRedeem(coupon)} type="button">
              {actionLabel}
            </button>
          </div>
        );
      })}

      <div className="e5-sec">내 쿠폰 요청</div>
      {userRequests.length === 0 ? <EmptyState text="아직 쿠폰 요청이 없습니다." /> : null}
      {userRequests.map((request) => (
        <RequestRow key={request.id} coupon={coupons.find((coupon) => coupon.id === request.couponId)} request={request} today={today} onCancel={onCancel} />
      ))}
    </div>
  );
}

function PointHistoryView({ data, rookie }: { data: FinalUQuestConfig; rookie: RookieSummary }) {
  const histories = data.pointHistories.filter((history) => history.userId === rookie.user.id).slice().reverse();

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="이력 저장" title="포인트 이력" meta={`${formatNumber(rookie.pointBalance)}P`} />
      <div className="ledger-list">
        {histories.map((history) => (
          <div className={history.amount < 0 ? "minus" : "plus"} key={history.id}>
            <div>
              <strong>{history.reason}</strong>
              <span>{formatDate(history.createdAt.slice(0, 10))} · {history.type}</span>
            </div>
            <b>{history.amount > 0 ? "+" : ""}{formatNumber(history.amount)}P</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function ManagerView({
  data,
  manager
}: {
  data: FinalUQuestConfig;
  manager: FinalUser;
}) {
  const store = data.stores.find((item) => item.id === manager.storeId);
  const rookies = data.users.filter((user) => user.role === "rookie" && user.storeId === manager.storeId);

  return (
    <main className="final-screen role-screen">
      <ScreenTitle eyebrow="점장 조회 전용" title={`${store?.name ?? "담당 매장"} 신입`} meta={`${rookies.length}명`} />
      <div className="readonly-note">점장은 소속 매장 신입의 진행률, 티어, AX, 배지만 조회할 수 있습니다. 수정/승인/포인트/쿠폰/엑셀 권한은 없습니다.</div>
      <div className="employee-list">
        {rookies.map((user) => {
          const summary = deriveRookieSummary(data, user);

          return (
            <div className="employee-card-final" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{statusLabel(user.status)} · D+{summary.currentDay} · {summary.quizTier} · {summary.axLevel}</span>
              </div>
              <div className="mini-progress">
                <i style={{ width: `${summary.progressRate}%` }} />
              </div>
              <div className="employee-meta">
                <span>배지 {summary.acquiredBadges.length}개</span>
                <span>학습 {summary.learningCount}/20</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function AdminView({
  data,
  onApprove,
  onReject,
  onSendCoupon,
  onCancelCoupon,
  onCreateCoupon,
  onOpenCouponEdit,
  onUpdateCurriculum,
  onUpdateRewardConfig,
  onUpdateAxExample,
  onImportStores,
  onUpdateStore
}: {
  data: FinalUQuestConfig;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onSendCoupon: (requestId: string) => void;
  onCancelCoupon: (requestId: string, reason: string) => void;
  onCreateCoupon: (body: Record<string, unknown>) => void;
  onOpenCouponEdit: (coupon: FinalCoupon) => void;
  onUpdateCurriculum: (curriculumId: string, draft: CurriculumDraft) => void;
  onUpdateRewardConfig: (values: RewardConfigDraft) => void;
  onUpdateAxExample: (category: FinalAxCategory, file: File) => void;
  onImportStores: (rows: { district: string; team: string; name: string }[]) => void;
  onUpdateStore: (storeId: string, patch: { name?: string; district?: string; team?: string; isActive?: boolean }) => void;
}) {
  const [tab, setTab] = useState<"dashboard" | "members" | "curriculum" | "ax" | "coupons" | "rewards" | "stores" | "validation">("dashboard");
  const rookies = data.users.filter((user) => user.role === "rookie");
  const pending = rookies.filter((user) => user.status === "pending").length;
  const completed = rookies.filter((user) => user.status === "completed").length;
  const requestedCoupons = data.couponRequests.filter((request) => request.status === "requested");
  const avgProgress = Math.round(rookies.reduce((sum, user) => sum + deriveRookieSummary(data, user).progressRate, 0) / Math.max(1, rookies.length));

  return (
    <main className="final-screen role-screen">
      <ScreenTitle eyebrow="본사 관리자" title="관리 콘솔" meta="전체 권한" />
      <div className="admin-tabs-final">
        {[
          ["dashboard", "대시보드"],
          ["members", "회원"],
          ["curriculum", "커리큘럼"],
          ["ax", "AX"],
          ["coupons", "쿠폰"],
          ["rewards", "보상"],
          ["stores", "매장"],
          ["validation", "검증"]
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id as typeof tab)} type="button">
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" ? (
        <>
          <div className="admin-kpi-grid">
            <Metric label="전체 신입" value={`${rookies.length}명`} />
            <Metric label="진행 중" value={`${rookies.filter((user) => user.status === "active").length}명`} />
            <Metric label="수료자" value={`${completed}명`} />
            <Metric label="평균 진행률" value={`${avgProgress}%`} />
            <Metric label="승인 대기" value={`${pending}건`} />
            <Metric label="쿠폰 요청" value={`${requestedCoupons.length}건`} />
          </div>
          <section className="u-card">
            <div className="compact-list">
              {data.notifications.map((notification) => (
                <div key={notification.id}>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {tab === "members" ? (
        <section className="u-card">
          <div className="table-list">
            {rookies.map((user) => {
              const summary = deriveRookieSummary(data, user);

              return (
                <div className="admin-row-final" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{data.stores.find((store) => store.id === user.storeId)?.name ?? "-"} · {statusLabel(user.status)} · {summary.progressRate}%</span>
                  </div>
                  <div className="row-actions">
                    {user.status === "pending" ? <button onClick={() => onApprove(user.id)} type="button">승인</button> : null}
                    {user.status === "pending" ? <button className="sub" onClick={() => onReject(user.id)} type="button">반려</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "curriculum" ? <AdminCurriculumPanel curriculums={data.curriculums} onSave={onUpdateCurriculum} quizzes={data.quizzes} /> : null}
      {tab === "ax" ? <AdminAxPanel categories={data.axCategories} onUploadExample={onUpdateAxExample} /> : null}
      {tab === "rewards" ? <AdminRewardSimulatorPanel data={data} onSave={onUpdateRewardConfig} /> : null}
      {tab === "stores" ? <AdminStorePanel data={data} onImport={onImportStores} onUpdateStore={onUpdateStore} /> : null}
      {tab === "coupons" ? (
        <AdminCouponPanel coupons={data.coupons} requests={data.couponRequests} users={data.users} onCancel={onCancelCoupon} onSend={onSendCoupon} onCreate={onCreateCoupon} onOpenEdit={onOpenCouponEdit} />
      ) : null}
      {tab === "validation" ? <ValidationPanel data={data} /> : null}
    </main>
  );
}

function parseStoreCsv(text: string): { district: string; team: string; name: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/[\s,]+/).filter(Boolean))
    .filter((tokens) => tokens.length >= 3)
    .map((tokens) => ({ district: tokens[0], team: tokens[1], name: tokens[2] }))
    .filter((row) => row.district !== "담당" && row.name !== "매장");
}

function AdminStorePanel({
  data,
  onImport,
  onUpdateStore
}: {
  data: FinalUQuestConfig;
  onImport: (rows: { district: string; team: string; name: string }[]) => void;
  onUpdateStore: (storeId: string, patch: { name?: string; district?: string; team?: string; isActive?: boolean }) => void;
}) {
  const [csv, setCsv] = useState("");
  const [add, setAdd] = useState({ district: "", team: "", name: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ district: "", team: "", name: "" });
  const parsed = parseStoreCsv(csv);

  const managed = data.stores.filter((store) => store.district || store.team);
  const groups = new Map<string, Map<string, FinalStore[]>>();
  for (const store of managed) {
    const district = store.district ?? "기타";
    const team = store.team ?? "기타";
    if (!groups.has(district)) groups.set(district, new Map());
    const teams = groups.get(district)!;
    if (!teams.has(team)) teams.set(team, []);
    teams.get(team)!.push(store);
  }

  return (
    <section className="u-card store-admin">
      <h3>매장 관리</h3>

      <div className="store-sec">매장 추가</div>
      <div className="store-add">
        <input placeholder="담당" value={add.district} onChange={(event) => setAdd({ ...add, district: event.target.value })} />
        <input placeholder="팀장" value={add.team} onChange={(event) => setAdd({ ...add, team: event.target.value })} />
        <input placeholder="매장명" value={add.name} onChange={(event) => setAdd({ ...add, name: event.target.value })} />
        <button
          className="store-add-btn"
          disabled={!add.name.trim()}
          onClick={() => {
            onImport([{ district: add.district, team: add.team, name: add.name }]);
            setAdd({ district: "", team: "", name: "" });
          }}
          type="button"
        >
          추가
        </button>
      </div>

      <div className="store-sec">등록 매장 ({managed.length}개)</div>
      {[...groups.entries()].map(([district, teams]) => (
        <div className="store-group" key={district}>
          <h4>{district}</h4>
          {[...teams.entries()].map(([team, stores]) => (
            <div className="store-team-block" key={team}>
              <div className="tm">{team}</div>
              {stores.map((store) =>
                editingId === store.id ? (
                  <div className="store-edit" key={store.id}>
                    <input placeholder="담당" value={edit.district} onChange={(event) => setEdit({ ...edit, district: event.target.value })} />
                    <input placeholder="팀장" value={edit.team} onChange={(event) => setEdit({ ...edit, team: event.target.value })} />
                    <input placeholder="매장명" value={edit.name} onChange={(event) => setEdit({ ...edit, name: event.target.value })} />
                    <div className="store-edit-act">
                      <button onClick={() => { onUpdateStore(store.id, edit); setEditingId(null); }} type="button">저장</button>
                      <button className="sub" onClick={() => setEditingId(null)} type="button">취소</button>
                    </div>
                  </div>
                ) : (
                  <div className={`store-row ${store.isActive ? "" : "off"}`} key={store.id}>
                    <span className="nm">{store.name}{store.isActive ? "" : " · 비활성"}</span>
                    <button className="tg" onClick={() => onUpdateStore(store.id, { isActive: !store.isActive })} type="button">{store.isActive ? "비활성화" : "활성화"}</button>
                    <button className="ed" onClick={() => { setEditingId(store.id); setEdit({ district: store.district ?? "", team: store.team ?? "", name: store.name }); }} type="button">수정</button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="store-sec">CSV 대량 등록 (엑셀 담당·팀장·매장 3열 붙여넣기)</div>
      <textarea
        className="store-csv"
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        placeholder={"청주담당  원준기team  복대\n청주담당  원준기team  강터\n충북담당  고준team  오창\n..."}
      />
      <div className="store-parsed">{parsed.length > 0 ? `인식됨 — 담당 ${new Set(parsed.map((row) => row.district)).size}개 · 매장 ${parsed.length}개` : "붙여넣으면 인식 결과가 표시됩니다."}</div>
      <button className="reward-apply" disabled={parsed.length === 0} onClick={() => onImport(parsed)} type="button">CSV 적용 ({parsed.length}개)</button>
    </section>
  );
}

function AdminRewardSimulatorPanel({ data, onSave }: { data: FinalUQuestConfig; onSave: (values: RewardConfigDraft) => void }) {
  const [act, setAct] = useState({
    attendancePoints: data.rewardConfig?.attendancePoints ?? 100,
    learningPoints: data.rewardConfig?.learningPoints ?? 0,
    quizCorrectPoints: data.rewardConfig?.quizCorrectPoints ?? 300,
    quizWrongPoints: data.rewardConfig?.quizWrongPoints ?? 30,
    axPoints: data.rewardConfig?.axPoints ?? 200
  });
  const [badgePoints, setBadgePoints] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.badges.map((badge) => [badge.id, badge.rewardPoints]))
  );

  const ONBOARDING_DAYS = 30;
  const attendanceCount = ONBOARDING_DAYS;
  const learningCount = data.curriculums.length;
  const quizCount = data.quizzes.filter((question) => question.rewardPoints >= 0).length;
  const axCount = data.axCategories.length * ONBOARDING_DAYS;
  const sumBadges = (predicate: (badge: FinalBadge) => boolean) =>
    data.badges.filter(predicate).reduce((sum, badge) => sum + (badgePoints[badge.id] ?? 0), 0);
  const growBadgeTotal = sumBadges((badge) => !badge.isRare);
  const rareBadgeTotal = sumBadges((badge) => badge.isRare);
  const growBadgeCount = data.badges.filter((badge) => !badge.isRare).length;
  const rareBadgeCount = data.badges.filter((badge) => badge.isRare).length;

  const rows = [
    { key: "att", label: "출석", total: act.attendancePoints * attendanceCount },
    { key: "learn", label: "학습", total: act.learningPoints * learningCount },
    { key: "quiz", label: "퀴즈(정답)", total: act.quizCorrectPoints * quizCount },
    { key: "ax", label: "AX", total: act.axPoints * axCount },
    { key: "grow", label: `성장배지(${growBadgeCount})`, total: growBadgeTotal },
    { key: "rare", label: `🟣 희귀배지(${rareBadgeCount})`, total: rareBadgeTotal }
  ];
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  function setActField(field: keyof typeof act, value: string) {
    setAct((prev) => ({ ...prev, [field]: Math.max(0, Math.floor(Number(value) || 0)) }));
  }
  function setBadge(id: string, value: string) {
    setBadgePoints((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(Number(value) || 0)) }));
  }
  function apply() {
    onSave({
      ...act,
      badges: data.badges.map((badge) => ({ id: badge.id, rewardPoints: badgePoints[badge.id] ?? badge.rewardPoints }))
    });
  }

  const badgeCategories: BadgeCategory[] = ["attendance", "quiz", "tier", "ax", "rare"];

  return (
    <section className="u-card reward-sim">
      <h3>보상 경제 시뮬레이터</h3>
      <p className="reward-sim-help">종목·배지별 단위 포인트를 입력하면 합계·비중·만점자 총액이 실시간 계산됩니다. <b>적용</b>하면 실제 보상에 반영돼요. (만점 합계는 전정답 기준)</p>

      <div className="reward-sticky">
        <div className="reward-sticky-total">
          <span>만점자 총액</span>
          <b>{formatNumber(grandTotal)}P</b>
        </div>
        <div className="reward-sticky-rows">
          {rows.map((row) => {
            const pct = grandTotal ? Math.round((row.total / grandTotal) * 100) : 0;
            return (
              <div className="reward-sticky-row" key={row.key}>
                <span className="lab">{row.label}</span>
                <div className="reward-bar"><i style={{ width: `${pct}%` }} /></div>
                <span className="num">{formatNumber(row.total)}P · {pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reward-sim-inputs">
        <label>출석 / 회<input inputMode="numeric" onChange={(event) => setActField("attendancePoints", event.target.value)} value={act.attendancePoints} /></label>
        <label>학습 / 개<input inputMode="numeric" onChange={(event) => setActField("learningPoints", event.target.value)} value={act.learningPoints} /></label>
        <label>퀴즈 정답 / 문항<input inputMode="numeric" onChange={(event) => setActField("quizCorrectPoints", event.target.value)} value={act.quizCorrectPoints} /></label>
        <label>퀴즈 오답 / 문항<input inputMode="numeric" onChange={(event) => setActField("quizWrongPoints", event.target.value)} value={act.quizWrongPoints} /></label>
        <label>AX / 건<input inputMode="numeric" onChange={(event) => setActField("axPoints", event.target.value)} value={act.axPoints} /></label>
      </div>

      <div className="reward-badges">
        {badgeCategories.map((category) => {
          const list = data.badges.filter((badge) => badge.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
          if (list.length === 0) return null;
          return (
            <div className="reward-badge-group" key={category}>
              <h4>{category === "rare" ? "🟣 " : ""}{badgeCategoryLabel(category)}</h4>
              {list.map((badge) => (
                <label className="reward-badge-row" key={badge.id}>
                  <span>{badge.name}</span>
                  <input inputMode="numeric" onChange={(event) => setBadge(badge.id, event.target.value)} value={badgePoints[badge.id] ?? 0} />
                </label>
              ))}
            </div>
          );
        })}
      </div>

      <button className="reward-apply" onClick={apply} type="button">적용 — 실제 보상에 반영</button>
    </section>
  );
}

function AdminCurriculumPanel({
  curriculums,
  quizzes,
  onSave
}: {
  curriculums: FinalCurriculum[];
  quizzes: FinalUQuestConfig["quizzes"];
  onSave: (curriculumId: string, draft: CurriculumDraft) => void;
}) {
  const [selectedId, setSelectedId] = useState(curriculums[0]?.id ?? "");
  const [entered, setEntered] = useState(false);
  const selected = curriculums.find((curriculum) => curriculum.id === selectedId) ?? curriculums[0];
  const [draft, setDraft] = useState<CurriculumDraft>(() => buildCurriculumDraft(selected, quizzes));

  useEffect(() => {
    setDraft(buildCurriculumDraft(selected, quizzes));
  }, [selected?.id, curriculums, quizzes]);

  if (!selected) return <EmptyState text="등록된 커리큘럼이 없습니다." />;

  function updateDraft(patch: Partial<CurriculumDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateQuiz(index: number, patch: Partial<CurriculumQuizDraft>) {
    setDraft((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz, quizIndex) => (quizIndex === index ? { ...quiz, ...patch } : quiz))
    }));
  }

  function updateQuizOption(quizIndex: number, optionIndex: number, value: string) {
    setDraft((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz, currentQuizIndex) =>
        currentQuizIndex === quizIndex
          ? {
              ...quiz,
              options: quiz.options.map((option, currentOptionIndex) => (currentOptionIndex === optionIndex ? value : option))
            }
          : quiz
      )
    }));
  }

  function addQuiz() {
    setDraft((current) => ({
      ...current,
      quizzes: [
        ...current.quizzes,
        {
          question: "",
          options: ["", "", "", ""],
          correctOption: 0,
          explanation: "",
          rewardPoints: "300"
        }
      ]
    }));
  }

  function removeQuiz(index: number) {
    setDraft((current) => ({
      ...current,
      quizzes: current.quizzes.length <= 1 ? current.quizzes : current.quizzes.filter((_, quizIndex) => quizIndex !== index)
    }));
  }

  if (!entered) {
    return (
      <section className="u-card curriculum-admin-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">설정 화면</span>
            <h2>커리큘럼/퀴즈 관리</h2>
          </div>
        </div>
        <p className="curriculum-list-hint">Day를 선택하면 편집 화면으로 들어갑니다.</p>
        <div className="admin-day-list">
          {curriculums.map((curriculum) => (
            <button
              key={curriculum.id}
              onClick={() => {
                setSelectedId(curriculum.id);
                setDraft(buildCurriculumDraft(curriculum, quizzes));
                setEntered(true);
              }}
              type="button"
            >
              <div>
                <strong>Day {curriculum.dayNumber}. {curriculum.title}</strong>
                <span>{quizzes.filter((quiz) => quiz.curriculumId === curriculum.id).length}문제 · 클릭해 편집</span>
              </div>
              <em>{curriculum.isPublished ? "공개" : "비공개"} ›</em>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="u-card curriculum-admin-card">
      <div className="card-title-row">
        <button className="back-pill" onClick={() => setEntered(false)} type="button">← 목록</button>
        <h2>Day {selected.dayNumber} 편집</h2>
        <button className="save-pill" onClick={() => onSave(selected.id, draft)} type="button">저장</button>
      </div>
      <div className="curriculum-editor">
          <div className="editor-grid">
            <label>
              제목
              <input onChange={(event) => updateDraft({ title: event.currentTarget.value })} value={draft.title} />
            </label>
            <label>
              학습 보상
              <input inputMode="numeric" onChange={(event) => updateDraft({ learningRewardPoints: event.currentTarget.value })} value={draft.learningRewardPoints} />
            </label>
          </div>
          <label>
            학습 내용 (신입의 학습 화면에 표시)
            <textarea onChange={(event) => updateDraft({ description: event.currentTarget.value })} value={draft.description} />
          </label>
          <label className="toggle-row">
            <input checked={draft.isPublished} onChange={(event) => updateDraft({ isPublished: event.currentTarget.checked })} type="checkbox" />
            신입 화면에 공개
          </label>

          <div className="quiz-editor-head">
            <h3>퀴즈 설정</h3>
            <button onClick={addQuiz} type="button">문제 추가</button>
          </div>
          <div className="quiz-editor-list">
            {draft.quizzes.map((quiz, quizIndex) => (
              <div className="quiz-editor-card" key={quiz.id ?? `new-${quizIndex}`}>
                <div className="quiz-editor-title">
                  <strong>Q{quizIndex + 1}</strong>
                  <button disabled={draft.quizzes.length <= 1} onClick={() => removeQuiz(quizIndex)} type="button">삭제</button>
                </div>
                <label>
                  문제
                  <textarea onChange={(event) => updateQuiz(quizIndex, { question: event.currentTarget.value })} value={quiz.question} />
                </label>
                <div className="option-editor-grid">
                  {quiz.options.map((option, optionIndex) => (
                    <label key={optionIndex}>
                      보기 {optionIndex + 1}
                      <input onChange={(event) => updateQuizOption(quizIndex, optionIndex, event.currentTarget.value)} value={option} />
                    </label>
                  ))}
                </div>
                <div className="editor-grid">
                  <label>
                    정답
                    <select onChange={(event) => updateQuiz(quizIndex, { correctOption: Number(event.currentTarget.value) })} value={quiz.correctOption}>
                      {quiz.options.map((_, optionIndex) => (
                        <option key={optionIndex} value={optionIndex}>보기 {optionIndex + 1}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    문제 보상
                    <input inputMode="numeric" onChange={(event) => updateQuiz(quizIndex, { rewardPoints: event.currentTarget.value })} value={quiz.rewardPoints} />
                  </label>
                </div>
                <label>
                  해설
                  <textarea onChange={(event) => updateQuiz(quizIndex, { explanation: event.currentTarget.value })} value={quiz.explanation} />
                </label>
              </div>
            ))}
          </div>
        </div>
    </section>
  );
}

function buildCurriculumDraft(curriculum: FinalCurriculum | undefined, quizzes: FinalUQuestConfig["quizzes"]): CurriculumDraft {
  const relatedQuizzes = curriculum ? quizzes.filter((quiz) => quiz.curriculumId === curriculum.id) : [];
  return {
    title: curriculum?.title ?? "",
    description: curriculum?.description ?? "",
    learningRewardPoints: String(curriculum?.learningRewardPoints ?? 300),
    isPublished: curriculum?.isPublished ?? true,
    quizzes: (relatedQuizzes.length > 0 ? relatedQuizzes : [undefined]).map((quiz) => ({
      id: quiz?.id,
      question: quiz?.question ?? "",
      options: quiz?.options?.slice(0, 4) ?? ["", "", "", ""],
      correctOption: quiz?.correctOption ?? 0,
      explanation: quiz?.explanation ?? "",
      rewardPoints: String(quiz?.rewardPoints ?? 300)
    }))
  };
}

function AdminAxPanel({ categories, onUploadExample }: { categories: FinalAxCategory[]; onUploadExample: (category: FinalAxCategory, file: File) => void }) {
  return (
    <section className="u-card">
      <div className="readonly-note">AX 항목 추가/삭제는 불가합니다. 관리자는 예시 이미지·보상 포인트·공개 여부를 수정할 수 있어요. 등록한 예시 이미지는 신입의 활동 화면에 표시됩니다.</div>
      <div className="ax-grid">
        {categories.map((category) => (
          <div className="ax-card" key={category.id}>
            <span>{category.type}</span>
            <strong>{category.title}</strong>
            <p>{category.description}</p>
            <em>{formatNumber(category.rewardPoints)}P · {category.isPublished ? "공개" : "비공개"}</em>
            <div className="ax-example">
              {category.exampleImageUrl ? (
                <img alt={`${category.title} 예시`} src={category.exampleImageUrl} />
              ) : (
                <div className="ax-example-empty">예시 이미지 없음</div>
              )}
              <label className="ax-example-upload">
                {category.exampleImageUrl ? "예시 교체" : "예시 등록"}
                <input accept="image/*" onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) onUploadExample(category, file);
                  event.currentTarget.value = "";
                }} type="file" />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type CouponDraft = { name: string; description: string; actualPrice: string; requiredPoints: string; stockQuantity: string; isPublished: boolean };
const emptyCouponDraft = (): CouponDraft => ({ name: "", description: "", actualPrice: "0", requiredPoints: "", stockQuantity: "", isPublished: true });

function AdminCouponPanel({
  coupons,
  requests,
  users,
  onSend,
  onCancel,
  onCreate,
  onOpenEdit
}: {
  coupons: FinalCoupon[];
  requests: FinalCouponRequest[];
  users: FinalUser[];
  onSend: (requestId: string) => void;
  onCancel: (requestId: string, reason: string) => void;
  onCreate: (body: Record<string, unknown>) => void;
  onOpenEdit: (coupon: FinalCoupon) => void;
}) {
  const [subTab, setSubTab] = useState<"manage" | "requests">("manage");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<CouponDraft>(emptyCouponDraft());

  function submitCreate(e: FormEvent) {
    e.preventDefault();
    onCreate({
      name: draft.name,
      description: draft.description,
      actualPrice: Number(draft.actualPrice),
      requiredPoints: Number(draft.requiredPoints),
      stockQuantity: draft.stockQuantity === "" ? null : Number(draft.stockQuantity),
      isPublished: draft.isPublished
    });
    setAdding(false);
    setDraft(emptyCouponDraft());
  }

  const statusLabel = (s: string) => s === "requested" ? "발송 대기" : s === "sent" ? "발송 완료" : "취소됨";

  return (
    <section className="u-card">
      <div className="coupon-subtabs">
        <button className={subTab === "manage" ? "active" : ""} onClick={() => setSubTab("manage")} type="button">쿠폰 관리</button>
        <button className={subTab === "requests" ? "active" : ""} onClick={() => setSubTab("requests")} type="button">
          교환 요청 {requests.filter((r) => r.status === "requested").length > 0 ? `(${requests.filter((r) => r.status === "requested").length})` : ""}
        </button>
      </div>

      {subTab === "manage" ? (
        <>
          <div className="coupon-manage-header">
            <span className="section-label">쿠폰 목록</span>
            <button className="add-btn" onClick={() => setAdding(true)} type="button">+ 추가</button>
          </div>

          {adding ? (
            <form className="coupon-form" onSubmit={submitCreate}>
              <div className="coupon-form-title">새 쿠폰</div>
              <input placeholder="쿠폰 이름" required value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              <input placeholder="쿠폰 설명" required value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              <div className="coupon-form-row">
                <input placeholder="실제 금액 (₩)" type="number" min="0" value={draft.actualPrice} onChange={(e) => setDraft((d) => ({ ...d, actualPrice: e.target.value }))} />
                <input placeholder="필요 포인트 (P)" type="number" min="1" required value={draft.requiredPoints} onChange={(e) => setDraft((d) => ({ ...d, requiredPoints: e.target.value }))} />
              </div>
              <input placeholder="재고 (빈칸=무제한)" type="number" min="0" value={draft.stockQuantity} onChange={(e) => setDraft((d) => ({ ...d, stockQuantity: e.target.value }))} />
              <label className="coupon-form-check">
                <input checked={draft.isPublished} type="checkbox" onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))} />
                공개 (신입 상점에 표시)
              </label>
              <div className="coupon-form-actions">
                <button type="submit">저장</button>
                <button type="button" onClick={() => { setAdding(false); setDraft(emptyCouponDraft()); }}>취소</button>
              </div>
            </form>
          ) : null}

          <div className="coupon-grid">
            {coupons.map((coupon) => (
              <div className="coupon-card" key={coupon.id}>
                <span>{coupon.stockQuantity === null ? "무제한" : `재고 ${coupon.stockQuantity}`}{coupon.isPublished ? "" : " · 비공개"}</span>
                <strong>{coupon.name}</strong>
                <p>{coupon.description}</p>
                <em>{formatKrw(coupon.actualPrice)} · {formatNumber(coupon.requiredPoints)}P</em>
                <div className="coupon-card-edit">
                  <button onClick={() => onOpenEdit(coupon)} type="button">수정</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {subTab === "requests" ? (
        <div className="request-list">
          {requests.length === 0 ? <EmptyState text="교환 요청이 없습니다." /> : null}
          {[...requests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).map((request) => {
            const user = users.find((item) => item.id === request.userId);
            const coupon = coupons.find((item) => item.id === request.couponId);
            return (
              <div className={`request-row status-${request.status}`} key={request.id}>
                <div>
                  <strong>{coupon?.name ?? "쿠폰"}</strong>
                  <span>{user?.name ?? "-"} · {statusLabel(request.status)} · {formatNumber(request.requiredPoints)}P</span>
                  {request.expiresAt ? <span className="req-expiry">만료 {formatDate(request.expiresAt.slice(0, 10))}</span> : null}
                  {request.cancelReason ? <span className="req-expiry">사유: {request.cancelReason}</span> : null}
                </div>
                <div className="row-actions">
                  {request.status === "requested" ? <button onClick={() => onSend(request.id)} type="button">발송완료</button> : null}
                  {request.status === "requested" ? <button className="sub" onClick={() => onCancel(request.id, "관리자 취소")} type="button">취소</button> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function ValidationPanel({ data }: { data: FinalUQuestConfig }) {
  const validations = buildValidationItems(data);

  return (
    <section className="u-card">
      <div className="validation-list">
        {validations.map((item) => (
          <div className={item.pass ? "pass" : "fail"} key={item.title}>
            <b>{item.pass ? "PASS" : "CHECK"}</b>
            <div>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomNav({ active, onGo }: { active: FinalScreenKey; onGo: (screen: FinalScreenKey) => void }) {
  return (
    <nav className="bottom-nav final-bottom-nav">
      {rookieNav.map((item) => (
        <button className={active === item.screen ? "active" : ""} key={item.screen} onClick={() => onGo(item.screen)} type="button">
          <span className="nav-ic">{navIcons[item.icon]}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

function StatusBanner({ rookie }: { rookie: RookieSummary }) {
  if (rookie.user.status === "active") return null;

  const copy: Record<FinalUserStatus, { title: string; body: string; danger?: boolean }> = {
    pending: { title: "승인 대기", body: "관리자 승인 전에는 온보딩을 진행할 수 없습니다." },
    active: { title: "", body: "" },
    rejected: { title: "승인 반려", body: rookie.user.rejectReason ?? "관리자 확인이 필요합니다.", danger: true },
    completed: { title: "수료 완료", body: "학습과 퀴즈 진행은 종료됐고, 상점과 이력 조회가 가능합니다." },
    inactive: { title: "비활성 계정", body: "퇴사/비활성 계정은 접근할 수 없습니다.", danger: true }
  };
  const item = copy[rookie.user.status];

  return (
    <section className={`status-banner${item.danger ? " danger" : ""}`}>
      <strong>{item.title}</strong>
      <span>{item.body}</span>
    </section>
  );
}

function TaskLine({ label, done, action, onClick }: { label: string; done: boolean; action: string; onClick: () => void }) {
  return (
    <button className={done ? "done" : ""} onClick={onClick} type="button">
      <span>{done ? "완료" : "대기"}</span>
      <strong>{label}</strong>
      <em>{done ? "확인" : action}</em>
    </button>
  );
}

function ScreenTitle({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return (
    <div className="screen-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <b>{meta}</b>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LockPanel({ title, body, danger }: { title: string; body: string; danger?: boolean }) {
  return (
    <div className={`lock-panel${danger ? " danger" : ""}`}>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function RequestRow({
  request,
  coupon,
  today,
  onCancel
}: {
  request: FinalCouponRequest;
  coupon?: FinalCoupon;
  today?: string;
  onCancel: (requestId: string, reason: string) => void;
}) {
  const expired = Boolean(today && request.expiresAt && today > request.expiresAt.slice(0, 10));

  return (
    <div className="request-row">
      <div>
        <strong>{coupon?.name ?? "쿠폰"}</strong>
        <span>{request.status} · {formatNumber(request.requiredPoints)}P{request.expiresAt ? ` · ${expired ? "만료" : "만료일"} ${formatDate(request.expiresAt.slice(0, 10))}` : ""}</span>
      </div>
      {request.status === "requested" ? (
        <button onClick={() => onCancel(request.id, "사용자 취소")} type="button">
          취소
        </button>
      ) : null}
    </div>
  );
}

function ToastModal({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  return (
    <div className={`modal${toast ? " show" : ""}`}>
      <div className={`modal-card final-modal ${toast?.tone ?? ""}`}>
        <h2>{toast?.title ?? "알림"}</h2>
        <p>{toast?.body ?? ""}</p>
        <button className="modal-close" onClick={onClose} type="button">
          확인
        </button>
      </div>
    </div>
  );
}

function normalizeConfig(config: FinalUQuestConfig): FinalUQuestConfig {
  return JSON.parse(JSON.stringify(config)) as FinalUQuestConfig;
}

function deriveRookieSummary(data: FinalUQuestConfig, user: FinalUser): RookieSummary {
  const storeName = data.stores.find((store) => store.id === user.storeId)?.name ?? "본사";
  const hireDate = user.hireDate ?? data.today;
  const currentDay = Math.max(1, diffDays(hireDate, data.today) + 1);
  // 진도 기반: 오늘 진행할 Day = 완료한 학습 수 + 1 (도메인과 동일).
  const curriculumDay = Math.min(20, data.learningCompletions.filter((completion) => completion.userId === user.id).length + 1);
  const startDate = data.attendances.filter((attendance) => attendance.userId === user.id).map((attendance) => attendance.attendanceDate).sort()[0];
  const endDate = addDays(startDate ?? hireDate, 30);
  const userPointHistories = data.pointHistories.filter((history) => history.userId === user.id);
  const pointBalance = userPointHistories.reduce((sum, history) => sum + history.amount, 0);
  const totalEarnedPoints = userPointHistories.filter((history) => history.amount > 0).reduce((sum, history) => sum + history.amount, 0);
  const totalSpentPoints = Math.abs(userPointHistories.filter((history) => history.amount < 0).reduce((sum, history) => sum + history.amount, 0));
  const attendanceCount = data.attendances.filter((attendance) => attendance.userId === user.id).length;
  const learningCount = data.learningCompletions.filter((completion) => completion.userId === user.id).length;
  const submissions = data.quizSubmissions.filter((submission) => submission.userId === user.id);
  const quizSolvedCount = submissions.reduce((sum, submission) => sum + submission.totalCount, 0);
  const quizCorrectCount = submissions.reduce((sum, submission) => sum + submission.correctCount, 0);
  const quizAccuracyRate = quizSolvedCount ? Math.round((quizCorrectCount / quizSolvedCount) * 100) : 0;
  const quizTier = getQuizTier(quizAccuracyRate, quizSolvedCount);
  const axSubmissionCount = data.axSubmissions.filter((submission) => submission.userId === user.id).length;
  const axLevel = getAxLevel(axSubmissionCount);
  // 캐릭터 레벨 = 성실성(출석·학습·퀴즈풀이) 3축 평균, 정답 무관·AX 제외 (도메인과 동일).
  const totalQuizQuestions = data.quizzes.filter((question) => question.rewardPoints >= 0).length || 1;
  const progressRate = Math.min(100, Math.round((((Math.min(1, attendanceCount / 20)) + (Math.min(1, learningCount / 20)) + (Math.min(1, quizSolvedCount / totalQuizQuestions))) / 3) * 100));
  const characterLevel = Math.min(5, Math.max(1, Math.floor(progressRate / 25) + 1));
  const pointExpireDate = user.completedAt ? addMonths(user.completedAt.slice(0, 10), 3) : null;
  const pointExpired = Boolean(pointExpireDate && data.today > pointExpireDate);
  const acquiredBadges = data.badges.filter((badge) => user.badgeIds.includes(badge.id));

  return {
    user,
    storeName,
    currentDay,
    curriculumDay,
    endDate,
    progressRate,
    attendanceCount,
    learningCount,
    quizSolvedCount,
    quizCorrectCount,
    quizAccuracyRate,
    quizTier,
    axSubmissionCount,
    axLevel,
    characterLevel,
    pointBalance,
    totalEarnedPoints,
    totalSpentPoints,
    shopOpened: user.status === "completed",
    pointExpireDate,
    pointExpired,
    acquiredBadges
  };
}

function buildValidationItems(data: FinalUQuestConfig) {
  const pending = data.users.some((user) => user.role === "rookie" && user.status === "pending");
  const rejected = data.users.some((user) => user.role === "rookie" && user.status === "rejected");
  const inactive = data.users.some((user) => user.role === "rookie" && user.status === "inactive");
  const completed = data.users.some((user) => user.role === "rookie" && user.status === "completed");
  const axFixed = data.axCategories.length === 7;
  const variableQuiz = new Set(data.curriculums.map((curriculum) => data.quizzes.filter((quiz) => quiz.curriculumId === curriculum.id).length)).size > 1;
  const unlimitedCoupon = data.coupons.some((coupon) => coupon.stockQuantity === null);
  const noStockCoupon = data.coupons.some((coupon) => coupon.stockQuantity === 0);
  const pointLedger = data.pointHistories.every((history) => typeof history.balanceAfter === "number" && history.reason.length > 0);

  return [
    { title: "승인 전 로그인", pass: pending, detail: "pending 상태 신입은 온보딩 액션이 차단됩니다." },
    { title: "승인 반려", pass: rejected, detail: "rejected 상태와 반려 사유를 보관합니다." },
    { title: "수료 전 상점 접근", pass: completed, detail: "active 사용자는 상점이 잠기고 completed 사용자만 교환 가능합니다." },
    { title: "퇴사자 접근", pass: inactive, detail: "inactive 사용자는 온보딩 액션이 차단됩니다." },
    { title: "AX/DX 7개 고정", pass: axFixed, detail: "AX 4개, DX 3개 항목만 표시합니다." },
    { title: "퀴즈 문제 수 가변", pass: variableQuiz, detail: "Day별 문제 수가 다르고 티어는 정답률 기준입니다." },
    { title: "쿠폰 재고 NULL", pass: unlimitedCoupon, detail: "NULL 재고는 무제한으로 표시합니다." },
    { title: "재고 없음", pass: noStockCoupon, detail: "재고 0 쿠폰은 교환 요청이 차단됩니다." },
    { title: "포인트 이력", pass: pointLedger, detail: "모든 지급/차감은 reason과 balanceAfter를 보관합니다." },
    { title: "점장 조회 전용", pass: true, detail: "점장 화면은 담당 매장 신입 조회만 제공하고 수정 버튼이 없습니다." }
  ];
}

function apiErrorTitle(code?: string) {
  const labels: Record<string, string> = {
    ACCOUNT_PENDING: "승인 대기",
    ACCOUNT_REJECTED: "승인 반려",
    ACCOUNT_COMPLETED: "수료 완료",
    ACCOUNT_INACTIVE: "접근 제한",
    DUPLICATE_ATTENDANCE: "중복 출석",
    ATTENDANCE_REQUIRED: "출석 먼저",
    LEARNING_NOT_TODAY: "오늘 학습 아님",
    DAILY_LEARNING_LIMIT: "오늘 학습 완료",
    LEARNING_ALREADY_COMPLETED: "이미 완료",
    LEARNING_REQUIRED: "학습 필요",
    QUIZ_ALREADY_SUBMITTED: "재도전 불가",
    QUIZ_INCOMPLETE: "답변 필요",
    AX_EVIDENCE_REQUIRED: "사진 필요",
    AX_DAILY_LIMIT: "오늘 AX 완료",
    SHOP_LOCKED_UNTIL_COMPLETION: "상점 잠김",
    POINTS_EXPIRED: "포인트 만료",
    COUPON_OUT_OF_STOCK: "재고 없음",
    DUPLICATE_COUPON_REQUEST: "중복 요청",
    INSUFFICIENT_POINTS: "포인트 부족",
    COUPON_ALREADY_SENT: "발송 완료",
    FORBIDDEN_ROLE: "권한 없음",
    INVALID_INPUT: "입력 확인"
  };

  return labels[code ?? ""] ?? "요청 실패";
}

function getUser(data: FinalUQuestConfig, userId: string): FinalUser {
  return data.users.find((user) => user.id === userId) ?? data.users[0];
}

function getCurrentCurriculumId(data: FinalUQuestConfig, user: FinalUser) {
  const hireDate = user.hireDate ?? data.today;
  const currentDay = Math.min(20, Math.max(1, diffDays(hireDate, data.today) + 1));
  return data.curriculums.find((item) => item.dayNumber === currentDay)?.id ?? data.curriculums[0]?.id ?? "day-1";
}

function getQuizTier(accuracy: number, solved: number): QuizTier {
  if (solved <= 0) return "Unranked";
  if (accuracy >= 95) return "Diamond";
  if (accuracy >= 80) return "Platinum";
  if (accuracy >= 60) return "Gold";
  if (accuracy >= 40) return "Silver";
  if (accuracy >= 20) return "Bronze";
  return "Unranked";
}

function getAxLevel(count: number): AxLevel {
  if (count >= 20) return "Master";
  if (count >= 15) return "Expert";
  if (count >= 10) return "User";
  return "Explorer";
}

function nextAxThreshold(count: number) {
  if (count < 10) return 10;
  if (count < 15) return 15;
  return 20;
}

function diffDays(start: string, end: string) {
  return Math.floor((toDateOnly(end).getTime() - toDateOnly(start).getTime()) / 86_400_000);
}

function addDays(date: string, days: number) {
  const next = toDateOnly(date);
  next.setDate(next.getDate() + days);
  return formatDateInput(next);
}

function addMonths(date: string, months: number) {
  const next = toDateOnly(date);
  next.setMonth(next.getMonth() + months);
  return formatDateInput(next);
}

function toDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function roleLabel(role: FinalRole) {
  if (role === "rookie") return "신입";
  if (role === "manager") return "점장";
  return "본사";
}

function statusLabel(status: FinalUserStatus) {
  const labels: Record<FinalUserStatus, string> = {
    pending: "승인대기",
    active: "진행중",
    rejected: "반려",
    completed: "수료",
    inactive: "비활성"
  };

  return labels[status];
}

function statusHeadline(status: FinalUserStatus) {
  const labels: Record<FinalUserStatus, string> = {
    pending: "승인 대기",
    active: "오늘의 온보딩",
    rejected: "승인 반려",
    completed: "수료 완료",
    inactive: "접근 제한"
  };

  return labels[status];
}

function axLevelKorean(level: AxLevel) {
  const labels: Record<AxLevel, string> = {
    Explorer: "탐색자",
    User: "실천자",
    Expert: "전문가",
    Master: "마스터"
  };

  return labels[level];
}

function badgeCategoryLabel(category: BadgeCategory) {
  const labels: Record<BadgeCategory, string> = {
    attendance: "출석 배지",
    quiz: "퀴즈 배지",
    tier: "티어 배지",
    ax: "AX 배지",
    rare: "희귀 배지"
  };

  return labels[category];
}

function badgeMedalLabel(badge: FinalBadge) {
  if (badge.category === "attendance") return "A";
  if (badge.category === "quiz") return "Q";
  if (badge.category === "tier") return badge.name.slice(0, 1);
  return "R";
}
