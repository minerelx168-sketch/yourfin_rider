import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../middleware/error';

const BRANDS = ['SAMSUNG', 'VIVO', 'OPPO', 'XIAOMI', 'REALME', 'APPLE', 'OTHER'] as const;

export const listStoresSchema = z.object({
  brand: z.enum(BRANDS).optional(),
  partnerStatus: z.enum(['PROSPECT', 'ACTIVE', 'CLOSED']).optional(),
  q: z.string().optional(),
});

export const createStoreSchema = z.object({
  name: z.string().min(1),
  brand: z.enum(BRANDS).default('OTHER'),
  province: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  partnerStatus: z.enum(['PROSPECT', 'ACTIVE', 'CLOSED']).default('PROSPECT'),
  ownerName: z.string().optional(),
  ownerContact: z.string().optional(),
});

export const listStores = asyncHandler(async (req: Request, res: Response) => {
  const { brand, partnerStatus, q } = req.query as z.infer<typeof listStoresSchema>;
  const stores = await prisma.store.findMany({
    where: {
      brand,
      partnerStatus,
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  res.json({ stores });
});

export const getStore = asyncHandler(async (req: Request, res: Response) => {
  const store = await prisma.store.findUnique({
    where: { id: req.params.id },
    include: {
      activities: { orderBy: { eventTime: 'desc' }, take: 20, include: { user: { select: { name: true } } } },
    },
  });
  if (!store) throw new ApiError(404, 'Store not found');
  res.json({ store });
});

export const createStore = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof createStoreSchema>;
  const store = await prisma.store.create({
    data: { ...body, createdById: req.user!.sub },
  });
  res.status(201).json({ store });
});
