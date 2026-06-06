import type { Prisma, WithdrawalStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/error';
import { getBalance } from './commission.service';
import { startOfMonthBangkok, startOfTodayBangkok } from '../utils/date';

export interface CreateWithdrawalInput {
  amount: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  note?: string;
}

/** ไรเดอร์ยื่นคำขอถอน — ตรวจยอดคงเหลือก่อน แล้ว snapshot บัญชีรับเงิน */
export async function createWithdrawal(userId: string, input: CreateWithdrawalInput) {
  if (input.amount <= 0) throw new ApiError(400, 'จำนวนเงินต้องมากกว่า 0');

  const balance = await getBalance(userId);
  if (input.amount > balance.available) {
    throw new ApiError(400, `ยอดคงเหลือไม่พอ (ถอนได้สูงสุด ${balance.available} บาท)`, {
      available: balance.available,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bankName: true, bankAccountNumber: true, bankAccountName: true },
  });

  return prisma.withdrawal.create({
    data: {
      userId,
      amount: input.amount,
      status: 'PENDING',
      bankName: input.bankName ?? user?.bankName ?? null,
      bankAccountNumber: input.bankAccountNumber ?? user?.bankAccountNumber ?? null,
      bankAccountName: input.bankAccountName ?? user?.bankAccountName ?? null,
      note: input.note ?? null,
    },
  });
}

export async function getMyWithdrawals(userId: string) {
  return prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
  });
}

/** รายการคำขอถอนสำหรับแอดมิน (กรองตามสถานะ/ช่วงเวลาได้) */
export async function listWithdrawals(filter: { status?: WithdrawalStatus; from?: Date; to?: Date }) {
  const where: Prisma.WithdrawalWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.from || filter.to) {
    where.requestedAt = {};
    if (filter.from) where.requestedAt.gte = filter.from;
    if (filter.to) where.requestedAt.lte = filter.to;
  }
  return prisma.withdrawal.findMany({
    where,
    orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true, region: true, phone: true } },
    },
  });
}

/** สรุปยอดคำขอถอนตามสถานะ (สำหรับ scorecard ฝั่งแอดมิน) */
export async function withdrawalSummary() {
  const groups = await prisma.withdrawal.groupBy({
    by: ['status'],
    _sum: { amount: true },
    _count: { _all: true },
  });
  const get = (s: WithdrawalStatus) => groups.find((g) => g.status === s);
  return {
    pending: { count: get('PENDING')?._count._all ?? 0, amount: get('PENDING')?._sum.amount ?? 0 },
    approved: {
      count: get('APPROVED')?._count._all ?? 0,
      amount: get('APPROVED')?._sum.amount ?? 0,
    },
    paid: { count: get('PAID')?._count._all ?? 0, amount: get('PAID')?._sum.amount ?? 0 },
    rejected: {
      count: get('REJECTED')?._count._all ?? 0,
      amount: get('REJECTED')?._sum.amount ?? 0,
    },
  };
}

/** สรุปสำหรับหน้า "ภาพรวมการเงิน" ของผู้จัดการฝ่ายการเงิน */
export async function financeSummary() {
  const todayStart = startOfTodayBangkok();
  const monthStart = startOfMonthBangkok();

  const [byStatus, paidToday, paidMonth, recentPayouts] = await Promise.all([
    prisma.withdrawal.groupBy({ by: ['status'], _sum: { amount: true }, _count: { _all: true } }),
    prisma.withdrawal.aggregate({
      where: { status: 'PAID', processedAt: { gte: todayStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.withdrawal.aggregate({
      where: { status: 'PAID', processedAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.withdrawal.findMany({
      where: { status: 'PAID' },
      orderBy: { processedAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true, region: true } } },
    }),
  ]);

  const get = (s: WithdrawalStatus) => byStatus.find((g) => g.status === s);
  const box = (s: WithdrawalStatus) => ({
    count: get(s)?._count._all ?? 0,
    amount: get(s)?._sum.amount ?? 0,
  });

  return {
    pending: box('PENDING'),
    approved: box('APPROVED'),
    paid: box('PAID'),
    rejected: box('REJECTED'),
    paidToday: { count: paidToday._count._all, amount: paidToday._sum.amount ?? 0 },
    paidThisMonth: { count: paidMonth._count._all, amount: paidMonth._sum.amount ?? 0 },
    recentPayouts: recentPayouts.map((w) => ({
      id: w.id,
      riderName: w.user.name,
      region: w.user.region,
      amount: w.amount,
      bankName: w.bankName,
      slipUrl: w.slipUrl,
      processedAt: w.processedAt,
    })),
  };
}

type Action = 'APPROVE' | 'REJECT' | 'PAY';

// การเปลี่ยนสถานะที่อนุญาต
const ALLOWED: Record<Action, WithdrawalStatus[]> = {
  APPROVE: ['PENDING'],
  REJECT: ['PENDING', 'APPROVED'],
  PAY: ['PENDING', 'APPROVED'],
};
const NEXT: Record<Action, WithdrawalStatus> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  PAY: 'PAID',
};

/** แอดมินดำเนินการคำขอถอน (อนุมัติ/ปฏิเสธ/จ่าย+แนบสลิป) */
export async function processWithdrawal(
  id: string,
  adminId: string,
  action: Action,
  payload: { slipUrl?: string; adminNote?: string },
) {
  const wd = await prisma.withdrawal.findUnique({ where: { id } });
  if (!wd) throw new ApiError(404, 'ไม่พบคำขอถอน');

  if (!ALLOWED[action].includes(wd.status)) {
    throw new ApiError(409, `ไม่สามารถ ${action} คำขอที่สถานะ ${wd.status} ได้`);
  }
  if (action === 'PAY' && !payload.slipUrl) {
    throw new ApiError(400, 'ต้องแนบสลิปการโอน (slipUrl) ก่อนทำรายการจ่าย');
  }

  return prisma.withdrawal.update({
    where: { id },
    data: {
      status: NEXT[action],
      processedById: adminId,
      processedAt: new Date(),
      slipUrl: action === 'PAY' ? payload.slipUrl : wd.slipUrl,
      adminNote: payload.adminNote ?? wd.adminNote,
    },
    include: { user: { select: { id: true, name: true } } },
  });
}
