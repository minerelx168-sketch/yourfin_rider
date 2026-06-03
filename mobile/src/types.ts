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
