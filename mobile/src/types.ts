// TypeScript types mirroring the YourFin Rider API contract.
// See docs/API_CONTRACT.md. Keep these in sync with the backend enums.

export type Role = 'SALES' | 'MANAGER' | 'ADMIN';

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

export type CommissionType = 'DEAL' | 'REFERRAL' | 'ADJUSTMENT';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

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
  // บัญชีรับโอน
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  brand: Brand | null;
  province: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  partnerStatus: PartnerStatus;
  ownerName: string | null;
  ownerContact: string | null;
}

export interface Activity {
  id: string;
  userId: string;
  eventType: EventType;
  eventTime: string;
  workDate: string;
  lat: number;
  lng: number;
  storeId: string | null;
  storeName: string | null;
  brand: Brand | null;
  visitStatus: VisitStatus | null;
  photoUrl: string | null;
  note: string | null;
  prevLat: number | null;
  prevLng: number | null;
  legDistanceKm: number | null;
  legDurationMin: number | null;
  calcStatus: CalcStatus;
  processedAt: string | null;
  createdAt: string;
  store: Store | null;
}

export interface DaySummary {
  checkins: number;
  success: number;
  pending: number;
  rejected: number;
  conversionRate: number;
  totalDistanceKm: number;
  clockedIn: boolean;
  clockedOut: boolean;
}

export interface MyDayResponse {
  workDate: string;
  summary: DaySummary;
  activities: Activity[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

export interface CheckInInput {
  lat: number;
  lng: number;
  storeName: string;
  brand: Brand;
  visitStatus: VisitStatus;
  storeId?: string;
  photoUrl?: string;
  note?: string;
}

// ---- Wallet & Withdrawals ----

/** Wallet money balances (บาท). */
export interface Balance {
  totalEarned: number;
  totalPaid: number;
  pending: number;
  available: number;
}

/** Commission / affiliate + bank settings returned with the wallet. */
export interface WalletSettings {
  commissionPerDeal: number;
  referralPercent: number;
  referredById: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}

/** A single ledger entry crediting the rider's wallet. */
export interface CommissionEntry {
  id: string;
  userId: string;
  type: CommissionType;
  amount: number;
  /** Affiliate tier (0 = own deal, 1..5 = referral depth). */
  level: number;
  sourceActivityId: string | null;
  sourceUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface Wallet {
  balance: Balance;
  settings: WalletSettings;
  earnedFromDeals: number;
  earnedFromReferral: number;
  directReferrals: number;
  recentEntries: CommissionEntry[];
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
  /** Attached only on admin endpoints. */
  user?: { id: string; name: string; region: string | null; phone: string | null };
}

export interface WithdrawalInput {
  amount: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  note?: string;
}
