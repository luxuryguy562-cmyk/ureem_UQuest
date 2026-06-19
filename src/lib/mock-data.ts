import type {
  FinalAxCategory,
  FinalBadge,
  FinalCoupon,
  FinalCurriculum,
  FinalPointHistory,
  FinalQuizQuestion,
  FinalUQuestConfig
} from "@/types/uquest";

const today = "2026-06-16";

const curriculums: FinalCurriculum[] = Array.from({ length: 20 }, (_, index) => {
  const dayNumber = index + 1;
  const titles = [
    "첫 출근과 기본 규칙",
    "매장 동선과 고객 맞이",
    "요금제 기본 구조",
    "U+ONE 핵심 사용법",
    "스마트CS 응대 루틴",
    "AI 헬프데스크 활용",
    "요금 시뮬레이터 실습",
    "생애주기 상담 이해",
    "타사 확보 대화 흐름",
    "자사 전환 체크포인트",
    "멤버십과 부가서비스",
    "개통 전 확인 항목",
    "클레임 1차 대응",
    "개인정보 보호",
    "피크타임 운영",
    "재고와 예약 관리",
    "상담 품질 점검",
    "AX/DX 실전 적용",
    "수료 전 복습",
    "온보딩 마무리"
  ];

  return {
    id: `day-${dayNumber}`,
    dayNumber,
    title: titles[index] ?? `Day ${dayNumber}`,
    description: `${dayNumber}일차에 필요한 현장 업무와 시스템 활용을 학습합니다.`,
    learningRewardPoints: 300,
    isPublished: true
  };
});

const axCategories: FinalAxCategory[] = [
  {
    id: "ax-ai-helpdesk",
    code: "AI_HELPDESK",
    type: "AX",
    title: "AI 헬프데스크",
    description: "현장 질문을 AI 헬프데스크로 먼저 검색하고 답을 확인합니다.",
    rewardPoints: 500,
    isPublished: true,
    sortOrder: 1
  },
  {
    id: "ax-smart-cs",
    code: "SMART_CS",
    type: "AX",
    title: "스마트CS",
    description: "고객 응대 전후로 스마트CS 기록을 정리합니다.",
    rewardPoints: 500,
    isPublished: true,
    sortOrder: 2
  },
  {
    id: "ax-rate-simulator",
    code: "RATE_SIMULATOR",
    type: "AX",
    title: "요금시뮬레이터",
    description: "요금제 비교와 예상 청구 금액을 시뮬레이션합니다.",
    rewardPoints: 500,
    isPublished: true,
    sortOrder: 3
  }
];

const badges: FinalBadge[] = [
  { id: "attendance_1", category: "attendance", name: "첫 출근", description: "첫 출석을 완료했습니다.", conditionLabel: "출석 1일", rewardPoints: 500, imageKey: "attendance_1", isRare: false, isHidden: false, sortOrder: 1 },
  { id: "attendance_5", category: "attendance", name: "성실 사원", description: "5일 출석을 완료했습니다.", conditionLabel: "출석 5일", rewardPoints: 1000, imageKey: "attendance_5", isRare: false, isHidden: false, sortOrder: 2 },
  { id: "attendance_10", category: "attendance", name: "꾸준 사원", description: "10일 출석을 완료했습니다.", conditionLabel: "출석 10일", rewardPoints: 1500, imageKey: "attendance_10", isRare: false, isHidden: false, sortOrder: 3 },
  { id: "attendance_15", category: "attendance", name: "모범 사원", description: "15일 출석을 완료했습니다.", conditionLabel: "출석 15일", rewardPoints: 2000, imageKey: "attendance_15", isRare: false, isHidden: false, sortOrder: 4 },
  { id: "attendance_20", category: "attendance", name: "출근 마스터", description: "20일 출석을 완료했습니다.", conditionLabel: "출석 20일", rewardPoints: 3000, imageKey: "attendance_20", isRare: false, isHidden: false, sortOrder: 5 },
  { id: "quiz_1", category: "quiz", name: "첫 도전", description: "첫 퀴즈를 제출했습니다.", conditionLabel: "퀴즈 1문제 풀이", rewardPoints: 500, imageKey: "quiz_1", isRare: false, isHidden: false, sortOrder: 11 },
  { id: "quiz_10", category: "quiz", name: "학습가", description: "퀴즈 10문제를 풀이했습니다.", conditionLabel: "퀴즈 10문제 풀이", rewardPoints: 1000, imageKey: "quiz_10", isRare: false, isHidden: false, sortOrder: 12 },
  { id: "quiz_30", category: "quiz", name: "탐구가", description: "퀴즈 30문제를 풀이했습니다.", conditionLabel: "퀴즈 30문제 풀이", rewardPoints: 1500, imageKey: "quiz_30", isRare: false, isHidden: false, sortOrder: 13 },
  { id: "quiz_50", category: "quiz", name: "지식인", description: "퀴즈 50문제를 풀이했습니다.", conditionLabel: "퀴즈 50문제 풀이", rewardPoints: 2000, imageKey: "quiz_50", isRare: false, isHidden: false, sortOrder: 14 },
  { id: "quiz_60", category: "quiz", name: "퀴즈 마스터", description: "퀴즈 60문제를 풀이했습니다.", conditionLabel: "퀴즈 60문제 풀이", rewardPoints: 3000, imageKey: "quiz_60", isRare: false, isHidden: false, sortOrder: 15 },
  { id: "tier_bronze", category: "tier", name: "Bronze", description: "정답률 20% 이상을 달성했습니다.", conditionLabel: "정답률 20% 이상", rewardPoints: 500, imageKey: "tier_bronze", isRare: false, isHidden: false, sortOrder: 21 },
  { id: "tier_silver", category: "tier", name: "Silver", description: "정답률 40% 이상을 달성했습니다.", conditionLabel: "정답률 40% 이상", rewardPoints: 1000, imageKey: "tier_silver", isRare: false, isHidden: false, sortOrder: 22 },
  { id: "tier_gold", category: "tier", name: "Gold", description: "정답률 60% 이상을 달성했습니다.", conditionLabel: "정답률 60% 이상", rewardPoints: 2000, imageKey: "tier_gold", isRare: false, isHidden: false, sortOrder: 23 },
  { id: "tier_platinum", category: "tier", name: "Platinum", description: "정답률 80% 이상을 달성했습니다.", conditionLabel: "정답률 80% 이상", rewardPoints: 3000, imageKey: "tier_platinum", isRare: false, isHidden: false, sortOrder: 24 },
  { id: "tier_diamond", category: "tier", name: "Diamond", description: "정답률 95% 이상을 달성했습니다.", conditionLabel: "정답률 95% 이상", rewardPoints: 5000, imageKey: "tier_diamond", isRare: false, isHidden: false, sortOrder: 25 },
  { id: "rare_attendance", category: "attendance", name: "성실의 증명", description: "캐릭터 레벨 4 이상(출석·학습·퀴즈 종합 성실)에 도달했습니다.", conditionLabel: "캐릭터 레벨 4 달성", rewardPoints: 3000, imageKey: "rare_attendance", isRare: false, isHidden: false, sortOrder: 6 },
  { id: "rare_quiz", category: "rare", name: "지식의 증명", description: "퀴즈 정답률 90% 이상을 달성했습니다.", conditionLabel: "획득 전에는 조건 숨김", rewardPoints: 3000, imageKey: "rare_quiz", isRare: true, isHidden: true, sortOrder: 32 },
  { id: "rare_tier", category: "rare", name: "실력의 증명", description: "Diamond 티어를 달성했습니다.", conditionLabel: "획득 전에는 조건 숨김", rewardPoints: 5000, imageKey: "rare_tier", isRare: true, isHidden: true, sortOrder: 33 },
  { id: "rare_ax_master", category: "ax", name: "혁신의 증명", description: "AX Master(20건)에 도달했습니다.", conditionLabel: "AX Master 달성", rewardPoints: 5000, imageKey: "rare_ax_master", isRare: false, isHidden: false, sortOrder: 41 },
  { id: "rare_ax_peak", category: "rare", name: "AX 정점", description: "AX 60건 이상 인증했습니다.", conditionLabel: "획득 전에는 조건 숨김", rewardPoints: 5000, imageKey: "rare_ax_master", isRare: true, isHidden: true, sortOrder: 35 },
  { id: "rare_all_public", category: "rare", name: "성장의 정점", description: "모든 공개 배지를 획득했습니다.", conditionLabel: "획득 전에는 조건 숨김", rewardPoints: 10000, imageKey: "rare_all_public", isRare: true, isHidden: true, sortOrder: 36 },
  { id: "rare_legend", category: "rare", name: "U-Quest Legend", description: "모든 희귀 배지를 획득했습니다.", conditionLabel: "획득 전에는 조건 숨김", rewardPoints: 15000, imageKey: "rare_legend", isRare: true, isHidden: true, sortOrder: 37 }
];

const coupons: FinalCoupon[] = [
  { id: "coupon-starbucks", name: "스타벅스 모바일 쿠폰", description: "재고 제한 없이 신청 가능한 기본 쿠폰입니다.", actualPrice: 5000, requiredPoints: 5000, stockQuantity: null, isPublished: true },
  { id: "coupon-giftcard", name: "편의점 모바일 상품권 1만원권", description: "본사 발송 완료 전까지 취소할 수 있습니다.", actualPrice: 10000, requiredPoints: 10000, stockQuantity: 100, isPublished: true },
  { id: "coupon-chicken", name: "치킨 세트 기프티콘", description: "재고가 없을 때의 예외 처리를 확인하는 상품입니다.", actualPrice: 22000, requiredPoints: 22000, stockQuantity: 0, isPublished: true },
  { id: "coupon-long-name", name: "긴 이름 테스트용 프리미엄 온보딩 축하 패키지 쿠폰", description: "긴 쿠폰명에서도 카드가 깨지지 않는지 확인합니다.", actualPrice: 15000, requiredPoints: 15000, stockQuantity: 8, isPublished: true }
];

const pointHistories: FinalPointHistory[] = [
  history("pt-att-1", "rookie-001", 300, 300, "attendance", "2026-06-02 출석 보상", "2026-06-02T09:05:00+09:00"),
  history("pt-att-2", "rookie-001", 300, 600, "attendance", "2026-06-03 출석 보상", "2026-06-03T09:02:00+09:00"),
  history("pt-att-3", "rookie-001", 300, 900, "attendance", "2026-06-04 출석 보상", "2026-06-04T09:08:00+09:00"),
  history("pt-att-4", "rookie-001", 300, 1200, "attendance", "2026-06-05 출석 보상", "2026-06-05T09:01:00+09:00"),
  history("pt-learn-1", "rookie-001", 300, 1500, "learning", "Day 1 학습 완료", "2026-06-02T10:20:00+09:00"),
  history("pt-learn-2", "rookie-001", 300, 1800, "learning", "Day 2 학습 완료", "2026-06-03T10:10:00+09:00"),
  history("pt-quiz-1", "rookie-001", 600, 2400, "quiz", "Day 1 퀴즈 2문제 제출", "2026-06-02T11:40:00+09:00"),
  history("pt-ax-1", "rookie-001", 500, 2900, "ax", "AI 헬프데스크 인증", "2026-06-04T15:10:00+09:00"),
  history("pt-ax-2", "rookie-001", 500, 3400, "ax", "스마트CS 인증", "2026-06-05T15:12:00+09:00"),
  history("pt-ax-3", "rookie-001", 500, 3900, "ax", "U+ONE 인증", "2026-06-06T15:10:00+09:00"),
  history("pt-ax-4", "rookie-001", 500, 4400, "ax", "생애주기 인증", "2026-06-07T15:12:00+09:00"),
  history("pt-badge-a1", "rookie-001", 500, 4900, "badge", "첫 출근 배지 보상", "2026-06-02T09:05:10+09:00"),
  history("pt-badge-q1", "rookie-001", 500, 5400, "badge", "첫 도전 배지 보상", "2026-06-02T11:40:10+09:00"),
  history("pt-completed", "rookie-003", 100000, 100000, "manual_add", "수료자 샘플 잔액", "2026-06-15T18:00:00+09:00")
];

export const finalFallbackAppConfig: FinalUQuestConfig = {
  source: "fallback",
  today,
  activeUserId: "rookie-001",
  managerUserId: "manager-001",
  adminUserId: "admin-001",
  rewardConfig: {
    attendancePoints: 100,
    learningPoints: 0,
    quizCorrectPoints: 300,
    quizWrongPoints: 30,
    axPoints: 200
  },
  stores: [
    { id: "store-gangnam", name: "강남점", code: "GN", district: "서울담당", team: "데모team", isActive: true },
    { id: "store-jamsil", name: "잠실점", code: "JS", district: "서울담당", team: "데모team", isActive: true }
  ],
  users: [
    {
      id: "rookie-001",
      role: "rookie",
      name: "김은성",
      avatarGender: "male",
      phone: "010-1111-2222",
      loginId: "rookie.kim",
      storeId: "store-gangnam",
      hireDate: "2026-06-02",
      status: "active",
      approvedAt: "2026-06-01T16:00:00+09:00",
      exp: 64,
      badgeIds: ["attendance_1", "quiz_1"]
    },
    {
      id: "rookie-002",
      role: "rookie",
      name: "승인대기신입_긴이름_테스트",
      avatarGender: "female",
      phone: "010-2222-3333",
      loginId: "pending.long",
      storeId: "store-gangnam",
      hireDate: "2026-06-17",
      status: "pending",
      exp: 0,
      badgeIds: []
    },
    {
      id: "rookie-003",
      role: "rookie",
      name: "박수료",
      avatarGender: "male",
      phone: "010-3333-4444",
      loginId: "completed.park",
      storeId: "store-gangnam",
      hireDate: "2026-05-13",
      status: "completed",
      approvedAt: "2026-05-12T17:00:00+09:00",
      completedAt: "2026-06-10T00:00:00+09:00",
      exp: 420,
      badgeIds: ["attendance_1", "attendance_5", "attendance_10", "quiz_1", "quiz_10", "tier_gold"]
    },
    {
      id: "rookie-004",
      role: "rookie",
      name: "이반려",
      phone: "010-4444-5555",
      loginId: "reject.lee",
      storeId: "store-jamsil",
      hireDate: "2026-06-14",
      status: "rejected",
      rejectReason: "휴대폰번호 확인 필요",
      exp: 0,
      badgeIds: []
    },
    {
      id: "rookie-005",
      role: "rookie",
      name: "최퇴사",
      phone: "010-5555-6666",
      loginId: "inactive.choi",
      storeId: "store-gangnam",
      hireDate: "2026-05-20",
      status: "inactive",
      inactiveAt: "2026-06-14T10:00:00+09:00",
      exp: 30,
      badgeIds: []
    },
    {
      id: "manager-001",
      role: "manager",
      name: "강남점장",
      phone: "010-7777-8888",
      loginId: "manager.gn",
      storeId: "store-gangnam",
      hireDate: null,
      status: "active",
      exp: 0,
      badgeIds: []
    },
    {
      id: "admin-001",
      role: "admin",
      name: "본사관리자",
      phone: "010-9999-0000",
      loginId: "admin.hq",
      storeId: null,
      hireDate: null,
      status: "active",
      exp: 0,
      badgeIds: []
    }
  ],
  curriculums,
  quizzes: createQuizzes(curriculums),
  attendances: [
    { id: "att-1", userId: "rookie-001", attendanceDate: "2026-06-02", rewardPoints: 300 },
    { id: "att-2", userId: "rookie-001", attendanceDate: "2026-06-03", rewardPoints: 300 },
    { id: "att-3", userId: "rookie-001", attendanceDate: "2026-06-04", rewardPoints: 300 },
    { id: "att-4", userId: "rookie-001", attendanceDate: "2026-06-05", rewardPoints: 300 }
  ],
  learningCompletions: [
    { id: "learn-1", userId: "rookie-001", curriculumId: "day-1", rewardPoints: 300, createdAt: "2026-06-02T10:20:00+09:00" },
    { id: "learn-2", userId: "rookie-001", curriculumId: "day-2", rewardPoints: 300, createdAt: "2026-06-03T10:10:00+09:00" }
  ],
  quizSubmissions: [
    {
      id: "quiz-sub-1",
      userId: "rookie-001",
      curriculumId: "day-1",
      totalCount: 2,
      correctCount: 1,
      earnedPoints: 600,
      submittedAt: "2026-06-02T11:40:00+09:00",
      answers: [
        { questionId: "quiz-day-1-1", selectedOption: 0, correctOption: 0, isCorrect: true, rewardPoints: 300 },
        { questionId: "quiz-day-1-2", selectedOption: 1, correctOption: 2, isCorrect: false, rewardPoints: 300 }
      ]
    }
  ],
  axCategories,
  axSubmissions: [
    { id: "ax-sub-1", userId: "rookie-001", categoryId: "ax-ai-helpdesk", imageUrl: "/mock/ax-1.png", rewardPoints: 500, createdAt: "2026-06-04T15:10:00+09:00" },
    { id: "ax-sub-2", userId: "rookie-001", categoryId: "ax-smart-cs", imageUrl: "/mock/ax-2.png", rewardPoints: 500, createdAt: "2026-06-05T15:12:00+09:00" },
    { id: "ax-sub-3", userId: "rookie-001", categoryId: "ax-rate-simulator", imageUrl: "/mock/ax-3.png", rewardPoints: 500, createdAt: "2026-06-06T15:10:00+09:00" },
    { id: "ax-sub-4", userId: "rookie-001", categoryId: "ax-ai-helpdesk", imageUrl: "/mock/ax-4.png", rewardPoints: 500, createdAt: "2026-06-07T15:12:00+09:00" }
  ],
  badges,
  pointHistories,
  coupons,
  couponRequests: [
    {
      id: "coupon-req-1",
      userId: "rookie-003",
      couponId: "coupon-starbucks",
      requiredPoints: 5000,
      status: "requested",
      requestedAt: "2026-06-15T18:30:00+09:00"
    }
  ],
  notifications: [
    { id: "noti-1", targetRole: "admin", type: "signup_pending", title: "가입 승인 요청", message: "승인대기신입_긴이름_테스트 계정 승인이 필요합니다.", isRead: false, createdAt: "2026-06-16T09:20:00+09:00" },
    { id: "noti-2", targetRole: "admin", type: "coupon_requested", title: "쿠폰 교환 요청", message: "박수료님이 스타벅스 모바일 쿠폰을 요청했습니다.", isRead: false, createdAt: "2026-06-15T18:30:00+09:00" }
  ],
  adminAuditLogs: [
    { id: "audit-1", actorId: "admin-001", action: "approve_user", targetType: "user", targetId: "rookie-001", reason: "입사 정보 확인", createdAt: "2026-06-01T16:00:00+09:00" }
  ]
};

function createQuizzes(items: FinalCurriculum[]): FinalQuizQuestion[] {
  const counts = [2, 5, 3, 4, 2, 4, 3, 5, 2, 4, 3, 3, 2, 4, 5, 2, 3, 4, 2, 5];

  return items.flatMap((curriculum, curriculumIndex) =>
    Array.from({ length: counts[curriculumIndex] ?? 3 }, (_, questionIndex) => {
      const number = questionIndex + 1;
      const correctOption = (questionIndex + curriculumIndex) % 4;

      return {
        id: `quiz-day-${curriculum.dayNumber}-${number}`,
        curriculumId: curriculum.id,
        question: `${curriculum.title}에서 가장 먼저 확인해야 할 항목은 무엇인가요? (${number})`,
        options: ["고객 상황 확인", "임의 요금제 추천", "기록 없이 종료", "동료 계정 사용"],
        correctOption,
        explanation: "현장 온보딩에서는 먼저 고객 상황과 시스템 기록을 확인한 뒤 다음 행동을 결정합니다.",
        rewardPoints: 300
      };
    })
  );
}

function history(
  id: string,
  userId: string,
  amount: number,
  balanceAfter: number,
  type: FinalPointHistory["type"],
  reason: string,
  createdAt: string
): FinalPointHistory {
  return {
    id,
    userId,
    amount,
    balanceAfter,
    type,
    reason,
    createdAt
  };
}
