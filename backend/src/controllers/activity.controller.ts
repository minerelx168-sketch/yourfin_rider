import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error';
import { createActivity, getActivitiesForUserOnDate } from '../services/activity.service';
import { parseWorkDate, toWorkDate } from '../utils/date';

const latLng = {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
};

export const clockSchema = z.object(latLng);

export const checkInSchema = z.object({
  ...latLng,
  storeId: z.string().optional(),
  storeName: z.string().min(1, 'ต้องระบุชื่อร้าน'),
  brand: z.enum(['SAMSUNG', 'VIVO', 'OPPO', 'XIAOMI', 'REALME', 'APPLE', 'OTHER']).default('OTHER'),
  visitStatus: z.enum(['SUCCESS', 'PENDING', 'REJECTED']),
  photoUrl: z.string().url().optional().or(z.literal('')).optional(),
  note: z.string().max(2000).optional(),
});

export const dateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD')
    .optional(),
});

export const clockIn = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.body as z.infer<typeof clockSchema>;
  const activity = await createActivity({ userId: req.user!.sub, eventType: 'CLOCK_IN', lat, lng });
  res.status(201).json({ activity });
});

export const clockOut = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.body as z.infer<typeof clockSchema>;
  const activity = await createActivity({ userId: req.user!.sub, eventType: 'CLOCK_OUT', lat, lng });
  res.status(201).json({ activity });
});

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof checkInSchema>;
  const activity = await createActivity({
    userId: req.user!.sub,
    eventType: 'CHECK_IN',
    lat: body.lat,
    lng: body.lng,
    storeId: body.storeId,
    storeName: body.storeName,
    brand: body.brand,
    visitStatus: body.visitStatus,
    photoUrl: body.photoUrl || undefined,
    note: body.note,
  });
  res.status(201).json({ activity });
});

/** กิจกรรมของฉันในวันที่กำหนด (default = วันนี้) + สรุปย่อ */
export const myDay = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query as z.infer<typeof dateQuerySchema>;
  const workDate = date ? parseWorkDate(date) : toWorkDate();
  const activities = await getActivitiesForUserOnDate(req.user!.sub, workDate);

  const checkins = activities.filter((a) => a.eventType === 'CHECK_IN');
  const success = checkins.filter((a) => a.visitStatus === 'SUCCESS').length;
  const totalDistanceKm = activities.reduce((sum, a) => sum + (a.legDistanceKm ?? 0), 0);
  const clockedIn = activities.some((a) => a.eventType === 'CLOCK_IN');
  const clockedOut = activities.some((a) => a.eventType === 'CLOCK_OUT');

  res.json({
    workDate: date ?? toWorkDate().toISOString().slice(0, 10),
    summary: {
      checkins: checkins.length,
      success,
      pending: checkins.filter((a) => a.visitStatus === 'PENDING').length,
      rejected: checkins.filter((a) => a.visitStatus === 'REJECTED').length,
      conversionRate: checkins.length > 0 ? Math.round((success / checkins.length) * 100) : 0,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      clockedIn,
      clockedOut,
    },
    activities,
  });
});
