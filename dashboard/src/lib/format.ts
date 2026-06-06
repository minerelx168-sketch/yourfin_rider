// Formatting + label helpers (Thai UI).

import type {
  Brand,
  EventType,
  Role,
  VisitStatus,
  WithdrawalStatus,
} from '../types';

const TZ = 'Asia/Bangkok';

/** YYYY-MM-DD for a Date in the Asia/Bangkok calendar. */
export function toISODate(d: Date): string {
  // en-CA yields YYYY-MM-DD; force the Bangkok timezone so "today" is correct.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Today's date (Asia/Bangkok) as YYYY-MM-DD. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** N days ago from today (Asia/Bangkok) as YYYY-MM-DD. */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

/** HH:mm:ss in Asia/Bangkok. */
export function formatClock(d: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

/** Full date + time for an ISO timestamp, Thai locale, Asia/Bangkok. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** Short time-of-day HH:mm for an ISO timestamp. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** Short label "DD/MM" for axis ticks from a YYYY-MM-DD string. */
export function shortDateLabel(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('th-TH').format(n);
}

export function formatKm(n: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(n: number): string {
  return `${new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(n)}%`;
}

/** Money with thousands separators + a leading ฿ (e.g. "฿1,250"). */
export function formatBaht(n: number): string {
  return `฿${new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n ?? 0)}`;
}

// ---- Label maps (Thai) ----

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  SUCCESS: 'ปิดดีล',
  PENDING: 'รอตัดสินใจ',
  REJECTED: 'ปฏิเสธ',
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  CLOCK_IN: 'เริ่มงาน',
  CHECK_IN: 'เช็คอินร้าน',
  CLOCK_OUT: 'เลิกงาน',
};

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  PAID: 'จ่ายแล้ว',
  REJECTED: 'ปฏิเสธ',
};

export const ROLE_LABEL: Record<Role, string> = {
  SALES: 'เซลล์',
  MANAGER: 'ผู้จัดการ',
  FINANCE: 'ผู้จัดการฝ่ายการเงิน',
  ADMIN: 'ผู้ดูแลระบบ',
};

export const BRAND_LABEL: Record<Brand, string> = {
  SAMSUNG: 'Samsung',
  VIVO: 'Vivo',
  OPPO: 'OPPO',
  XIAOMI: 'Xiaomi',
  REALME: 'realme',
  APPLE: 'Apple',
  OTHER: 'อื่นๆ',
};

export function brandLabel(brand: Brand | null | undefined): string {
  if (!brand) return '-';
  return BRAND_LABEL[brand] ?? brand;
}
