import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../middleware/error';
import { publicUserSelect } from './auth.controller';

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  team: z.string().optional(),
  region: z.string().optional(),
  role: z.enum(['SALES', 'MANAGER', 'FINANCE', 'ADMIN']).optional(),
  active: z.boolean().optional(),
  targetDailyClose: z.number().int().min(0).optional(),
  // คอมมิชชั่น & affiliate
  commissionPerDeal: z.number().int().min(0).optional(),
  referralPercent: z.number().min(0).max(100).optional(),
  referredById: z.string().nullable().optional(),
  // บัญชีรับเงิน
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z.string().max(40).optional(),
  bankAccountName: z.string().max(120).optional(),
});

/** ป้องกันสายแนะนำวน (cycle) ก่อนตั้ง referredById */
async function wouldCreateCycle(userId: string, newReferrerId: string): Promise<boolean> {
  if (userId === newReferrerId) return true;
  let cursor: string | null = newReferrerId;
  let depth = 0;
  while (cursor && depth < 100) {
    if (cursor === userId) return true;
    const u: { referredById: string | null } | null = await prisma.user.findUnique({
      where: { id: cursor },
      select: { referredById: true },
    });
    cursor = u?.referredById ?? null;
    depth++;
  }
  return false;
}

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ users });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof updateUserSchema>;
  const id = req.params.id;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'User not found');

  // ทำให้ค่าว่างของ referredById เป็น null และตรวจ cycle
  const data: typeof body = { ...body };
  if (body.referredById !== undefined) {
    const ref = body.referredById ? body.referredById : null;
    if (ref) {
      const target = await prisma.user.findUnique({ where: { id: ref }, select: { id: true } });
      if (!target) throw new ApiError(400, 'ไม่พบผู้แนะนำ (referredById) ที่ระบุ');
      if (await wouldCreateCycle(id, ref)) {
        throw new ApiError(400, 'ตั้งผู้แนะนำไม่ได้: จะทำให้สายแนะนำวนซ้ำ');
      }
    }
    data.referredById = ref;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: publicUserSelect,
  });
  res.json({ user });
});
