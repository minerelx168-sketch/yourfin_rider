import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../middleware/error';
import { signToken } from '../utils/jwt';

// ฟิลด์ผู้ใช้ที่ปลอดภัยส่งออก (ไม่รวม passwordHash)
export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  team: true,
  region: true,
  role: true,
  active: true,
  targetDailyClose: true,
  photoUrl: true,
  commissionPerDeal: true,
  referralPercent: true,
  referredById: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  createdAt: true,
} as const;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  team: z.string().optional(),
  region: z.string().optional(),
  role: z.enum(['SALES', 'MANAGER', 'FINANCE', 'ADMIN']).default('SALES'),
  targetDailyClose: z.number().int().min(0).optional(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  const { passwordHash: _omit, ...safe } = user;
  res.json({ token, user: safe });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: publicUserSelect,
  });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof registerSchema>;
  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name,
      phone: body.phone,
      team: body.team,
      region: body.region,
      role: body.role,
      targetDailyClose: body.targetDailyClose ?? 3,
    },
    select: publicUserSelect,
  });
  res.status(201).json({ user });
});
