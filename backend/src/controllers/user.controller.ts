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
  role: z.enum(['SALES', 'MANAGER', 'ADMIN']).optional(),
  active: z.boolean().optional(),
  targetDailyClose: z.number().int().min(0).optional(),
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ users });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof updateUserSchema>;
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'User not found');
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: body,
    select: publicUserSelect,
  });
  res.json({ user });
});
