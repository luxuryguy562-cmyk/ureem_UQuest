import { describe, it, expect } from "vitest";
import {
  claimAttendance,
  completeLearning,
  submitQuiz,
  certifyAx,
  redeemCoupon,
  cancelCouponRequest,
  sendCouponRequest,
  approveUser,
  rejectUser,
  deriveRookieSummary,
  normalizeConfig,
  ATTENDANCE_LIMIT,
  UQuestDomainError
} from "@/lib/uquest-domain";
import type {
  FinalUQuestConfig,
  FinalUser,
  FinalCurriculum,
  FinalQuizQuestion,
  FinalAxCategory,
  FinalBadge,
  FinalCoupon,
  FinalCouponRequest
} from "@/types/uquest";

// ─── 픽스처 헬퍼 ─────────────────────────────────────────────────────────────

const TODAY = "2026-06-24";

function makeUser(overrides: Partial<FinalUser> = {}): FinalUser {
  return {
    id: "user-1",
    role: "rookie",
    name: "홍길동",
    phone: "010-0000-0000",
    loginId: "test",
    storeId: "store-1",
    hireDate: "2026-06-01",
    status: "active",
    exp: 0,
    badgeIds: [],
    ...overrides
  };
}

function makeCurriculum(dayNumber: number, id?: string): FinalCurriculum {
  return {
    id: id ?? `cur-${dayNumber}`,
    dayNumber,
    title: `Day ${dayNumber} 학습`,
    description: "내용",
    learningRewardPoints: 0,
    isPublished: true
  };
}

function makeQuiz(curriculumId: string, id?: string): FinalQuizQuestion {
  return {
    id: id ?? `quiz-${curriculumId}`,
    curriculumId,
    question: "테스트 문제",
    options: ["A", "B", "C", "D"],
    correctOption: 0,
    explanation: "해설",
    rewardPoints: 300
  };
}

function makeAxCategory(id = "ax-1"): FinalAxCategory {
  return {
    id,
    code: id,
    type: "AX",
    title: "챗봇 사용",
    description: "설명",
    rewardPoints: 200,
    isPublished: true,
    sortOrder: 1
  };
}

const ALL_BADGES: FinalBadge[] = [
  { id: "attendance_1", category: "attendance", name: "첫 출석", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 1 },
  { id: "attendance_5", category: "attendance", name: "출석 5일", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 2 },
  { id: "attendance_10", category: "attendance", name: "출석 10일", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 3 },
  { id: "attendance_15", category: "attendance", name: "출석 15일", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 4 },
  { id: "attendance_20", category: "attendance", name: "출석 20일", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: false, isHidden: false, sortOrder: 5 },
  { id: "quiz_1", category: "quiz", name: "첫 퀴즈", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 6 },
  { id: "tier_bronze", category: "tier", name: "Bronze", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 7 },
  { id: "tier_diamond", category: "tier", name: "Diamond", description: "", conditionLabel: "", rewardPoints: 0, imageKey: "", isRare: false, isHidden: false, sortOrder: 8 },
  { id: "rare_attendance", category: "rare", name: "희귀_출석", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 9 },
  { id: "rare_quiz", category: "rare", name: "희귀_퀴즈", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 10 },
  { id: "rare_tier", category: "rare", name: "희귀_티어", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 11 },
  { id: "rare_ax_master", category: "rare", name: "희귀_AX마스터", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 12 },
  { id: "rare_ax_peak", category: "rare", name: "희귀_AX최정상", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 13 },
  { id: "rare_all_public", category: "rare", name: "희귀_올클", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 14 },
  { id: "rare_legend", category: "rare", name: "희귀_전설", description: "", conditionLabel: "", rewardPoints: 100, imageKey: "", isRare: true, isHidden: true, sortOrder: 15 }
];

function makeConfig(overrides: Partial<FinalUQuestConfig> = {}): FinalUQuestConfig {
  return {
    source: "fallback",
    today: TODAY,
    activeUserId: "user-1",
    managerUserId: "manager-1",
    adminUserId: "admin-1",
    stores: [{ id: "store-1", name: "테스트매장", code: "테스트매장", isActive: true }],
    users: [
      makeUser(),
      { id: "admin-1", role: "admin", name: "관리자", phone: "", loginId: "admin", storeId: null, hireDate: null, status: "active", exp: 0, badgeIds: [] },
      { id: "manager-1", role: "manager", name: "매니저", phone: "", loginId: "mgr", storeId: "store-1", hireDate: null, status: "active", exp: 0, badgeIds: [] }
    ],
    curriculums: Array.from({ length: 20 }, (_, i) => makeCurriculum(i + 1)),
    quizzes: Array.from({ length: 20 }, (_, i) => makeQuiz(`cur-${i + 1}`)),
    attendances: [],
    learningCompletions: [],
    quizSubmissions: [],
    axCategories: [makeAxCategory("ax-1"), makeAxCategory("ax-2"), makeAxCategory("ax-3")],
    axSubmissions: [],
    badges: ALL_BADGES,
    pointHistories: [],
    coupons: [],
    couponRequests: [],
    notifications: [],
    adminAuditLogs: [],
    ...overrides
  };
}

function withAttendance(config: FinalUQuestConfig, date = TODAY): FinalUQuestConfig {
  return {
    ...config,
    attendances: [
      ...config.attendances,
      { id: `att-${date}`, userId: "user-1", attendanceDate: date, rewardPoints: 100 }
    ]
  };
}

function withLearning(config: FinalUQuestConfig, dayNumber: number, date = TODAY): FinalUQuestConfig {
  const curriculumId = `cur-${dayNumber}`;
  return {
    ...config,
    learningCompletions: [
      ...config.learningCompletions,
      { id: `learn-${dayNumber}`, userId: "user-1", curriculumId, rewardPoints: 0, createdAt: `${date}T10:00:00+09:00` }
    ]
  };
}

function withCompletedUser(config: FinalUQuestConfig): FinalUQuestConfig {
  return {
    ...config,
    users: config.users.map((u) =>
      u.id === "user-1" ? { ...u, status: "completed" as const, completedAt: "2026-05-01T10:00:00+09:00" } : u
    )
  };
}

// ─── 1. 가입/승인 단계 ────────────────────────────────────────────────────────

describe("가입/승인 단계", () => {
  it("pending 상태에서 출석 시도 → ACCOUNT_PENDING", () => {
    const config = makeConfig({
      users: [makeUser({ status: "pending" })]
    });
    expect(() => claimAttendance(config, "user-1")).toThrow(
      expect.objectContaining({ code: "ACCOUNT_PENDING" })
    );
  });

  it("rejected 상태에서 출석 시도 → ACCOUNT_REJECTED (반려 사유 포함)", () => {
    const config = makeConfig({
      users: [makeUser({ status: "rejected", rejectReason: "서류 미비" })]
    });
    expect(() => claimAttendance(config, "user-1")).toThrow(
      expect.objectContaining({ code: "ACCOUNT_REJECTED", message: "서류 미비" })
    );
  });

  it("어드민 승인 → 유저 status가 active로 변경됨", () => {
    const config = makeConfig({
      users: [
        makeUser({ status: "pending" }),
        { id: "admin-1", role: "admin", name: "관리자", phone: "", loginId: "admin", storeId: null, hireDate: null, status: "active", exp: 0, badgeIds: [] }
      ]
    });
    const result = approveUser(config, "admin-1", "user-1");
    const user = result.users.find((u) => u.id === "user-1");
    expect(user?.status).toBe("active");
    expect(user?.approvedAt).toBeTruthy();
  });

  it("어드민 반려 → 유저 status가 rejected, rejectReason 저장", () => {
    const config = makeConfig({
      users: [
        makeUser({ status: "pending" }),
        { id: "admin-1", role: "admin", name: "관리자", phone: "", loginId: "admin", storeId: null, hireDate: null, status: "active", exp: 0, badgeIds: [] }
      ]
    });
    const result = rejectUser(config, "admin-1", "user-1", "허위 정보");
    const user = result.users.find((u) => u.id === "user-1");
    expect(user?.status).toBe("rejected");
    expect(user?.rejectReason).toBe("허위 정보");
  });

  it("inactive 상태에서 출석 시도 → ACCOUNT_INACTIVE", () => {
    const config = makeConfig({
      users: [makeUser({ status: "inactive" })]
    });
    expect(() => claimAttendance(config, "user-1")).toThrow(
      expect.objectContaining({ code: "ACCOUNT_INACTIVE" })
    );
  });
});

// ─── 2. 출석 ─────────────────────────────────────────────────────────────────

describe("출석", () => {
  it("첫 출석 성공 → 출석 기록 추가, 포인트 적립", () => {
    const config = makeConfig();
    const result = claimAttendance(config, "user-1");
    expect(result.attendances.filter((a) => a.userId === "user-1")).toHaveLength(1);
    expect(result.pointHistories.filter((h) => h.userId === "user-1" && h.type === "attendance")).toHaveLength(1);
  });

  it("첫 출석 시 attendance_1 뱃지 자동 지급", () => {
    const config = makeConfig();
    const result = claimAttendance(config, "user-1");
    expect(result.users.find((u) => u.id === "user-1")?.badgeIds).toContain("attendance_1");
  });

  it("같은 날 출석 2번 시도 → DUPLICATE_ATTENDANCE", () => {
    const config = withAttendance(makeConfig());
    expect(() => claimAttendance(config, "user-1")).toThrow(
      expect.objectContaining({ code: "DUPLICATE_ATTENDANCE" })
    );
  });

  it("출석 19회 후 한 번 더 → 정상 (한도 미도달)", () => {
    // 첫 출석 2026-06-01 → 30일 만료 2026-07-01. today는 2026-06-25 (30일 이내)
    let config = makeConfig({ today: "2026-06-25" });
    for (let i = 0; i < 19; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      config = withAttendance(config, date);
    }
    // today가 2026-06-25이고 아직 출석 안 한 날이므로 20번째 출석 가능
    expect(() => claimAttendance(config, "user-1")).not.toThrow();
  });

  it("출석 20회 도달 후 추가 시도 → ATTENDANCE_LIMIT_REACHED", () => {
    // 첫 출석 2026-06-01 → 30일 만료 2026-07-01. today는 2026-06-22 (30일 이내)
    let config = makeConfig({ today: "2026-06-22" });
    for (let i = 0; i < 20; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      config = withAttendance(config, date);
    }
    expect(() => claimAttendance(config, "user-1")).toThrow(
      expect.objectContaining({ code: "ATTENDANCE_LIMIT_REACHED" })
    );
  });

  it("ATTENDANCE_LIMIT 상수는 20", () => {
    expect(ATTENDANCE_LIMIT).toBe(20);
  });
});

// ─── 3. 학습 ─────────────────────────────────────────────────────────────────

describe("학습", () => {
  it("출석 없이 학습 시도 → ATTENDANCE_REQUIRED", () => {
    const config = makeConfig();
    expect(() => completeLearning(config, "user-1", "cur-1")).toThrow(
      expect.objectContaining({ code: "ATTENDANCE_REQUIRED" })
    );
  });

  it("출석 후 Day1 학습 성공", () => {
    const config = withAttendance(makeConfig());
    const result = completeLearning(config, "user-1", "cur-1");
    expect(result.learningCompletions.filter((l) => l.userId === "user-1")).toHaveLength(1);
  });

  it("Day3인데 Day5 커리큘럼 학습 시도 → LEARNING_NOT_TODAY", () => {
    let config = withAttendance(makeConfig(), "2026-06-01");
    config = withLearning(config, 1, "2026-06-01");
    config = withAttendance(config, "2026-06-02");
    config = withLearning(config, 2, "2026-06-02");
    config = withAttendance(config, "2026-06-03");
    config = withLearning(config, 3, "2026-06-03");
    // 현재 Day4 상태에서 Day5 시도
    config = withAttendance(config, TODAY);
    expect(() => completeLearning(config, "user-1", "cur-5")).toThrow(
      expect.objectContaining({ code: "LEARNING_NOT_TODAY" })
    );
  });

  it("하루에 학습 2개 시도 → DAILY_LEARNING_LIMIT", () => {
    let config = withAttendance(makeConfig());
    config = completeLearning(config, "user-1", "cur-1");
    // 같은 날 Day2 학습은 하루 한도 초과
    config = withAttendance(config, TODAY); // 이미 있지만 중복은 무시하고 learningCompletions만 체크
    expect(() => completeLearning(config, "user-1", "cur-2")).toThrow(
      expect.objectContaining({ code: "DAILY_LEARNING_LIMIT" })
    );
  });

  it("이미 완료한 커리큘럼 재학습 → LEARNING_ALREADY_COMPLETED", () => {
    let config = withAttendance(makeConfig());
    config = completeLearning(config, "user-1", "cur-1");
    // 다음날 cur-1 재시도
    config = { ...config, today: "2026-06-25" };
    config = withAttendance(config, "2026-06-25");
    expect(() => completeLearning(config, "user-1", "cur-1")).toThrow(
      expect.objectContaining({ code: "LEARNING_ALREADY_COMPLETED" })
    );
  });

  it("수료 후 학습 시도 → ACCOUNT_COMPLETED", () => {
    const config = withAttendance(withCompletedUser(makeConfig()));
    expect(() => completeLearning(config, "user-1", "cur-1")).toThrow(
      expect.objectContaining({ code: "ACCOUNT_COMPLETED" })
    );
  });
});

// ─── 4. 퀴즈 ─────────────────────────────────────────────────────────────────

describe("퀴즈", () => {
  it("출석 없이 퀴즈 → ATTENDANCE_REQUIRED", () => {
    const config = makeConfig();
    expect(() => submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 0 })).toThrow(
      expect.objectContaining({ code: "ATTENDANCE_REQUIRED" })
    );
  });

  it("학습 없이 퀴즈 → LEARNING_REQUIRED", () => {
    const config = withAttendance(makeConfig());
    expect(() => submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 0 })).toThrow(
      expect.objectContaining({ code: "LEARNING_REQUIRED" })
    );
  });

  it("정상 퀴즈 제출 (전부 정답) → 포인트 적립, 제출 기록 생성", () => {
    let config = withAttendance(makeConfig());
    config = completeLearning(config, "user-1", "cur-1");
    const result = submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 0 });
    const sub = result.quizSubmissions.find((s) => s.userId === "user-1");
    expect(sub?.correctCount).toBe(1);
    expect(sub?.earnedPoints).toBe(300);
  });

  it("퀴즈 전부 오답 → 오답 포인트(30P) 적립", () => {
    let config = withAttendance(makeConfig());
    config = completeLearning(config, "user-1", "cur-1");
    const result = submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 3 }); // correctOption=0, wrong
    const sub = result.quizSubmissions.find((s) => s.userId === "user-1");
    expect(sub?.correctCount).toBe(0);
    expect(sub?.earnedPoints).toBe(30);
  });

  it("퀴즈 재제출 → QUIZ_ALREADY_SUBMITTED", () => {
    let config = withAttendance(makeConfig());
    config = completeLearning(config, "user-1", "cur-1");
    config = submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 0 });
    expect(() => submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 0 })).toThrow(
      expect.objectContaining({ code: "QUIZ_ALREADY_SUBMITTED" })
    );
  });

  it("일부 문항만 답 → QUIZ_INCOMPLETE", () => {
    // 퀴즈 2문항짜리 커리큘럼
    const config2q = makeConfig({
      quizzes: [
        makeQuiz("cur-1", "q1"),
        { ...makeQuiz("cur-1", "q2"), question: "두 번째 문제" }
      ]
    });
    let config = withAttendance(config2q);
    config = completeLearning(config, "user-1", "cur-1");
    expect(() => submitQuiz(config, "user-1", "cur-1", { q1: 0 })).toThrow(
      expect.objectContaining({ code: "QUIZ_INCOMPLETE" })
    );
  });
});

// ─── 5. AX 인증 ───────────────────────────────────────────────────────────────

describe("AX 인증", () => {
  it("이미지 없이 AX 제출 → AX_EVIDENCE_REQUIRED", () => {
    const config = withAttendance(makeConfig());
    expect(() => certifyAx(config, "user-1", "ax-1", "")).toThrow(
      expect.objectContaining({ code: "AX_EVIDENCE_REQUIRED" })
    );
  });

  it("AX 정상 인증 성공 → 포인트 적립", () => {
    const config = withAttendance(makeConfig());
    const result = certifyAx(config, "user-1", "ax-1", "photo.jpg");
    expect(result.axSubmissions.filter((s) => s.userId === "user-1")).toHaveLength(1);
    expect(result.pointHistories.some((h) => h.type === "ax")).toBe(true);
  });

  it("같은 항목 하루 2번 AX → AX_DAILY_LIMIT", () => {
    let config = withAttendance(makeConfig());
    config = certifyAx(config, "user-1", "ax-1", "photo.jpg");
    expect(() => certifyAx(config, "user-1", "ax-1", "photo2.jpg")).toThrow(
      expect.objectContaining({ code: "AX_DAILY_LIMIT" })
    );
  });

  it("ax-1 ax-2 ax-3 하루에 모두 인증 가능 (3개 항목 각각 1회)", () => {
    let config = withAttendance(makeConfig());
    config = certifyAx(config, "user-1", "ax-1", "p1.jpg");
    config = certifyAx(config, "user-1", "ax-2", "p2.jpg");
    config = certifyAx(config, "user-1", "ax-3", "p3.jpg");
    expect(config.axSubmissions.filter((s) => s.userId === "user-1")).toHaveLength(3);
  });

  it("다음날 동일 항목 재인증 정상 가능", () => {
    let config = withAttendance(makeConfig());
    config = certifyAx(config, "user-1", "ax-1", "p1.jpg");
    config = { ...config, today: "2026-06-25" };
    config = withAttendance(config, "2026-06-25");
    expect(() => certifyAx(config, "user-1", "ax-1", "p2.jpg")).not.toThrow();
  });

  it("출석 없어도 AX 가능 (출석 관문 없음)", () => {
    const config = makeConfig();
    expect(() => certifyAx(config, "user-1", "ax-1", "photo.jpg")).not.toThrow();
  });

  it("수료(completed) 후 AX → ACCOUNT_COMPLETED", () => {
    const config = withCompletedUser(makeConfig());
    expect(() => certifyAx(config, "user-1", "ax-1", "photo.jpg")).toThrow(
      expect.objectContaining({ code: "ACCOUNT_COMPLETED" })
    );
  });
});

// ─── 6. 자동 수료 (30일 경과) ─────────────────────────────────────────────────

describe("자동 수료", () => {
  it("첫 출석 후 30일 경과 → active → completed 자동 변환", () => {
    let config = makeConfig({ today: "2026-05-01" });
    config = withAttendance(config, "2026-05-01");
    // 30일 후 날짜로 설정
    config = { ...config, today: "2026-05-31" };
    const normalized = normalizeConfig(config);
    expect(normalized.users.find((u) => u.id === "user-1")?.status).toBe("completed");
  });

  it("첫 출석 후 29일 경과 → 아직 active", () => {
    let config = makeConfig({ today: "2026-05-01" });
    config = withAttendance(config, "2026-05-01");
    config = { ...config, today: "2026-05-30" };
    const normalized = normalizeConfig(config);
    expect(normalized.users.find((u) => u.id === "user-1")?.status).toBe("active");
  });

  it("출석 없으면 30일 지나도 수료 안 됨 (온보딩 미시작)", () => {
    const config = makeConfig({ today: "2026-12-31" });
    const normalized = normalizeConfig(config);
    expect(normalized.users.find((u) => u.id === "user-1")?.status).toBe("active");
  });

  it("수료 후 출석 시도 → ACCOUNT_COMPLETED", () => {
    // 첫 출석 2026-05-01, 오늘 2026-05-31 (30일 경과, 자동 수료)
    let config = makeConfig({ today: "2026-05-01" });
    config = withAttendance(config, "2026-05-01");
    config = { ...config, today: "2026-05-31" };
    expect(() => claimAttendance(config, "user-1")).toThrow(
      expect.objectContaining({ code: "ACCOUNT_COMPLETED" })
    );
  });

  it("학습 10개만 된 상태로 30일 경과 → 자동 수료 (미완성도 수료)", () => {
    let config = makeConfig({ today: "2026-05-01" });
    config = withAttendance(config, "2026-05-01");
    for (let i = 1; i <= 10; i++) {
      config = withLearning(config, i, `2026-05-${String(i).padStart(2, "0")}`);
    }
    config = { ...config, today: "2026-05-31" };
    const normalized = normalizeConfig(config);
    expect(normalized.users.find((u) => u.id === "user-1")?.status).toBe("completed");
  });
});

// ─── 7. 샵/쿠폰 ───────────────────────────────────────────────────────────────

const testCoupon: FinalCoupon = {
  id: "coupon-1",
  name: "아메리카노",
  description: "카페 교환권",
  actualPrice: 5000,
  requiredPoints: 1000,
  stockQuantity: 5,
  isPublished: true
};

describe("샵/쿠폰", () => {
  it("active 상태에서 쿠폰 교환 시도 → SHOP_LOCKED_UNTIL_COMPLETION", () => {
    const config = makeConfig({ coupons: [testCoupon] });
    expect(() => redeemCoupon(config, "user-1", "coupon-1")).toThrow(
      expect.objectContaining({ code: "SHOP_LOCKED_UNTIL_COMPLETION" })
    );
  });

  it("수료 후 포인트 충분하면 쿠폰 교환 성공", () => {
    let config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    // 포인트 추가
    config = {
      ...config,
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 2000, balanceAfter: 2000, type: "attendance", reason: "test", createdAt: TODAY }]
    };
    const result = redeemCoupon(config, "user-1", "coupon-1");
    expect(result.couponRequests.find((r) => r.userId === "user-1")?.status).toBe("requested");
    expect(result.pointHistories.some((h) => h.amount === -1000)).toBe(true);
  });

  it("포인트 부족 → INSUFFICIENT_POINTS", () => {
    const config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    // 포인트 없음
    expect(() => redeemCoupon(config, "user-1", "coupon-1")).toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_POINTS" })
    );
  });

  it("재고 0 쿠폰 교환 시도 → COUPON_OUT_OF_STOCK", () => {
    const outOfStock = { ...testCoupon, stockQuantity: 0 };
    let config = withCompletedUser(makeConfig({ coupons: [outOfStock] }));
    config = {
      ...config,
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 5000, balanceAfter: 5000, type: "attendance", reason: "test", createdAt: TODAY }]
    };
    expect(() => redeemCoupon(config, "user-1", "coupon-1")).toThrow(
      expect.objectContaining({ code: "COUPON_OUT_OF_STOCK" })
    );
  });

  it("동일 쿠폰 중복 신청 → DUPLICATE_COUPON_REQUEST", () => {
    let config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    config = {
      ...config,
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 5000, balanceAfter: 5000, type: "attendance", reason: "test", createdAt: TODAY }]
    };
    config = redeemCoupon(config, "user-1", "coupon-1");
    expect(() => redeemCoupon(config, "user-1", "coupon-1")).toThrow(
      expect.objectContaining({ code: "DUPLICATE_COUPON_REQUEST" })
    );
  });

  it("발송 전 쿠폰 취소 → status canceled, 포인트 환불", () => {
    let config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    config = {
      ...config,
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 2000, balanceAfter: 2000, type: "attendance", reason: "test", createdAt: TODAY }]
    };
    config = redeemCoupon(config, "user-1", "coupon-1");
    const requestId = config.couponRequests[0].id;
    const result = cancelCouponRequest(config, "user-1", requestId, "변심");
    expect(result.couponRequests[0].status).toBe("canceled");
    expect(result.pointHistories.some((h) => h.type === "coupon_cancel" && h.amount === 1000)).toBe(true);
  });

  it("어드민 발송 처리 후 취소 시도 → COUPON_ALREADY_SENT", () => {
    let config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    config = {
      ...config,
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 2000, balanceAfter: 2000, type: "attendance", reason: "test", createdAt: TODAY }]
    };
    config = redeemCoupon(config, "user-1", "coupon-1");
    const requestId = config.couponRequests[0].id;
    config = sendCouponRequest(config, "admin-1", requestId);
    expect(() => cancelCouponRequest(config, "user-1", requestId, "변심")).toThrow(
      expect.objectContaining({ code: "COUPON_ALREADY_SENT" })
    );
  });

  it("어드민 발송 처리 → 재고 1 감소", () => {
    let config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    config = {
      ...config,
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 2000, balanceAfter: 2000, type: "attendance", reason: "test", createdAt: TODAY }]
    };
    config = redeemCoupon(config, "user-1", "coupon-1");
    const requestId = config.couponRequests[0].id;
    const result = sendCouponRequest(config, "admin-1", requestId);
    expect(result.coupons.find((c) => c.id === "coupon-1")?.stockQuantity).toBe(4);
  });

  it("수료 3개월 후 쿠폰 교환 시도 → POINTS_EXPIRED", () => {
    const config = makeConfig({
      today: "2026-09-10",
      coupons: [testCoupon],
      users: [makeUser({ status: "completed", completedAt: "2026-05-01T10:00:00+09:00" })],
      pointHistories: [{ id: "pt-1", userId: "user-1", amount: 5000, balanceAfter: 5000, type: "attendance", reason: "test", createdAt: "2026-05-01" }]
    });
    expect(() => redeemCoupon(config, "user-1", "coupon-1")).toThrow(
      expect.objectContaining({ code: "POINTS_EXPIRED" })
    );
  });
});

// ─── 8. 뱃지 자동 지급 ────────────────────────────────────────────────────────

describe("뱃지 자동 지급", () => {
  it("출석 1회 → attendance_1 뱃지", () => {
    const config = makeConfig();
    const result = claimAttendance(config, "user-1");
    expect(result.users.find((u) => u.id === "user-1")?.badgeIds).toContain("attendance_1");
  });

  it("동일 뱃지 중복 지급 안 됨 (idempotency)", () => {
    let config = makeConfig();
    config = claimAttendance(config, "user-1");
    const badgeCountBefore = config.users.find((u) => u.id === "user-1")?.badgeIds.filter((id) => id === "attendance_1").length;
    // 다음날 출석
    config = { ...config, today: "2026-06-25" };
    config = claimAttendance(config, "user-1");
    const badgeCountAfter = config.users.find((u) => u.id === "user-1")?.badgeIds.filter((id) => id === "attendance_1").length;
    expect(badgeCountBefore).toBe(1);
    expect(badgeCountAfter).toBe(1);
  });

  it("퀴즈 첫 제출 → quiz_1 뱃지 + tier_bronze 뱃지 (정답률>0이면)", () => {
    let config = withAttendance(makeConfig());
    config = completeLearning(config, "user-1", "cur-1");
    const result = submitQuiz(config, "user-1", "cur-1", { "quiz-cur-1": 0 }); // 정답
    expect(result.users.find((u) => u.id === "user-1")?.badgeIds).toContain("quiz_1");
    expect(result.users.find((u) => u.id === "user-1")?.badgeIds).toContain("tier_diamond"); // 1/1 = 100% = Diamond
  });

  it("뱃지 포인트 > 0 이면 포인트 내역 생성됨", () => {
    // attendance_20 뱃지는 100P 지급. 첫 출석 2026-06-01 → 만료 2026-07-01. today=2026-06-21 (30일 이내)
    let config = makeConfig({ today: "2026-06-21" });
    for (let i = 0; i < 19; i++) {
      const date = `2026-06-${String(i + 1).padStart(2, "0")}`;
      config = withAttendance(config, date);
    }
    const result = claimAttendance(config, "user-1");
    expect(result.pointHistories.some((h) => h.type === "badge" && h.userId === "user-1")).toBe(true);
  });
});

// ─── 9. 캐릭터 레벨 계산 ─────────────────────────────────────────────────────

describe("캐릭터 레벨 계산", () => {
  it("아무것도 안 한 상태 → Lv1", () => {
    const config = makeConfig();
    const user = config.users.find((u) => u.id === "user-1")!;
    const summary = deriveRookieSummary(config, user);
    expect(summary.characterLevel).toBe(1);
  });

  it("출석 10/20, 학습 10/20, 퀴즈 절반 → Lv3 (50%)", () => {
    let config = makeConfig();
    for (let i = 1; i <= 10; i++) {
      const date = `2026-05-${String(i).padStart(2, "0")}`;
      config = withAttendance(config, date);
      config = withLearning(config, i, date);
    }
    // 퀴즈 전체 20문항 중 10문항 푼 걸 시뮬레이션 (quizSolvedCount = 10)
    config = {
      ...config,
      quizSubmissions: [
        { id: "qs1", userId: "user-1", curriculumId: "cur-1", totalCount: 10, correctCount: 5, earnedPoints: 0, answers: [], submittedAt: "2026-05-01T10:00:00+09:00" }
      ]
    };
    const user = config.users.find((u) => u.id === "user-1")!;
    const summary = deriveRookieSummary(config, user);
    // (0.5 + 0.5 + 10/20) / 3 = 0.5 → 50% → Lv3
    expect(summary.progressRate).toBe(50);
    expect(summary.characterLevel).toBe(3);
  });

  it("출석 20/20, 학습 20/20, 퀴즈 전부 → Lv5 (100%)", () => {
    let config = makeConfig();
    for (let i = 1; i <= 20; i++) {
      const date = `2026-05-${String(i).padStart(2, "0")}`;
      config = withAttendance(config, date);
      config = withLearning(config, i, date);
    }
    const totalQs = config.quizzes.length; // 20
    config = {
      ...config,
      quizSubmissions: [
        { id: "qs1", userId: "user-1", curriculumId: "cur-1", totalCount: totalQs, correctCount: totalQs, earnedPoints: 0, answers: [], submittedAt: "2026-05-01T10:00:00+09:00" }
      ]
    };
    const user = config.users.find((u) => u.id === "user-1")!;
    const summary = deriveRookieSummary(config, user);
    expect(summary.characterLevel).toBe(5);
  });

  it("출석 20/20, 학습 20/20, 퀴즈 0 → Lv3 (66%)", () => {
    let config = makeConfig();
    for (let i = 1; i <= 20; i++) {
      const date = `2026-05-${String(i).padStart(2, "0")}`;
      config = withAttendance(config, date);
      config = withLearning(config, i, date);
    }
    const user = config.users.find((u) => u.id === "user-1")!;
    const summary = deriveRookieSummary(config, user);
    // (1.0 + 1.0 + 0.0) / 3 = 66% → Lv3
    expect(summary.progressRate).toBe(67); // 66.66... → round → 67
    expect(summary.characterLevel).toBe(3);
  });

  it("AX 인증 수는 캐릭터 레벨에 영향 없음", () => {
    let config = makeConfig();
    // 출석, 학습, 퀴즈 없이 AX만 잔뜩
    config = {
      ...config,
      axSubmissions: Array.from({ length: 30 }, (_, i) => ({
        id: `ax-${i}`, userId: "user-1", categoryId: "ax-1",
        imageUrl: "x.jpg", rewardPoints: 200,
        createdAt: `2026-05-${String((i % 28) + 1).padStart(2, "0")}T10:00:00+09:00`
      }))
    };
    const user = config.users.find((u) => u.id === "user-1")!;
    const summary = deriveRookieSummary(config, user);
    expect(summary.characterLevel).toBe(1); // AX는 레벨과 무관
  });
});

// ─── 10. 퀴즈 티어 ────────────────────────────────────────────────────────────

describe("퀴즈 티어", () => {
  it("퀴즈 한 번도 안 풀면 Unranked", () => {
    const config = makeConfig();
    const user = config.users.find((u) => u.id === "user-1")!;
    expect(deriveRookieSummary(config, user).quizTier).toBe("Unranked");
  });

  it("정답률 100% → Diamond", () => {
    const config = makeConfig({
      quizSubmissions: [{ id: "qs1", userId: "user-1", curriculumId: "cur-1", totalCount: 5, correctCount: 5, earnedPoints: 0, answers: [], submittedAt: TODAY }]
    });
    const user = config.users.find((u) => u.id === "user-1")!;
    expect(deriveRookieSummary(config, user).quizTier).toBe("Diamond");
  });

  it("정답률 60% → Gold", () => {
    const config = makeConfig({
      quizSubmissions: [{ id: "qs1", userId: "user-1", curriculumId: "cur-1", totalCount: 10, correctCount: 6, earnedPoints: 0, answers: [], submittedAt: TODAY }]
    });
    const user = config.users.find((u) => u.id === "user-1")!;
    expect(deriveRookieSummary(config, user).quizTier).toBe("Gold");
  });
});

// ─── 11. AX 단계 ─────────────────────────────────────────────────────────────

describe("AX 단계", () => {
  it("인증 0회 → Explorer", () => {
    const config = makeConfig();
    const user = config.users.find((u) => u.id === "user-1")!;
    expect(deriveRookieSummary(config, user).axLevel).toBe("Explorer");
  });

  it("인증 10회 → User", () => {
    const config = makeConfig({
      axSubmissions: Array.from({ length: 10 }, (_, i) => ({
        id: `ax-${i}`, userId: "user-1", categoryId: "ax-1",
        imageUrl: "x.jpg", rewardPoints: 200,
        createdAt: `2026-05-${String(i + 1).padStart(2, "0")}T10:00:00+09:00`
      }))
    });
    const user = config.users.find((u) => u.id === "user-1")!;
    expect(deriveRookieSummary(config, user).axLevel).toBe("User");
  });

  it("인증 20회 → Master", () => {
    const config = makeConfig({
      axSubmissions: Array.from({ length: 20 }, (_, i) => ({
        id: `ax-${i}`, userId: "user-1", categoryId: "ax-1",
        imageUrl: "x.jpg", rewardPoints: 200,
        createdAt: `2026-05-${String((i % 28) + 1).padStart(2, "0")}T10:00:00+09:00`
      }))
    });
    const user = config.users.find((u) => u.id === "user-1")!;
    expect(deriveRookieSummary(config, user).axLevel).toBe("Master");
  });
});

// ─── 12. 포인트 엣지케이스 ───────────────────────────────────────────────────

describe("포인트 엣지케이스", () => {
  it("학습 포인트 0P → 포인트 내역 생성 안 됨", () => {
    let config = withAttendance(makeConfig());
    const before = config.pointHistories.length;
    config = completeLearning(config, "user-1", "cur-1"); // learningPoints 기본 0P
    const after = config.pointHistories.filter((h) => h.type === "learning").length;
    expect(after).toBe(0); // 0P는 기록 안 함
  });

  it("포인트 0 미만으로 내려가는 차감 → INSUFFICIENT_POINTS", () => {
    // 포인트 없는 수료 유저가 쿠폰 교환 시도
    const config = withCompletedUser(makeConfig({ coupons: [testCoupon] }));
    expect(() => redeemCoupon(config, "user-1", "coupon-1")).toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_POINTS" })
    );
  });
});

// ─── 13. 매니저 읽기 전용 확인 ───────────────────────────────────────────────

describe("매니저 읽기 전용", () => {
  it("매니저가 출석 시도 → FORBIDDEN_ROLE", () => {
    const config = makeConfig();
    expect(() => claimAttendance(config, "manager-1")).toThrow(
      expect.objectContaining({ code: "FORBIDDEN_ROLE" })
    );
  });

  it("매니저가 쿠폰 발송 시도 → FORBIDDEN_ROLE", () => {
    const req: FinalCouponRequest = {
      id: "req-1", userId: "user-1", couponId: "coupon-1",
      requiredPoints: 1000, status: "requested",
      requestedAt: TODAY
    };
    const config = makeConfig({ couponRequests: [req], coupons: [testCoupon] });
    expect(() => sendCouponRequest(config, "manager-1", "req-1")).toThrow(
      expect.objectContaining({ code: "FORBIDDEN_ROLE" })
    );
  });
});
