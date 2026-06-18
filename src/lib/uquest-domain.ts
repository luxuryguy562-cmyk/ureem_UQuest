import { randomUUID } from "crypto";

import type {
  AxLevel,
  CouponRequestStatus,
  FinalAxCategory,
  FinalCoupon,
  FinalCurriculum,
  FinalPointHistory,
  FinalQuizQuestion,
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

export function normalizeConfig(config: FinalUQuestConfig): FinalUQuestConfig {
  return JSON.parse(JSON.stringify(config)) as FinalUQuestConfig;
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
  const endDate = addDays(hireDate, 27);
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

export function claimAttendance(config: FinalUQuestConfig, userId: string) {
  let data = normalizeConfig(config);
  const user = getUser(data, userId);
  requireActiveRookie(user);

  if (data.attendances.some((item) => item.userId === userId && item.attendanceDate === data.today)) {
    throw new UQuestDomainError("DUPLICATE_ATTENDANCE", "오늘 출석은 이미 완료했습니다.");
  }

  data = addPoint(
    {
      ...data,
      attendances: [
        ...data.attendances,
        {
          id: createId("att"),
          userId,
          attendanceDate: data.today,
          rewardPoints: 300
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + 5 })
    },
    userId,
    300,
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
    throw new UQuestDomainError("DAILY_LEARNING_LIMIT", "학습 완료는 하루 1개만 가능합니다. 다음 학습은 다음 근무일에 이어서 진행하세요.");
  }

  data = addPoint(
    {
      ...data,
      learningCompletions: [
        ...data.learningCompletions,
        {
          id: createId("learn"),
          userId,
          curriculumId,
          rewardPoints: curriculum.learningRewardPoints,
          createdAt: nowIso(data.today)
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + 10 })
    },
    userId,
    curriculum.learningRewardPoints,
    "learning",
    `Day ${curriculum.dayNumber} 학습 완료`
  );

  // 진도 기반 자동 수료: 20일 학습을 모두 마치면 그 시점에 수료 처리(상점 오픈 + 포인트 3개월 시작).
  const learnedCount = data.learningCompletions.filter((item) => item.userId === userId).length;
  if (learnedCount >= 20) {
    data = {
      ...data,
      users: updateUser(data.users, userId, { status: "completed", completedAt: nowIso(data.today) })
    };
  }

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

  const answers = questions.map((question) => {
    const selectedOption = answerMap[question.id] ?? -1;
    const isCorrect = selectedOption === question.correctOption;
    return {
      questionId: question.id,
      selectedOption,
      correctOption: question.correctOption,
      isCorrect,
      // 성실 비례: 정답은 만점, 오답은 시도 인정으로 소액(50P)만. 찍기와 학습이 구분된다.
      rewardPoints: isCorrect ? question.rewardPoints : 50
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
  if (!evidenceName.trim()) {
    throw new UQuestDomainError("AX_EVIDENCE_REQUIRED", "사진 업로드 또는 촬영이 필요합니다.");
  }
  const imageUrl = evidenceName.startsWith("/") || evidenceName.startsWith("http") ? evidenceName : `/mock/ax-evidence/${encodeURIComponent(evidenceName)}`;

  const before = deriveRookieSummary(data, user).axSubmissionCount;
  const after = before + 1;
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
          rewardPoints: category.rewardPoints,
          createdAt: nowIso(data.today)
        }
      ],
      users: updateUser(data.users, userId, { exp: user.exp + 8 })
    },
    userId,
    category.rewardPoints,
    "ax",
    `${category.title} 인증`
  );

  data = awardAxStageReward(data, userId, before, after);
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
  if (badgeId === "rare_all_public") return data.badges.filter((item) => !item.isRare).every((item) => ids.has(item.id));
  if (badgeId === "rare_legend") return ["rare_attendance", "rare_quiz", "rare_tier", "rare_ax_master", "rare_all_public"].every((id) => ids.has(id));
  return false;
}

function awardAxStageReward(data: FinalUQuestConfig, userId: string, before: number, after: number) {
  const rewards = [
    { count: 5, point: 1000, label: "Explorer" },
    { count: 10, point: 2000, label: "User" },
    { count: 15, point: 3000, label: "Expert" },
    { count: 20, point: 5000, label: "Master" }
  ];

  return rewards.reduce((current, reward) => {
    if (before < reward.count && after >= reward.count) {
      return addPoint(current, userId, reward.point, "ax", `AX ${reward.label} 단계 보상`);
    }
    return current;
  }, data);
}

function addPoint(data: FinalUQuestConfig, userId: string, amount: number, type: FinalPointHistory["type"], reason: string): FinalUQuestConfig {
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
