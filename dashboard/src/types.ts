// Types mirroring the YourFin Rider API contract (docs/API_CONTRACT.md)

export type Role = 'SALES' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export type EventType = 'CLOCK_IN' | 'CHECK_IN' | 'CLOCK_OUT';

export type Brand =
  | 'SAMSUNG'
  | 'VIVO'
  | 'OPPO'
  | 'XIAOMI'
  | 'REALME'
  | 'APPLE'
  | 'OTHER';

export type VisitStatus = 'SUCCESS' | 'PENDING' | 'REJECTED';

export type PartnerStatus = 'PROSPECT' | 'ACTIVE' | 'CLOSED';

export type CalcStatus = 'PENDING' | 'DONE' | 'SKIP' | 'ERROR';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  team: string | null;
  region: string | null;
  role: Role;
  active: boolean;
  targetDailyClose: number;
  photoUrl: string | null;
  // คอมมิชชั่น & affiliate
  commissionPerDeal: number;
  referralPercent: number;
  referredById: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UsersResponse {
  users: User[];
}

/** Payload for PATCH /users/:id — all fields optional. */
export interface UserUpdate {
  name?: string;
  phone?: string | null;
  team?: string | null;
  region?: string | null;
  role?: Role;
  active?: boolean;
  targetDailyClose?: number;
  commissionPerDeal?: number;
  referralPercent?: number;
  referredById?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

export interface UserResponse {
  user: User;
}

// ---- Commission & withdrawals ----

export type CommissionType = 'DEAL' | 'REFERRAL' | 'ADJUSTMENT';

export interface CommissionEntry {
  id: string;
  userId: string;
  type: CommissionType;
  amount: number;
  level: number;
  sourceActivityId: string | null;
  sourceUserId: string | null;
  note: string | null;
  createdAt: string;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

/** Minimal user info attached to admin withdrawal rows. */
export interface WithdrawalUser {
  id: string;
  name: string;
  region: string | null;
  phone: string | null;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  note: string | null;
  slipUrl: string | null;
  adminNote: string | null;
  processedById: string | null;
  requestedAt: string;
  processedAt: string | null;
  user?: WithdrawalUser;
}

/** A { count, amount } bucket in the withdrawals summary. */
export interface WithdrawalSummaryBucket {
  count: number;
  amount: number;
}

export interface WithdrawalSummary {
  pending: WithdrawalSummaryBucket;
  approved: WithdrawalSummaryBucket;
  paid: WithdrawalSummaryBucket;
  rejected: WithdrawalSummaryBucket;
}

export interface AdminWithdrawalsResponse {
  withdrawals: Withdrawal[];
  summary: WithdrawalSummary;
}

export interface WithdrawalResponse {
  withdrawal: Withdrawal;
}

// ---- Finance summary (GET /admin/finance/summary) ----

/** One recently-paid withdrawal shown on the finance overview. */
export interface FinancePayout {
  id: string;
  riderName: string;
  region: string | null;
  amount: number;
  bankName: string | null;
  slipUrl: string | null;
  processedAt: string;
}

export interface FinanceSummary {
  pending: WithdrawalSummaryBucket;
  approved: WithdrawalSummaryBucket;
  paid: WithdrawalSummaryBucket;
  rejected: WithdrawalSummaryBucket;
  paidToday: WithdrawalSummaryBucket;
  paidThisMonth: WithdrawalSummaryBucket;
  recentPayouts: FinancePayout[];
}

/** Action sent to PATCH /admin/withdrawals/:id. */
export type WithdrawalAction = 'APPROVE' | 'REJECT' | 'PAY';

export interface ProcessWithdrawalBody {
  action: WithdrawalAction;
  slipUrl?: string;
  adminNote?: string;
}

/** Response from POST /uploads. */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

/** A from/to date range. Dates are YYYY-MM-DD. */
export interface DateRange {
  from: string;
  to: string;
}

export interface BrandBreakdownItem {
  brand: Brand;
  count: number;
}

export interface Overview {
  range: DateRange;
  totalCheckins: number;
  success: number;
  pending: number;
  rejected: number;
  conversionRate: number;
  totalDistanceKm: number;
  activeRiders: number;
  storesVisited: number;
  brandBreakdown: BrandBreakdownItem[];
}

export interface LeaderboardRow {
  userId: string;
  name: string;
  region: string | null;
  team: string | null;
  targetDailyClose: number;
  checkins: number;
  success: number;
  pending: number;
  rejected: number;
  conversionRate: number;
  distanceKm: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardRow[];
}

export interface TimeseriesPoint {
  date: string;
  checkins: number;
  success: number;
  distanceKm: number;
}

export interface TimeseriesResponse {
  series: TimeseriesPoint[];
}

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  storeName: string | null;
  brand: Brand | null;
  visitStatus: VisitStatus | null;
  eventTime: string;
  riderName: string;
}

export interface MapResponse {
  points: MapPoint[];
}

export interface FeedItem {
  id: string;
  riderName: string;
  eventType: EventType;
  storeName: string | null;
  brand: Brand | null;
  visitStatus: VisitStatus | null;
  legDistanceKm: number | null;
  lat: number;
  lng: number;
  eventTime: string;
}

export interface FeedResponse {
  feed: FeedItem[];
}
