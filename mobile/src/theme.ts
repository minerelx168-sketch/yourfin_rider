import type { VisitStatus } from './types';

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
