import type { UQuestAppConfig } from "@/types/uquest";

// Fallback seed mirrors the HTML mockup. In production these values are loaded
// from Supabase tables/views controlled by the Admin screens.
export const fallbackAppConfig: UQuestAppConfig = {
  source: "fallback",
  user: {
    id: "kim-eunseong-demo",
    displayName: "김은성",
    branchName: "강남점",
    onboardingDay: 1,
    rankLabel: "첫 출근",
    titleLabel: "새싹 신입",
    level: 1,
    levelLabel: "Lv.1",
    sxp: 0,
    nextLevelProgressPct: 0,
    onboardingProgressPct: 0,
    wallet: [
      { id: "coin", label: "골드", icon: "🪙", amount: 0, tone: "gold" },
      { id: "hidden_coin", label: "히든", icon: "💎", amount: 0, tone: "hidden" },
      { id: "scroll", label: "주문서", icon: "📜", amount: 0, tone: "scroll" }
    ],
    profileMetrics: [
      { id: "monthly_coin", label: "이번달", icon: "🪙", amount: 0, tone: "gold" },
      { id: "total_hits", label: "누적 타격", icon: "🔥", amount: 0, tone: "hidden" },
      { id: "completed_mission", label: "완료 미션", icon: "🎯", amount: 0, tone: "scroll" }
    ]
  },
  attendanceWeek: [
    { id: "mon", label: "월", state: "today" },
    { id: "tue", label: "화", state: "idle" },
    { id: "wed", label: "수", state: "idle" },
    { id: "thu", label: "목", state: "idle" },
    { id: "fri", label: "금", state: "idle" },
    { id: "sat", label: "토", state: "idle" },
    { id: "sun", label: "일", state: "idle" }
  ],
  calendarMonthLabel: "2026년 5월",
  calendarDays: [
    { id: "blank-1", label: "", earnedTicket: 0, maxTicket: 0, state: "empty" },
    { id: "blank-2", label: "", earnedTicket: 0, maxTicket: 0, state: "empty" },
    { id: "blank-3", label: "", earnedTicket: 0, maxTicket: 0, state: "empty" },
    { id: "blank-4", label: "", earnedTicket: 0, maxTicket: 0, state: "empty" },
    {
      id: "today",
      label: "오늘",
      earnedTicket: 0,
      maxTicket: 30,
      state: "today",
      detail: {
        title: "첫 출근 상세",
        earnedTicket: 0,
        maxTicket: 30,
        tasks: [
          { label: "첫 출근 체크인", earnedTicket: 0, maxTicket: 10 },
          { label: "매장 둘러보기", earnedTicket: 0, maxTicket: 10 },
          { label: "온보딩 퀴즈", earnedTicket: 0, maxTicket: 10 }
        ]
      }
    },
    { id: "day-2", label: "2", earnedTicket: 0, maxTicket: 30, state: "future" },
    { id: "day-3", label: "3", earnedTicket: 0, maxTicket: 30, state: "future" },
    { id: "day-4", label: "4", earnedTicket: 0, maxTicket: 30, state: "future" },
    { id: "day-5", label: "5", earnedTicket: 0, maxTicket: 30, state: "future" },
    { id: "day-6", label: "6", earnedTicket: 0, maxTicket: 30, state: "future" },
    { id: "day-7", label: "7", earnedTicket: 0, maxTicket: 30, state: "future" }
  ],
  missionGroups: [
    {
      id: "daily-routine",
      icon: "✅",
      title: "일일 루틴",
      completedCount: 0,
      totalCount: 3,
      statusLabel: "0 / 3 ▲",
      expanded: true,
      tasks: [
        { id: "first-checkin", icon: "👋", title: "첫 출근 체크인", completed: false, rewardTicket: 10, sortOrder: 1 },
        { id: "store-tour", icon: "🏬", title: "매장 둘러보기", completed: false, rewardTicket: 10, sortOrder: 2 },
        { id: "mentor-greeting", icon: "🤝", title: "멘토에게 인사하기", completed: false, rewardTicket: 10, sortOrder: 3 }
      ]
    },
    {
      id: "axdx",
      icon: "⚡",
      title: "AX/DX 미션",
      completedCount: 0,
      totalCount: 2,
      statusLabel: "0 / 2 ▲",
      expanded: true,
      tasks: [
        { id: "ai-helpdesk", icon: "🤖", title: "AI 헬프데스크 실행", completed: false, rewardTicket: 80, sortOrder: 1, sourceLabel: "자수 연동" },
        { id: "ucrm", icon: "📊", title: "UCRM 실행", completed: false, rewardTicket: 80, sortOrder: 2, sourceLabel: "자수 연동" }
      ]
    },
    {
      id: "quiz",
      icon: "🧠",
      title: "일일 퀴즈",
      completedCount: 0,
      totalCount: 1,
      statusLabel: "0 / 1 ▲",
      expanded: true,
      tasks: [
        { id: "daily-quiz", icon: "❓", title: "오늘의 유림 퀴즈", completed: false, rewardTicket: 50, sortOrder: 1 }
      ]
    }
  ],
  activities: [
    { id: "welcome", icon: "👋", title: "온보딩 시작", description: "김은성님의 첫 출근이 시작됐어요.", actionLabel: "보기" }
  ],
  inventory: [],
  tree: {
    remainingTicket: 0,
    totalCoin: 0,
    hiddenCoin: 0,
    scroll: 0,
    todayCoin: 0,
    todayHiddenCoin: 0,
    todayScroll: 0,
    lastRewardLabel: "아직 타격 전",
    swordLevelLabel: "Lv.1 검",
    hiddenChancePct: 0.8,
    rewardRule: {
      coinMin: 4,
      coinMax: 10,
      hiddenDropChancePct: 0.8,
      scrollDropChancePct: 0
    }
  },
  sword: {
    current: { level: 1, label: "Lv.1", name: "나무검", coinCap: 10, hiddenChancePct: 0.8, extraCoinHit: 0 },
    next: { level: 2, label: "Lv.2", name: "수습검", coinCap: 10, hiddenChancePct: 0.8, extraCoinHit: 0 },
    maxLevel: 10,
    requiredCoin: 50,
    requiredScroll: 0,
    requiredSxp: 20,
    successRatePct: 100,
    noFailLabel: "실패 없음"
  },
  shop: {
    headline: "U-STORE",
    description: "오늘의 특별 보상을 교환해보세요. 모은 코인으로 실제 보상을 획득할 수 있어요.",
    featuredRewardId: "starbucks-set",
    rewards: [
      { id: "starbucks-set", icon: "☕", title: "스타벅스 세트", cost: 5000, currencyId: "coin", sortOrder: 1, actionLabel: "교환", featured: true },
      { id: "burger-set", icon: "🍔", title: "버거 세트", cost: 8000, currencyId: "coin", sortOrder: 2, actionLabel: "교환하기" },
      { id: "convenience", icon: "🏪", title: "편의점 쿠폰", cost: 5000, currencyId: "coin", sortOrder: 3, actionLabel: "교환하기" },
      { id: "chicken", icon: "🍗", title: "치킨 기프티콘", cost: 18000, currencyId: "coin", sortOrder: 4, actionLabel: "교환하기" },
      { id: "raffle", icon: "🎟️", title: "응모권", cost: 2000, currencyId: "coin", sortOrder: 5, actionLabel: "교환하기" }
    ],
    hiddenBox: {
      title: "??? 히든 보상",
      description: "희귀 보상 · 특별 응모권 · 조기퇴근권 등 랜덤 보상을 획득할 수 있어요.",
      costHiddenCoin: 2,
      candidates: [
        { id: "hidden-coffee", icon: "☕", title: "스타벅스 쿠폰", rarity: "COMMON", probabilityWeight: 60 },
        { id: "hidden-store", icon: "🏪", title: "편의점 5천원권", rarity: "RARE", probabilityWeight: 28 },
        { id: "hidden-ticket", icon: "🎟️", title: "특별 응모권", rarity: "EPIC", probabilityWeight: 10 },
        { id: "early-leave", icon: "🌈", title: "조기퇴근권", rarity: "LEGENDARY", probabilityWeight: 2 }
      ]
    }
  },
  admin: {
    kpis: [
      { id: "attendance", label: "오늘 출석률", value: "0%", description: "샘플 데이터" },
      { id: "monthly-payout", label: "이번달 지급액", value: "₩0", description: "실지급 없음" },
      { id: "risk-users", label: "관리 필요", value: "1명", description: "첫날 온보딩", tone: "warn" },
      { id: "avg-sword", label: "평균 검 Lv", value: "1.0", description: "신입 기본" }
    ],
    employees: [
      {
        id: "kim-eunseong-demo",
        name: "김은성",
        branchName: "강남점",
        onboardingDay: 1,
        swordLevel: 1,
        statusLabel: "첫 출근",
        statusTone: "warn",
        metrics: [
          { label: "출석", value: "대기", tone: "warn" },
          { label: "루틴", value: "0/3", tone: "warn" },
          { label: "AXDX", value: "0/2", tone: "warn" },
          { label: "퀴즈", value: "대기", tone: "warn" }
        ],
        footnote: "보유 코인 0 · 타격권 0"
      }
    ],
    actionRows: [
      { id: "approval", title: "김은성 가입 승인", description: "첫 출근 신입 계정 확인", actionLabel: "열기", tone: "primary" },
      { id: "permissions", title: "점장 권한 관리", description: "강남점 접근 권한 설정", actionLabel: "열기", tone: "sub" }
    ],
    economy: {
      activeEmployeeCount: 1,
      participationRatePct: 0,
      estimatedMonthlyHits: 0,
      estimatedMonthlyPayoutKrw: 0,
      budgetRisk: "stable",
      settings: [
        { id: "monthly-base", title: "1인 월 기본 보상 한도", value: 50000, min: 10000, max: 150000, unit: "krw", tone: "blue" },
        { id: "monthly-max", title: "특별 포함 최대 한도", value: 100000, min: 30000, max: 300000, unit: "krw", tone: "purple" }
      ],
      results: [
        { id: "coin-value", label: "코인 기준", description: "MVP 정산 기준", value: "1코인 = 1원" },
        { id: "daily-ticket-cap", label: "오늘 최대 타격권", description: "출석+루틴+AX/DX+퀴즈 전체 완료", value: "250타" },
        { id: "lv1-hit-coin", label: "Lv.1 1타격 코인", description: "나무검 기준", value: "4~10 / 평균 7" },
        { id: "avg-coin", label: "1타 평균 코인", description: "아직 실제 타격 없음", value: "계산 대기" },
        { id: "coin-cap", label: "1타 최대 코인", description: "검 레벨과 무관", value: "10" },
        { id: "hidden-base", label: "히든 기본 확률", description: "샘플 기준", value: "0.8%" },
        { id: "sword-factor", label: "검 경제 영향", description: "MVP 기준", value: "없음" },
        { id: "event-factor", label: "이벤트 허용 배율", description: "이벤트 없음", value: "x1.0" }
      ]
    }
  }
};
