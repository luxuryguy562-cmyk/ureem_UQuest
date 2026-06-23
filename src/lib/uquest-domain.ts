import { randomUUID } from "crypto";

import type {
  AxLevel,
  CouponRequestStatus,
  FinalAxCategory,
  FinalCoupon,
  FinalCurriculum,
  FinalPointHistory,
  FinalQuizQuestion,
  FinalRewardConfig,
  FinalRole,
  FinalUQuestConfig,
  FinalUser,
  QuizTier
} from "@/types/uquest";

export type UQuestErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN_ROLE"
  | "ACCOUNT_PENDING"
  | "ACCOUNT_REJECTED"
  | "ACCOUNT_COMPLETED"
  | "ACCOUNT_INACTIVE"
  | "DUPLICATE_ATTENDANCE"
  | "ATTENDANCE_REQUIRED"
  | "LEARNING_NOT_TODAY"
  | "DAILY_LEARNING_LIMIT"
  | "LEARNING_ALREADY_COMPLETED"
  | "LEARNING_REQUIRED"
  | "QUIZ_ALREADY_SUBMITTED"
  | "QUIZ_INCOMPLETE"
  | "AX_EVIDENCE_REQUIRED"
  | "AX_DAILY_LIMIT"
  | "SHOP_LOCKED_UNTIL_COMPLETION"
  | "POINTS_EXPIRED"
  | "COUPON_OUT_OF_STOCK"
  | "DUPLICATE_COUPON_REQUEST"
  | "INSUFFICIENT_POINTS"
  | "COUPON_ALREADY_SENT"
  | "INVALID_INPUT";

export class UQuestDomainError extends Error {
  constructor(
    public code: UQuestErrorCode,
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "UQuestDomainError";
  }
}

export type RookieSummary = {
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
};

// 온보딩 기간: 시작(첫 출석) 후 30일. 그 안엔 출석·학습·퀴즈·AX 자유, 30일이 지나면 자동 수료.
export const ONBOARDING_PERIOD_DAYS = 30;

function applyAutoCompletion(config: FinalUQuestConfig): FinalUQuestConfig {
  const users = config.users.map((user) => {
    if (user.role !== "rookie" || user.status !== "active") return user;
    const startDate = config.attendances
      .filter((attendance) => attendance.userId === user.id)
      .map((attendance) => attendance.attendanceDate)
      .sort()[0];
    if (!startDate) return user; // 아직 온보딩을 시작(첫 출석)하지 않음
    const dueDate = addDays(startDate, ONBOARDING_PERIOD_DAYS);
    if (config.today >= dueDate) {
      return { ...user, status: "completed" as const, completedAt: user.completedAt ?? nowIso(dueDate) };
    }
    return user;
  });
  return { ...config, users };
}

export function normalizeConfig(config: FinalUQuestConfig): FinalUQuestConfig {
  const cloned = JSON.parse(JSON.stringify(config)) as FinalUQuestConfig;
  return applyAutoCompletion(cloned);
}

// 보상 경제: 종목별 단위 포인트(관리자 시뮬레이터에서 설정). 미설정 시 기본값.
export const DEFAULT_REWARD_CONFIG: FinalRewardConfig = {
  attendancePoints: 100,
  learningPoints: 0,
  quizCorrectPoints: 300,
  quizWrongPoints: 30,
  axPoints: 200
};

export function getRewardConfig(data: FinalUQuestConfig): FinalRewardConfig {
  return { ...DEFAULT_REWARD_CONFIG, ...(data.rewardConfig ?? {}) };
}

export function getUser(data: FinalUQuestConfig, userId: string): FinalUser {
  const user = data.users.find((item) => item.id === userId);
  if (!user) throw new UQuestDomainError("NOT_FOUND", "사용자를 찾을 수 없습니다.", 404);
  return user;
}

export function getCurrentCurriculum(data: FinalUQuestConfig, user: FinalUser): FinalCurriculum {
  const day = getCurrentCurriculumDay(data, user);
  const curriculum = data.curriculums.find((item) => item.dayNumber === day);
  if (!curriculum) throw new UQuestDomainError("NOT_FOUND", "오늘 커리큘럼을 찾을 수 없습니다.", 404);
  return curriculum;
}

export function getCurrentCurriculumDay(data: FinalUQuestConfig, user: FinalUser) {
  // 진도(페이스) 기반: 완료한 학습 수의 "다음" Day가 오늘 진행할 Day. 달력일/입사일과 무관.
  const learningCount = data.learningCompletions.filter((item) => item.userId === user.id).length;
  return Math.min(20, learningCount + 1);
}

export function deriveRookieSummary(data: FinalUQuestConfig, user: FinalUser): RookieSummary {
  const storeName = data.stores.find((store) => store.id === user.storeId)?.name ?? "본사";
  const hireDate = user.hireDate ?? data.today;
  const currentDay = Math.max(1, diffDays(hireDate, data.today) + 1);
  // 진도 기반: 오늘 진행할 Day = 완료한 학습 수 + 1 (날짜와 무관, 놓친 날로 밀리지 않음).
  const curriculumDay = Math.min(20, data.learningCompletions.filter((completion) => completion.userId === user.id).length + 1);
  // 온보딩 종료일 = 시작(첫 출석) 후 30일. 아직 시작 전이면 입사일 기준 임시 표기.
  const startDate = data.attendances.filter((attendance) => attendance.userId === user.id).map((attendance) => attendance.attendanceDate).sort()[0];
  const endDate = addDays(startDate ?? hireDate, ONBOARDING_PERIOD_DAYS);
  const histories = data.pointHistories.filter((history) => history.userId === user.id);
  const pointBalance = histories.reduce((sum, history) => sum + history.amount, 0);
  const totalEarnedPoints = histories.filter((history) => history.amount > 0).reduce((sum, history) => sum + history.amount, 0);
  const totalSpentPoints = Math.abs(histories.filter((history) => history.amount < 0).reduce((sum, history) => sum + history.amount, 0));
  const attendanceCount = data.attendances.filter((attendance) => attendance.userId === user.id).length;
  const learningCount = data.learningCompletions.filter((completion) => completion.userId === user.id).length;
  const submissions = data.quizSubmissions.filter((submission) => submission.userId === user.id);
  const quizSolvedCount = submissions.reduce((sum, submission) => sum + submission.totalCount, 0);
  const quizCorrectCount = submissions.reduce((sum, submission) => sum + submission.correctCount, 0);
  const quizAccuracyRate = quizSolvedCount ? Math.round((quizCorrectCount / quizSolvedCount) * 100) : 0;
  const quizTier = getQuizTier(quizAccuracyRate, quizSolvedCount);
  const axSubmissionCount = data.axSubmissions.filter((submission) => submission.userId === user.id).length;
  const axLevel = getAxLevel(axSubmissionCount);
  // 캐릭터 레벨 = 성실성(참여) = 출석·학습·퀴즈풀이의 3축 평균. 정답 여부는 무관(지식은 티어 담당).
  // AX는 별도 트랙(로봇)이라 제외. 빠지거나 안 풀면 성장이 둔화된다 → "성실한 만큼" 레벨이 오른다.
  const totalQuizQuestions = data.quizzes.filter((question) => question.rewardPoints >= 0).length || 1;
  const attendanceTrack = Math.min(1, attendanceCount / 20);
  const learningTrack = Math.min(1, learningCount / 20);
  const quizTrack = Math.min(1, quizSolvedCount / totalQuizQuestions);
  const progressRate = Math.min(100, Math.round(((attendanceTrack + learningTrack + quizTrack) / 3) * 100));
  const characterLevel = Math.min(5, Math.max(1, Math.floor(progressRate / 25) + 1));
  const pointExpireDate = user.completedAt ? addMonths(user.completedAt.slice(0, 10), 3) : null;
  const pointExpired = Boolean(pointExpireDate && data.today > pointExpireDate);

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
    pointExpired
  };
}

export function requireRole(user: FinalUser, roles: FinalRole[]) {
  if (!roles.includes(user.role)) {
    throw new UQuestDomainError("FORBIDDEN_ROLE", "이 기능을 사용할 권한이 없습니다.", 403);
  }
}

export function requireReadableUser(requester: FinalUser, target: FinalUser) {
  if (requester.role === "admin") return;
  if (requester.id === target.id) return;
  if (requester.role === "manager" && target.role === "rookie" && requester.storeId === target.storeId) return;
  throw new UQuestDomainError("FORBIDDEN_ROLE", "조회 권한이 없습니다.", 403);
}

export function requireActiveRookie(user: FinalUser) {
  requireRole(user, ["rookie"]);
  if (user.status === "pending") throw new UQuestDomainError("ACCOUNT_PENDING", "관리자 승인 전에는 진행할 수 없습니다.", 403);
  if (user.status === "rejected") throw new UQuestDomainError("ACCOUNT_REJECTED", user.rejectReason ?? "가입이 반려되었습니다.", 403);
  if (user.status === "completed") throw new UQuestDomainError("ACCOUNT_COMPLETED", "수료자는 온보딩을 추가 진행할 수 없습니다.", 403);
  if (user.status === "inactive") throw new UQuestDomainError("ACCOUNT_INACTIVE", "비활성 계정입니다.", 403);
}

export const ATTENDANCE_LIMIT = 20;

export function claimAttendance(config: FinalUQuestConfig, userId: string) {
  let data = normalizeConfig(config);
  const user = getUser(data, userId);
  requireActiveRookie(user);

  const attendanceCount = data.attendances.filter((item) => item.userId === userId).length;
  if (attendanceCount >= ATTENDANCE_LIMIT) {
    throw new UQuestDomainError("ATTENDANCE_LIMIT_REACHED", `출석 체크는 최대 ${ATTENDANCE_LIMIT}일까지 가능합니다. 온보딩이 완료됐습니다.`);
  }

  if (data.attendances.some((item) => item.userId === userId && item.attendanceDate === data.today)) {
    throw new UQuestDomainError("DUPLICATE_ATTENDANCE", "오늘 출석은 이미 완료했습니다.");
  }

  const attendancePoints = getRewardConfig(data).attendancePoints;
  data = addPoint(
    {
      ...data,
      attendances: [
        ...data.attendances,
        {
          id: createId("att"),
          userId,
          attendanceDate: data.today,
          rewardPoints: attendancePoints
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + 5 })
    },
    userId,
    attendancePoints,
    "attendance",
    `${formatDate(data.today)} 출석 보상`
  );

  return awardBadges(data, userId);
}

export function completeLearning(config: FinalUQuestConfig, userId: string, curriculumId: string) {
  let data = normalizeConfig(config);
  const user = getUser(data, userId);
  requireActiveRookie(user);
  const curriculum = getCurriculum(data, curriculumId);
  const summary = deriveRookieSummary(data, user);

  // 출석 관문: 그날 출석해야 학습/퀴즈를 진행할 수 있다(출근 → 오늘의 온보딩).
  if (!data.attendances.some((item) => item.userId === userId && item.attendanceDate === data.today)) {
    throw new UQuestDomainError("ATTENDANCE_REQUIRED", "오늘 출석을 먼저 완료해야 학습을 진행할 수 있습니다.");
  }

  if (data.learningCompletions.some((item) => item.userId === userId && item.curriculumId === curriculumId)) {
    throw new UQuestDomainError("LEARNING_ALREADY_COMPLETED", "이미 완료한 커리큘럼입니다.");
  }

  if (curriculum.dayNumber !== summary.curriculumDay) {
    throw new UQuestDomainError("LEARNING_NOT_TODAY", `지금 진행할 학습은 Day ${summary.curriculumDay}입니다. 학습은 순서대로 진행됩니다.`);
  }

  if (data.learningCompletions.some((item) => item.userId === userId && item.createdAt.startsWith(data.today))) {
    throw new UQuestDomainError("DAILY_LEARNING_LIMIT", "학습 완료는 하루 1개만 가능합니다. 다음 근무일에 이어서 진행하세요.");
  }

  const learningPoints = getRewardConfig(data).learningPoints;
  data = addPoint(
    {
      ...data,
      learningCompletions: [
        ...data.learningCompletions,
        {
          id: createId("learn"),
          userId,
          curriculumId,
          rewardPoints: learningPoints,
          createdAt: nowIso(data.today)
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + 10 })
    },
    userId,
    learningPoints,
    "learning",
    `Day ${curriculum.dayNumber} 학습 완료`
  );

  // 수료는 학습 완료가 아니라 "온보딩 시작 후 30일 경과"로 처리한다(normalizeConfig). 학습을
  // 일찍 끝내도 30일까지 출석·퀴즈·AX를 계속 쌓을 수 있다.
  return awardBadges(data, userId);
}

export function submitQuiz(config: FinalUQuestConfig, userId: string, curriculumId: string, answerMap: Record<string, number>) {
  let data = normalizeConfig(config);
  const user = getUser(data, userId);
  requireActiveRookie(user);
  const curriculum = getCurriculum(data, curriculumId);
  // 출석 관문: 그날 출석해야 퀴즈도 진행할 수 있다.
  if (!data.attendances.some((item) => item.userId === userId && item.attendanceDate === data.today)) {
    throw new UQuestDomainError("ATTENDANCE_REQUIRED", "오늘 출석을 먼저 완료해야 퀴즈를 진행할 수 있습니다.");
  }
  const learning = data.learningCompletions.find((item) => item.userId === userId && item.curriculumId === curriculumId);
  if (!learning) throw new UQuestDomainError("LEARNING_REQUIRED", "학습 완료 후 퀴즈를 풀 수 있습니다.");
  if (data.quizSubmissions.some((item) => item.userId === userId && item.curriculumId === curriculumId)) {
    throw new UQuestDomainError("QUIZ_ALREADY_SUBMITTED", "퀴즈는 재도전할 수 없습니다.");
  }

  const questions = data.quizzes.filter((question) => question.curriculumId === curriculumId && question.rewardPoints >= 0);
  const unanswered = questions.filter((question) => answerMap[question.id] === undefined);
  if (unanswered.length > 0) throw new UQuestDomainError("QUIZ_INCOMPLETE", "모든 문제를 선택해야 제출할 수 있습니다.");

  const reward = getRewardConfig(data);
  const answers = questions.map((question) => {
    const selectedOption = answerMap[question.id] ?? -1;
    const isCorrect = selectedOption === question.correctOption;
    return {
      questionId: question.id,
      selectedOption,
      correctOption: question.correctOption,
      isCorrect,
      // 성실 비례: 정답은 만점, 오답은 시도 인정으로 소액만. 찍기와 학습이 구분된다.
      rewardPoints: isCorrect ? reward.quizCorrectPoints : reward.quizWrongPoints
    };
  });
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const earnedPoints = answers.reduce((sum, answer) => sum + answer.rewardPoints, 0);

  data = addPoint(
    {
      ...data,
      quizSubmissions: [
        ...data.quizSubmissions,
        {
          id: createId("quiz-sub"),
          userId,
          curriculumId,
          totalCount: answers.length,
          correctCount,
          earnedPoints,
          answers,
          submittedAt: nowIso(data.today)
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + correctCount * 5 })
    },
    userId,
    earnedPoints,
    "quiz",
    `Day ${curriculum.dayNumber} 퀴즈 ${correctCount}/${answers.length} 정답`
  );

  return awardBadges(data, userId);
}

export function certifyAx(config: FinalUQuestConfig, userId: string, categoryId: string, evidenceName: string) {
  let data = normalizeConfig(config);
  const user = getUser(data, userId);
  requireActiveRookie(user);
  const category = getAxCategory(data, categoryId);
  // AX는 항목당 하루 1건, 매일 초기화(항목 3개 × 30일 = 최대 90건).
  if (data.axSubmissions.some((item) => item.userId === userId && item.categoryId === categoryId && item.createdAt.startsWith(data.today))) {
    throw new UQuestDomainError("AX_DAILY_LIMIT", "이 항목은 오늘 이미 인증했습니다. 내일 다시 도전하세요.");
  }
  if (!evidenceName.trim()) {
    throw new UQuestDomainError("AX_EVIDENCE_REQUIRED", "사진 업로드 또는 촬영이 필요합니다.");
  }
  const imageUrl = evidenceName.startsWith("/") || evidenceName.startsWith("http") ? evidenceName : `/mock/ax-evidence/${encodeURIComponent(evidenceName)}`;

  const axPoints = getRewardConfig(data).axPoints;
  data = addPoint(
    {
      ...data,
      axSubmissions: [
        ...data.axSubmissions,
        {
          id: createId("ax-sub"),
          userId,
          categoryId,
          imageUrl,
          rewardPoints: axPoints,
          createdAt: nowIso(data.today)
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + 8 })
    },
    userId,
    axPoints,
    "ax",
    `${category.title} 인증`
  );

  // AX는 실행당 포인트만(쉬운 활동). 큰 단계 보너스는 제거. 로봇 단계는 표시용으로 유지.
  return awardBadges(data, userId);
}

export function redeemCoupon(config: FinalUQuestConfig, userId: string, couponId: string) {
  const data = normalizeConfig(config);
  const user = getUser(data, userId);
  requireRole(user, ["rookie"]);
  const coupon = getCoupon(data, couponId);
  const summary = deriveRookieSummary(data, user);

  if (user.status !== "completed") throw new UQuestDomainError("SHOP_LOCKED_UNTIL_COMPLETION", "상점은 수료 후 열립니다.", 403);
  if (summary.pointExpired) throw new UQuestDomainError("POINTS_EXPIRED", "수료 후 3개월이 지나 포인트를 사용할 수 없습니다.", 403);
  if (coupon.stockQuantity === 0) throw new UQuestDomainError("COUPON_OUT_OF_STOCK", "재고가 없습니다.");
  if (data.couponRequests.some((request) => request.userId === userId && request.couponId === couponId && request.status === "requested")) {
    throw new UQuestDomainError("DUPLICATE_COUPON_REQUEST", "이미 발송 전 요청이 있습니다.");
  }
  if (summary.pointBalance < coupon.requiredPoints) throw new UQuestDomainError("INSUFFICIENT_POINTS", "포인트가 부족합니다.");

  return addPoint(
    {
      ...data,
      couponRequests: [
        ...data.couponRequests,
        {
          id: createId("coupon-req"),
          userId,
          couponId,
          requiredPoints: coupon.requiredPoints,
          status: "requested",
          requestedAt: nowIso(data.today)
        }
      ]
    },
    userId,
    -coupon.requiredPoints,
    "coupon_request",
    `${coupon.name} 교환 요청`
  );
}

export function cancelCouponRequest(config: FinalUQuestConfig, requesterId: string, requestId: string, reason: string) {
  const data = normalizeConfig(config);
  const requester = getUser(data, requesterId);
  const request = data.couponRequests.find((item) => item.id === requestId);
  if (!request) throw new UQuestDomainError("NOT_FOUND", "쿠폰 요청을 찾을 수 없습니다.", 404);
  const owner = getUser(data, request.userId);
  requireReadableUser(requester, owner);
  if (request.status === "sent") throw new UQuestDomainError("COUPON_ALREADY_SENT", "발송 완료 후에는 취소할 수 없습니다.");
  if (request.status !== "requested") throw new UQuestDomainError("NOT_FOUND", "취소 가능한 요청이 아닙니다.", 404);
  const coupon = data.coupons.find((item) => item.id === request.couponId);

  return addPoint(
    {
      ...data,
      couponRequests: data.couponRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "canceled" as CouponRequestStatus,
              canceledAt: nowIso(data.today),
              cancelReason: reason
            }
          : item
      )
    },
    request.userId,
    request.requiredPoints,
    "coupon_cancel",
    `${coupon?.name ?? "쿠폰"} 요청 취소`
  );
}

export function sendCouponRequest(config: FinalUQuestConfig, adminId: string, requestId: string) {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);
  const request = data.couponRequests.find((item) => item.id === requestId);
  if (!request) throw new UQuestDomainError("NOT_FOUND", "쿠폰 요청을 찾을 수 없습니다.", 404);
  if (request.status !== "requested") throw new UQuestDomainError("COUPON_ALREADY_SENT", "발송 가능한 요청이 아닙니다.");

  return {
    ...data,
    couponRequests: data.couponRequests.map((item) =>
      item.id === requestId
        ? {
            ...item,
            status: "sent" as CouponRequestStatus,
            sentAt: nowIso(data.today),
            expiresAt: `${addDays(data.today, 30)}T23:59:59+09:00`,
            processedBy: adminId
          }
        : item
    ),
    coupons: data.coupons.map((coupon) =>
      coupon.id === request.couponId && coupon.stockQuantity !== null
        ? { ...coupon, stockQuantity: Math.max(0, coupon.stockQuantity - 1) }
        : coupon
    ),
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "send_coupon",
        targetType: "coupon_request",
        targetId: requestId,
        reason: "관리자 발송 처리",
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export function approveUser(config: FinalUQuestConfig, adminId: string, targetUserId: string) {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);

  return {
    ...data,
    users: updateUser(data.users, targetUserId, { status: "active", approvedAt: nowIso(data.today), rejectReason: undefined }),
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "approve_user",
        targetType: "user",
        targetId: targetUserId,
        reason: "가입 정보 확인",
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export function rejectUser(config: FinalUQuestConfig, adminId: string, targetUserId: string, reason: string) {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);

  return {
    ...data,
    users: updateUser(data.users, targetUserId, { status: "rejected", rejectReason: reason }),
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "reject_user",
        targetType: "user",
        targetId: targetUserId,
        reason,
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export type CurriculumSettingsInput = {
  title?: string;
  description?: string;
  learningRewardPoints?: number;
  isPublished?: boolean;
  quizzes?: Array<{
    id?: string;
    question?: string;
    options?: string[];
    correctOption?: number;
    explanation?: string;
    rewardPoints?: number;
  }>;
};

type QuizSettingsInput = NonNullable<CurriculumSettingsInput["quizzes"]>[number];

export function updateCurriculumSettings(config: FinalUQuestConfig, adminId: string, curriculumId: string, input: CurriculumSettingsInput) {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);
  const curriculum = getCurriculum(data, curriculumId);

  const title = sanitizeText(input.title ?? curriculum.title);
  const description = sanitizeText(input.description ?? curriculum.description);
  const learningRewardPoints = Math.max(0, Math.floor(Number(input.learningRewardPoints ?? curriculum.learningRewardPoints)));
  const isPublished = input.isPublished ?? curriculum.isPublished;

  if (!title) throw new UQuestDomainError("INVALID_INPUT", "커리큘럼 제목을 입력해야 합니다.");
  if (!description) throw new UQuestDomainError("INVALID_INPUT", "커리큘럼 내용을 입력해야 합니다.");

  const existingQuizzes = data.quizzes.filter((quiz) => quiz.curriculumId === curriculumId);
  const submittedQuizzes = input.quizzes ?? existingQuizzes;
  const normalizedQuizzes = submittedQuizzes.map((quiz, index) => normalizeQuizInput(curriculum, quiz, index));

  if (normalizedQuizzes.length <= 0) {
    throw new UQuestDomainError("INVALID_INPUT", "퀴즈는 최소 1문제가 필요합니다.");
  }

  return {
    ...data,
    curriculums: data.curriculums.map((item) =>
      item.id === curriculumId
        ? {
            ...item,
            title,
            description,
            learningRewardPoints,
            isPublished
          }
        : item
    ),
    quizzes: [
      ...data.quizzes.filter((quiz) => quiz.curriculumId !== curriculumId),
      ...normalizedQuizzes
    ],
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "update_curriculum",
        targetType: "curriculum",
        targetId: curriculumId,
        reason: `Day ${curriculum.dayNumber} 커리큘럼/퀴즈 수정`,
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export type RewardSettingsInput = Partial<FinalRewardConfig> & {
  badges?: { id: string; rewardPoints: number }[];
};

export function updateRewardConfig(config: FinalUQuestConfig, adminId: string, input: RewardSettingsInput): FinalUQuestConfig {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);
  const current = getRewardConfig(data);
  const sanitize = (value: number | undefined, fallback: number) => {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const rewardConfig: FinalRewardConfig = {
    attendancePoints: sanitize(input.attendancePoints, current.attendancePoints),
    learningPoints: sanitize(input.learningPoints, current.learningPoints),
    quizCorrectPoints: sanitize(input.quizCorrectPoints, current.quizCorrectPoints),
    quizWrongPoints: sanitize(input.quizWrongPoints, current.quizWrongPoints),
    axPoints: sanitize(input.axPoints, current.axPoints)
  };

  const badgeOverrides = new Map((input.badges ?? []).map((badge) => [badge.id, Math.max(0, Math.floor(Number(badge.rewardPoints)))]));
  const badges = data.badges.map((badge) =>
    badgeOverrides.has(badge.id) && Number.isFinite(badgeOverrides.get(badge.id))
      ? { ...badge, rewardPoints: badgeOverrides.get(badge.id) as number }
      : badge
  );

  return {
    ...data,
    rewardConfig,
    badges,
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "update_reward_config",
        targetType: "reward_config",
        targetId: "",
        reason: "보상 단위 포인트 설정 변경",
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export function updateAxCategoryExample(config: FinalUQuestConfig, adminId: string, categoryId: string, imageUrl: string): FinalUQuestConfig {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);
  const category = getAxCategory(data, categoryId);
  const cleaned = imageUrl.trim();
  if (!cleaned) throw new UQuestDomainError("AX_EVIDENCE_REQUIRED", "예시 이미지가 필요합니다.");

  return {
    ...data,
    axCategories: data.axCategories.map((item) => (item.id === categoryId ? { ...item, exampleImageUrl: cleaned } : item)),
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "update_ax_example",
        targetType: "ax_category",
        targetId: categoryId,
        reason: `${category.title} 예시 이미지 등록`,
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export type CouponInput = {
  name?: string;
  description?: string;
  actualPrice?: number;
  requiredPoints?: number;
  stockQuantity?: number | null;
  isPublished?: boolean;
};

export function createCoupon(config: FinalUQuestConfig, adminId: string, input: CouponInput): FinalUQuestConfig {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);

  const name = sanitizeText(input.name ?? "");
  const description = sanitizeText(input.description ?? "");
  const actualPrice = Math.max(0, Math.floor(Number(input.actualPrice ?? 0)));
  const requiredPoints = Math.max(1, Math.floor(Number(input.requiredPoints ?? 1)));
  const stockQuantity = input.stockQuantity === null ? null : input.stockQuantity !== undefined ? Math.max(0, Math.floor(Number(input.stockQuantity))) : null;
  const isPublished = input.isPublished ?? true;

  if (!name) throw new UQuestDomainError("INVALID_INPUT", "쿠폰 이름을 입력해야 합니다.");
  if (!description) throw new UQuestDomainError("INVALID_INPUT", "쿠폰 설명을 입력해야 합니다.");

  const coupon = { id: createId("coupon"), name, description, actualPrice, requiredPoints, stockQuantity, isPublished };

  return {
    ...data,
    coupons: [...data.coupons, coupon],
    adminAuditLogs: [
      ...data.adminAuditLogs,
      { id: createId("audit"), actorId: adminId, action: "create_coupon", targetType: "coupon", targetId: coupon.id, reason: `쿠폰 추가: ${name}`, createdAt: nowIso(data.today) }
    ]
  };
}

export function updateCoupon(config: FinalUQuestConfig, adminId: string, couponId: string, input: CouponInput): FinalUQuestConfig {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);

  const target = data.coupons.find((c) => c.id === couponId);
  if (!target) throw new UQuestDomainError("NOT_FOUND", "쿠폰을 찾을 수 없습니다.", 404);

  const name = sanitizeText(input.name ?? target.name);
  const description = sanitizeText(input.description ?? target.description);
  const actualPrice = input.actualPrice !== undefined ? Math.max(0, Math.floor(Number(input.actualPrice))) : target.actualPrice;
  const requiredPoints = input.requiredPoints !== undefined ? Math.max(1, Math.floor(Number(input.requiredPoints))) : target.requiredPoints;
  const stockQuantity = input.stockQuantity !== undefined ? (input.stockQuantity === null ? null : Math.max(0, Math.floor(Number(input.stockQuantity)))) : target.stockQuantity;
  const isPublished = input.isPublished !== undefined ? input.isPublished : target.isPublished;

  if (!name) throw new UQuestDomainError("INVALID_INPUT", "쿠폰 이름을 입력해야 합니다.");

  return {
    ...data,
    coupons: data.coupons.map((c) => c.id === couponId ? { ...c, name, description, actualPrice, requiredPoints, stockQuantity, isPublished } : c),
    adminAuditLogs: [
      ...data.adminAuditLogs,
      { id: createId("audit"), actorId: adminId, action: "update_coupon", targetType: "coupon", targetId: couponId, reason: `쿠폰 수정: ${name}`, createdAt: nowIso(data.today) }
    ]
  };
}

export type StoreImportInput = { stores: { district?: string; team?: string; name: string }[] };

export function importStores(config: FinalUQuestConfig, adminId: string, input: StoreImportInput): FinalUQuestConfig {
  const data = normalizeConfig(config);
  const admin = getUser(data, adminId);
  requireRole(admin, ["admin"]);

  const rows = (input.stores ?? [])
    .map((row) => ({ district: (row.district ?? "").trim(), team: (row.team ?? "").trim(), name: (row.name ?? "").trim() }))
    .filter((row) => row.name.length > 0);
  if (rows.length === 0) throw new UQuestDomainError("INVALID_INPUT", "유효한 매장 행이 없습니다. (담당/팀장/매장 형식)");

  const byCode = new Map(data.stores.map((store) => [store.code, store]));
  const stores = [...data.stores];
  for (const row of rows) {
    const code = row.name;
    const existing = byCode.get(code);
    if (existing) {
      const index = stores.findIndex((store) => store.id === existing.id);
      stores[index] = { ...existing, name: row.name, district: row.district || undefined, team: row.team || undefined, isActive: true };
    } else {
      const store = { id: randomUUID(), name: row.name, code, district: row.district || undefined, team: row.team || undefined, isActive: true };
      stores.push(store);
      byCode.set(code, store);
    }
  }

  return {
    ...data,
    stores,
    adminAuditLogs: [
      ...data.adminAuditLogs,
      {
        id: createId("audit"),
        actorId: adminId,
        action: "import_stores",
        targetType: "store",
        targetId: "",
        reason: `매장 ${rows.length}건 임포트`,
        createdAt: nowIso(data.today)
      }
    ]
  };
}

export type StoreUpdateInput = { name?: string; district?: string; team?: string; isActive?: boolean };

export function updateStore(config: FinalUQuestConfig, adminId: string, storeId: string, input: StoreUpdateInput): FinalUQuestConfig {
  const data = normalizeConfig(config);
  requireRole(getUser(data, adminId), ["admin"]);
  const target = data.stores.find((store) => store.id === storeId);
  if (!target) throw new UQuestDomainError("NOT_FOUND", "매장을 찾을 수 없습니다.", 404);
  const name = input.name !== undefined ? input.name.trim() : target.name;
  if (!name) throw new UQuestDomainError("INVALID_INPUT", "매장명을 입력해야 합니다.");

  const stores = data.stores.map((store) =>
    store.id === storeId
      ? {
          ...store,
          name,
          district: input.district !== undefined ? input.district.trim() || undefined : store.district,
          team: input.team !== undefined ? input.team.trim() || undefined : store.team,
          isActive: input.isActive !== undefined ? input.isActive : store.isActive
        }
      : store
  );

  return {
    ...data,
    stores,
    adminAuditLogs: [
      ...data.adminAuditLogs,
      { id: createId("audit"), actorId: adminId, action: "update_store", targetType: "store", targetId: storeId, reason: `매장 수정: ${name}`, createdAt: nowIso(data.today) }
    ]
  };
}

export function isUQuestDomainError(error: unknown): error is UQuestDomainError {
  return error instanceof UQuestDomainError;
}

function getCurriculum(data: FinalUQuestConfig, curriculumId: string) {
  const curriculum = data.curriculums.find((item) => item.id === curriculumId);
  if (!curriculum) throw new UQuestDomainError("NOT_FOUND", "커리큘럼을 찾을 수 없습니다.", 404);
  return curriculum;
}

function getAxCategory(data: FinalUQuestConfig, categoryId: string): FinalAxCategory {
  const category = data.axCategories.find((item) => item.id === categoryId);
  if (!category) throw new UQuestDomainError("NOT_FOUND", "AX/DX 항목을 찾을 수 없습니다.", 404);
  return category;
}

function getCoupon(data: FinalUQuestConfig, couponId: string): FinalCoupon {
  const coupon = data.coupons.find((item) => item.id === couponId);
  if (!coupon) throw new UQuestDomainError("NOT_FOUND", "쿠폰을 찾을 수 없습니다.", 404);
  return coupon;
}

function normalizeQuizInput(
  curriculum: FinalCurriculum,
  quiz: QuizSettingsInput,
  index: number
): FinalQuizQuestion {
  const question = sanitizeText(quiz.question ?? "");
  const options = (quiz.options ?? []).slice(0, 4).map((option: string) => sanitizeText(option));
  while (options.length < 4) options.push("");
  const correctOption = Math.max(0, Math.min(3, Math.floor(Number(quiz.correctOption ?? 0))));
  const explanation = sanitizeText(quiz.explanation ?? "");
  const rewardPoints = Math.max(0, Math.floor(Number(quiz.rewardPoints ?? 300)));

  if (!question) throw new UQuestDomainError("INVALID_INPUT", `${index + 1}번 퀴즈 문제를 입력해야 합니다.`);
  if (options.some((option) => !option)) throw new UQuestDomainError("INVALID_INPUT", `${index + 1}번 퀴즈 보기는 4개가 필요합니다.`);
  if (!explanation) throw new UQuestDomainError("INVALID_INPUT", `${index + 1}번 퀴즈 해설을 입력해야 합니다.`);

  return {
    id: quiz.id || createId(`quiz-day-${curriculum.dayNumber}`),
    curriculumId: curriculum.id,
    question,
    options,
    correctOption,
    explanation,
    rewardPoints
  };
}

function sanitizeText(value: string) {
  return String(value ?? "").trim();
}

function awardBadges(data: FinalUQuestConfig, userId: string): FinalUQuestConfig {
  let next = data;
  let user = getUser(next, userId);
  const summary = deriveRookieSummary(next, user);
  const candidates = next.badges.filter((badge) => !user.badgeIds.includes(badge.id) && isBadgeEarned(badge.id, summary, user, next));

  for (const badge of candidates) {
    next = {
      ...next,
      users: updateUser(next.users, userId, { badgeIds: [...getUser(next, userId).badgeIds, badge.id] })
    };
    if (badge.rewardPoints > 0) {
      next = addPoint(next, userId, badge.rewardPoints, "badge", `${badge.name} 배지 보상`);
    }
    user = getUser(next, userId);
  }

  return next;
}

function isBadgeEarned(badgeId: string, summary: RookieSummary, user: FinalUser, data: FinalUQuestConfig) {
  const ids = new Set(user.badgeIds);
  if (badgeId === "attendance_1") return summary.attendanceCount >= 1;
  if (badgeId === "attendance_5") return summary.attendanceCount >= 5;
  if (badgeId === "attendance_10") return summary.attendanceCount >= 10;
  if (badgeId === "attendance_15") return summary.attendanceCount >= 15;
  if (badgeId === "attendance_20") return summary.attendanceCount >= 20;
  if (badgeId === "quiz_1") return summary.quizSolvedCount >= 1;
  if (badgeId === "quiz_10") return summary.quizSolvedCount >= 10;
  if (badgeId === "quiz_30") return summary.quizSolvedCount >= 30;
  if (badgeId === "quiz_50") return summary.quizSolvedCount >= 50;
  if (badgeId === "quiz_60") return summary.quizSolvedCount >= 60;
  if (badgeId === "tier_bronze") return summary.quizTier !== "Unranked";
  if (badgeId === "tier_silver") return ["Silver", "Gold", "Platinum", "Diamond"].includes(summary.quizTier);
  if (badgeId === "tier_gold") return ["Gold", "Platinum", "Diamond"].includes(summary.quizTier);
  if (badgeId === "tier_platinum") return ["Platinum", "Diamond"].includes(summary.quizTier);
  if (badgeId === "tier_diamond") return summary.quizTier === "Diamond";
  // 참여 전량(누구나)이 아니라 성실의 정점(소수)에 부여 → 진짜 희귀.
  if (badgeId === "rare_attendance") return summary.characterLevel >= 4;
  if (badgeId === "rare_quiz") return summary.quizAccuracyRate >= 90 && summary.quizSolvedCount >= 30;
  if (badgeId === "rare_tier") return ids.has("tier_diamond") || summary.quizTier === "Diamond";
  if (badgeId === "rare_ax_master") return summary.axLevel === "Master";
  if (badgeId === "rare_ax_peak") return summary.axSubmissionCount >= 60;
  if (badgeId === "rare_all_public") return data.badges.filter((item) => !item.isRare).every((item) => ids.has(item.id));
  if (badgeId === "rare_legend") return ["rare_quiz", "rare_tier", "rare_ax_peak", "rare_all_public"].every((id) => ids.has(id));
  return false;
}

function addPoint(data: FinalUQuestConfig, userId: string, amount: number, type: FinalPointHistory["type"], reason: string): FinalUQuestConfig {
  // 0포인트 보상(예: 학습 0P)은 이력을 남기지 않는다. (DB의 amount_nonzero 제약 + 불필요한 0건 방지)
  if (amount === 0) return data;
  const balanceAfter = data.pointHistories.filter((history) => history.userId === userId).reduce((sum, history) => sum + history.amount, 0) + amount;
  if (balanceAfter < 0) throw new UQuestDomainError("INSUFFICIENT_POINTS", "포인트가 부족합니다.");

  return {
    ...data,
    pointHistories: [
      ...data.pointHistories,
      {
        id: createId("pt"),
        userId,
        amount,
        balanceAfter,
        type,
        reason,
        createdAt: nowIso(data.today)
      }
    ]
  };
}

function updateUser(users: FinalUser[], userId: string, patch: Partial<FinalUser>) {
  return users.map((user) => (user.id === userId ? { ...user, ...patch } : user));
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

function createId(prefix: string) {
  // 정규화 테이블의 PK(uuid)와 그대로 맞물리도록 uuid를 사용한다.
  // prefix 는 디버깅 가독성 용도로만 두되, 식별자 자체는 uuid 여야 한다.
  void prefix;
  return randomUUID();
}

function nowIso(today: string) {
  return `${today}T10:00:00+09:00`;
}

function formatDate(date: string) {
  return date.replaceAll("-", ".");
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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
