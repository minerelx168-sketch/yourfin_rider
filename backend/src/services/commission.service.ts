import { prisma } from '../lib/prisma';

/** จำนวนชั้นสูงสุดของสายแนะนำ (affiliate) ที่จ่ายค่าแนะนำขึ้นไป */
export const MAX_REFERRAL_DEPTH = 5;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

interface ChainNode {
  id: string;
  referredById: string | null;
  referralPercent: number;
}

/**
 * คิดคอมมิชชั่นเมื่อไรเดอร์ปิดดีล 1 รายการ (CHECK_IN + visitStatus=SUCCESS)
 * - ไรเดอร์เจ้าของดีลได้คอมฐานคงที่ = commissionPerDeal
 * - ไล่สายแนะนำขึ้นไปสูงสุด MAX_REFERRAL_DEPTH ชั้น:
 *   ผู้แนะนำของโหนดล่างได้ = (คอมฐาน) × (referralPercent ของโหนดล่าง) %
 *   (มีตัวกันลูป/กันสายวน)
 * idempotent: ถ้ามี entry ของ activity นี้แล้ว จะไม่คิดซ้ำ
 */
export async function accrueDealCommission(activityId: string, riderId: string): Promise<void> {
  const existing = await prisma.commissionEntry.findFirst({
    where: { sourceActivityId: activityId },
    select: { id: true },
  });
  if (existing) return; // คิดไปแล้ว

  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    select: { id: true, commissionPerDeal: true, referredById: true, referralPercent: true },
  });
  if (!rider) return;

  const base = rider.commissionPerDeal ?? 0;
  const entries: {
    userId: string;
    type: 'DEAL' | 'REFERRAL';
    amount: number;
    level: number;
    sourceActivityId: string;
    sourceUserId: string;
    note?: string;
  }[] = [];

  if (base > 0) {
    entries.push({
      userId: rider.id,
      type: 'DEAL',
      amount: base,
      level: 0,
      sourceActivityId: activityId,
      sourceUserId: rider.id,
    });
  }

  // ไล่สายแนะนำขึ้นไป
  let current: ChainNode = rider;
  const seen = new Set<string>([rider.id]);
  for (let level = 1; level <= MAX_REFERRAL_DEPTH && current.referredById; level++) {
    const referrer: ChainNode | null = await prisma.user.findUnique({
      where: { id: current.referredById },
      select: { id: true, referredById: true, referralPercent: true },
    });
    if (!referrer || seen.has(referrer.id)) break; // กันสายวน
    seen.add(referrer.id);

    const pct = current.referralPercent ?? 0;
    const amount = round2((base * pct) / 100);
    if (amount > 0 && base > 0) {
      entries.push({
        userId: referrer.id,
        type: 'REFERRAL',
        amount,
        level,
        sourceActivityId: activityId,
        sourceUserId: rider.id,
        note: `ค่าแนะนำชั้น ${level}`,
      });
    }
    current = referrer;
  }

  if (entries.length > 0) {
    await prisma.commissionEntry.createMany({ data: entries });
  }
}

export interface Balance {
  totalEarned: number;
  totalPaid: number;
  pending: number; // ถูกจองโดยคำขอที่ยัง PENDING/APPROVED
  available: number;
}

/** ยอดคงเหลือของไรเดอร์ (ใช้ตรวจสอบก่อนถอน) */
export async function getBalance(userId: string): Promise<Balance> {
  const [earned, paid, held] = await Promise.all([
    prisma.commissionEntry.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { userId, status: 'PAID' }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
      _sum: { amount: true },
    }),
  ]);
  const totalEarned = round2(earned._sum.amount ?? 0);
  const totalPaid = round2(paid._sum.amount ?? 0);
  const pending = round2(held._sum.amount ?? 0);
  return { totalEarned, totalPaid, pending, available: round2(totalEarned - totalPaid - pending) };
}

/** ข้อมูลกระเป๋าเงินสำหรับหน้า Wallet ของไรเดอร์ */
export async function getWallet(userId: string) {
  const [balance, settings, recentEntries, dealAgg, referralAgg, referralCount] = await Promise.all([
    getBalance(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        commissionPerDeal: true,
        referralPercent: true,
        referredById: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    }),
    prisma.commissionEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.commissionEntry.aggregate({ where: { userId, type: 'DEAL' }, _sum: { amount: true } }),
    prisma.commissionEntry.aggregate({
      where: { userId, type: 'REFERRAL' },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { referredById: userId } }),
  ]);

  return {
    balance,
    settings,
    earnedFromDeals: round2(dealAgg._sum.amount ?? 0),
    earnedFromReferral: round2(referralAgg._sum.amount ?? 0),
    directReferrals: referralCount,
    recentEntries,
  };
}
