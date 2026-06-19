export type FinalRole = "rookie" | "manager" | "admin";
export type FinalUserStatus = "pending" | "active" | "rejected" | "completed" | "inactive";
export type FinalScreenKey = "home" | "learn" | "study" | "quiz" | "ax" | "badges" | "profile" | "shop" | "points" | "attendance" | "manager" | "admin";
export type QuizTier = "Unranked" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
export type AxLevel = "Explorer" | "User" | "Expert" | "Master";
export type BadgeCategory = "attendance" | "quiz" | "tier" | "ax" | "rare";
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
  exampleImageUrl?: string;
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

export interface FinalRewardConfig {
  attendancePoints: number;
  learningPoints: number;
  quizCorrectPoints: number;
  quizWrongPoints: number;
  axPoints: number;
}

export interface FinalUQuestConfig {
  source: "supabase" | "fallback";
  today: string;
  activeUserId: string;
  managerUserId: string;
  adminUserId: string;
  rewardConfig?: FinalRewardConfig;
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
