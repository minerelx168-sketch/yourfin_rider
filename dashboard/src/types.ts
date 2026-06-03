// Types mirroring the YourFin Rider API contract (docs/API_CONTRACT.md)

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
  createdAt: string;
  updatedAt?: string;
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
