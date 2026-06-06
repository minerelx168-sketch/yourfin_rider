// Visit-status colors, shared by the map markers and status badges so they
// stay consistent (per docs/API_CONTRACT.md convention).

import type { VisitStatus, WithdrawalStatus } from '../types';

export const STATUS_COLOR: Record<VisitStatus, string> = {
  SUCCESS: '#16a34a', // green
  PENDING: '#f59e0b', // orange
  REJECTED: '#dc2626', // red
};

/** Soft background tint for badges. */
export const STATUS_BG: Record<VisitStatus, string> = {
  SUCCESS: '#dcfce7',
  PENDING: '#fef3c7',
  REJECTED: '#fee2e2',
};

/** Darker text color for badges. */
export const STATUS_TEXT: Record<VisitStatus, string> = {
  SUCCESS: '#15803d',
  PENDING: '#b45309',
  REJECTED: '#b91c1c',
};

// ---- Withdrawal statuses ----
// PENDING=orange, APPROVED=indigo/blue, PAID=green, REJECTED=red.

export const WITHDRAWAL_COLOR: Record<WithdrawalStatus, string> = {
  PENDING: '#f59e0b', // orange
  APPROVED: '#4f46e5', // indigo
  PAID: '#16a34a', // green
  REJECTED: '#dc2626', // red
};

/** Soft background tint for withdrawal badges. */
export const WITHDRAWAL_BG: Record<WithdrawalStatus, string> = {
  PENDING: '#fef3c7',
  APPROVED: '#e0e7ff',
  PAID: '#dcfce7',
  REJECTED: '#fee2e2',
};

/** Darker text color for withdrawal badges. */
export const WITHDRAWAL_TEXT: Record<WithdrawalStatus, string> = {
  PENDING: '#b45309',
  APPROVED: '#4338ca',
  PAID: '#15803d',
  REJECTED: '#b91c1c',
};

// Palette for brand charts.
export const BRAND_PALETTE: string[] = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#0891b2',
  '#65a30d',
  '#64748b',
];
