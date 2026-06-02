export type ScreenKey = "home" | "profile" | "inventory" | "tree" | "sword" | "shop" | "admin";

export type AdminTabKey = "dashboard" | "employees" | "missions" | "rewards" | "economy";

export type BudgetRisk = "stable" | "watch" | "danger";

export interface CurrencySnapshot {
  id: string;
  label: string;
  icon: string;
  amount: number;
  tone: "gold" | "hidden" | "scroll" | "neutral";
}

export interface UserProfile {
  id: string;
  displayName: string;
  branchName: string;
  onboardingDay: number;
  rankLabel: string;
  titleLabel: string;
  level: number;
  levelLabel: string;
  sxp: number;
  nextLevelProgressPct: number;
  onboardingProgressPct: number;
  wallet: CurrencySnapshot[];
  profileMetrics: CurrencySnapshot[];
}

export interface AttendanceDay {
  id: string;
  label: string;
  state: "done" | "today" | "idle";
}

export interface CalendarDay {
  id: string;
  label: string;
  earnedTicket: number;
  maxTicket: number;
  state: "empty" | "full" | "mid" | "zero" | "future" | "today";
  detail?: MissionDayDetail;
}

export interface MissionDayDetail {
  title: string;
  earnedTicket: number;
  maxTicket: number;
  tasks: Array<{
    label: string;
    earnedTicket: number;
    maxTicket: number;
  }>;
}

export interface MissionTask {
  id: string;
  icon: string;
  title: string;
  completed: boolean;
  rewardTicket: number;
  sortOrder: number;
  sourceLabel?: string;
}

export interface MissionGroup {
  id: string;
  icon: string;
  title: string;
  completedCount: number;
  totalCount: number;
  statusLabel: string;
  expanded: boolean;
  tasks: MissionTask[];
}

export interface ActivityRecord {
  id: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
}

export interface InventoryItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  hidden?: boolean;
}

export interface TreeRewardRule {
  coinMin: number;
  coinMax: number;
  hiddenDropChancePct: number;
  scrollDropChancePct: number;
}

export interface TreeStateConfig {
  remainingTicket: number;
  totalCoin: number;
  hiddenCoin: number;
  scroll: number;
  todayCoin: number;
  todayHiddenCoin: number;
  todayScroll: number;
  lastRewardLabel: string;
  swordLevelLabel: string;
  hiddenChancePct: number;
  rewardRule: TreeRewardRule;
}

export interface SwordLevelPreview {
  level: number;
  label: string;
  name: string;
  coinCap: number;
  hiddenChancePct: number;
  extraCoinHit: number;
}

export interface SwordUpgradeConfig {
  current: SwordLevelPreview;
  next: SwordLevelPreview;
  maxLevel: number;
  requiredCoin: number;
  requiredScroll: number;
  requiredSxp: number;
  successRatePct: number;
  noFailLabel: string;
}

export interface RewardProduct {
  id: string;
  icon: string;
  title: string;
  cost: number;
  currencyId: "coin" | "hidden_coin";
  sortOrder: number;
  stock?: number;
  actionLabel: string;
  featured?: boolean;
}

export interface HiddenRewardCandidate {
  id: string;
  icon: string;
  title: string;
  rarity: string;
  probabilityWeight: number;
}

export interface ShopConfig {
  headline: string;
  description: string;
  featuredRewardId: string;
  rewards: RewardProduct[];
  hiddenBox: {
    title: string;
    description: string;
    costHiddenCoin: number;
    candidates: HiddenRewardCandidate[];
  };
}

export interface AdminKpi {
  id: string;
  label: string;
  value: string;
  description: string;
  tone?: "warn" | "good";
}

export interface AdminEmployee {
  id: string;
  name: string;
  branchName: string;
  onboardingDay: number;
  swordLevel: number;
  statusLabel: string;
  statusTone: "good" | "warn";
  metrics: Array<{
    label: string;
    value: string;
    tone: "done" | "warn";
  }>;
  footnote: string;
}

export interface AdminActionRow {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  tone?: "primary" | "sub";
}

export interface EconomySetting {
  id: string;
  title: string;
  value: number;
  min: number;
  max: number;
  unit: "krw" | "number" | "pct";
  tone: "blue" | "purple";
}

export interface EconomyResult {
  id: string;
  label: string;
  description: string;
  value: string;
}

export interface EconomySnapshot {
  activeEmployeeCount: number;
  participationRatePct: number;
  estimatedMonthlyHits: number;
  estimatedMonthlyPayoutKrw: number;
  budgetRisk: BudgetRisk;
  settings: EconomySetting[];
  results: EconomyResult[];
}

export interface AdminConfig {
  kpis: AdminKpi[];
  employees: AdminEmployee[];
  actionRows: AdminActionRow[];
  economy: EconomySnapshot;
}

export interface UQuestAppConfig {
  source: "supabase" | "fallback";
  user: UserProfile;
  attendanceWeek: AttendanceDay[];
  calendarMonthLabel: string;
  calendarDays: CalendarDay[];
  missionGroups: MissionGroup[];
  activities: ActivityRecord[];
  inventory: InventoryItem[];
  tree: TreeStateConfig;
  sword: SwordUpgradeConfig;
  shop: ShopConfig;
  admin: AdminConfig;
}
