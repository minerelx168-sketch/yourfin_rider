import type { CommissionType, VisitStatus, WithdrawalStatus } from './types';

/** Shared color theme. Primary = indigo. */
export const colors = {
  primary: '#4f46e5', // indigo-600
  primaryDark: '#4338ca',
  primaryLight: '#eef2ff',
  background: '#f5f6fa',
  surface: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  success: '#16a34a', // green
  pending: '#f59e0b', // orange
  rejected: '#dc2626', // red
  indigo: '#4f46e5', // approved (alias of primary)
  danger: '#dc2626',
  white: '#ffffff',
};

/** Map a visit status to its badge / marker color (matches the contract). */
export function statusColor(status: VisitStatus | null | undefined): string {
  switch (status) {
    case 'SUCCESS':
      return colors.success;
    case 'PENDING':
      return colors.pending;
    case 'REJECTED':
      return colors.rejected;
    default:
      return colors.textMuted;
  }
}

/** Thai label for a visit status. */
export function visitStatusLabel(status: VisitStatus | null | undefined): string {
  switch (status) {
    case 'SUCCESS':
      return 'ปิดดีล';
    case 'PENDING':
      return 'รอตัดสินใจ';
    case 'REJECTED':
      return 'ปฏิเสธ';
    default:
      return '-';
  }
}

/** Thai label for an event type. */
export function eventTypeLabel(eventType: string): string {
  switch (eventType) {
    case 'CLOCK_IN':
      return 'เริ่มงาน';
    case 'CLOCK_OUT':
      return 'เลิกงาน';
    case 'CHECK_IN':
      return 'เช็คอินร้าน';
    default:
      return eventType;
  }
}

/** Format an ISO timestamp to HH:mm in Asia/Bangkok. */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    });
  } catch {
    return iso;
  }
}

/** Format an ISO timestamp to "DD/MM/YYYY HH:mm" in Asia/Bangkok. */
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    });
  } catch {
    return iso;
  }
}

/**
 * Format a number as Thai Baht with thousands separators, e.g. `฿7,028.40`.
 * Fractional digits are shown only when the amount isn't whole.
 */
export function formatBaht(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const hasFraction = Math.round(safe * 100) % 100 !== 0;
  const formatted = safe.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `฿${formatted}`;
}

/** Badge / accent color for a withdrawal status (matches the contract). */
export function withdrawalStatusColor(status: WithdrawalStatus): string {
  switch (status) {
    case 'PENDING':
      return colors.pending; // orange
    case 'APPROVED':
      return colors.indigo; // indigo
    case 'PAID':
      return colors.success; // green
    case 'REJECTED':
      return colors.rejected; // red
    default:
      return colors.textMuted;
  }
}

/** Thai label for a withdrawal status. */
export function withdrawalStatusLabel(status: WithdrawalStatus): string {
  switch (status) {
    case 'PENDING':
      return 'รออนุมัติ';
    case 'APPROVED':
      return 'อนุมัติแล้ว';
    case 'PAID':
      return 'จ่ายแล้ว';
    case 'REJECTED':
      return 'ปฏิเสธ';
    default:
      return status;
  }
}

/** Thai label for a commission ledger entry, including referral tier. */
export function commissionTypeLabel(type: CommissionType, level?: number): string {
  switch (type) {
    case 'DEAL':
      return 'คอมปิดดีล';
    case 'REFERRAL':
      return level && level > 0 ? `ค่าแนะนำ ชั้น ${level}` : 'ค่าแนะนำ';
    case 'ADJUSTMENT':
      return 'ปรับยอด';
    default:
      return type;
  }
}
