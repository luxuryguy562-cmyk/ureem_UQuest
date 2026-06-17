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

export type FinalRole = "rookie" | "manager" | "admin";
export type FinalUserStatus = "pending" | "active" | "rejected" | "completed" | "inactive";
export type FinalScreenKey = "home" | "learn" | "quiz" | "ax" | "badges" | "profile" | "shop" | "points" | "manager" | "admin";
export type QuizTier = "Unranked" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
export type AxLevel = "Explorer" | "User" | "Expert" | "Master";
export type BadgeCategory = "attendance" | "quiz" | "tier" | "rare";
export type CouponRequestStatus = "requested" | "canceled" | "sent";

export interface FinalStore {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface FinalUser {
  id: string;
  role: FinalRole;
  name: string;
  avatarGender?: "male" | "female";
  phone: string;
  loginId: string;
  passwordHash?: string;
  storeId: string | null;
  hireDate: string | null;
  status: FinalUserStatus;
  rejectReason?: string;
  approvedAt?: string;
  completedAt?: string;
  inactiveAt?: string;
  exp: number;
  badgeIds: string[];
}

export interface FinalCurriculum {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  learningRewardPoints: number;
  isPublished: boolean;
}

export interface FinalQuizQuestion {
  id: string;
  curriculumId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  rewardPoints: number;
}

export interface FinalAttendance {
  id: string;
  userId: string;
  attendanceDate: string;
  rewardPoints: number;
}

export interface FinalLearningCompletion {
  id: string;
  userId: string;
  curriculumId: string;
  rewardPoints: number;
  createdAt: string;
}

export interface FinalQuizAnswer {
  questionId: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  rewardPoints: number;
}

export interface FinalQuizSubmission {
  id: string;
  userId: string;
  curriculumId: string;
  totalCount: number;
  correctCount: number;
  earnedPoints: number;
  answers: FinalQuizAnswer[];
  submittedAt: string;
}

export interface FinalAxCategory {
  id: string;
  code: string;
  type: "AX" | "DX";
  title: string;
  description: string;
  rewardPoints: number;
  isPublished: boolean;
  sortOrder: number;
}

export interface FinalAxSubmission {
  id: string;
  userId: string;
  categoryId: string;
  imageUrl: string;
  rewardPoints: number;
  createdAt: string;
}

export interface FinalBadge {
  id: string;
  category: BadgeCategory;
  name: string;
  description: string;
  conditionLabel: string;
  rewardPoints: number;
  imageKey: string;
  isRare: boolean;
  isHidden: boolean;
  sortOrder: number;
}

export interface FinalPointHistory {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: "attendance" | "learning" | "quiz" | "ax" | "badge" | "coupon_request" | "coupon_cancel" | "manual_add" | "manual_subtract" | "expire" | "inactive_forfeit";
  reason: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
  createdAt: string;
}

export interface FinalCoupon {
  id: string;
  name: string;
  description: string;
  actualPrice: number;
  requiredPoints: number;
  stockQuantity: number | null;
  isPublished: boolean;
}

export interface FinalCouponRequest {
  id: string;
  userId: string;
  couponId: string;
  requiredPoints: number;
  status: CouponRequestStatus;
  requestedAt: string;
  canceledAt?: string;
  sentAt?: string;
  expiresAt?: string;
  processedBy?: string;
  cancelReason?: string;
}

export interface FinalNotification {
  id: string;
  targetRole: FinalRole;
  targetUserId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface FinalAdminAuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface FinalUQuestConfig {
  source: "supabase" | "fallback";
  today: string;
  activeUserId: string;
  managerUserId: string;
  adminUserId: string;
  stores: FinalStore[];
  users: FinalUser[];
  curriculums: FinalCurriculum[];
  quizzes: FinalQuizQuestion[];
  attendances: FinalAttendance[];
  learningCompletions: FinalLearningCompletion[];
  quizSubmissions: FinalQuizSubmission[];
  axCategories: FinalAxCategory[];
  axSubmissions: FinalAxSubmission[];
  badges: FinalBadge[];
  pointHistories: FinalPointHistory[];
  coupons: FinalCoupon[];
  couponRequests: FinalCouponRequest[];
  notifications: FinalNotification[];
  adminAuditLogs: FinalAdminAuditLog[];
}
