import type { Brand, EventType, Prisma, VisitStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { toWorkDate } from '../utils/date';
import { computeLeg } from './maps.service';

export interface CreateActivityInput {
  userId: string;
  eventType: EventType;
  lat: number;
  lng: number;
  // เฉพาะ CHECK_IN
  storeId?: string;
  storeName?: string;
  brand?: Brand;
  visitStatus?: VisitStatus;
  photoUrl?: string;
  note?: string;
}

/**
 * สร้าง 1 เหตุการณ์ GPS แล้วคำนวณระยะทางจาก "จุดก่อนหน้า" ของเซลล์คนเดิมในวันเดียวกัน
 * - จุดแรกของวัน → calcStatus = SKIP, ระยะ = 0
 * - จุดถัดไป → เรียก Google Maps (หรือ Haversine fallback) แล้วเก็บ leg distance/duration
 */
export async function createActivity(input: CreateActivityInput) {
  const now = new Date();
  const workDate = toWorkDate(now);

  // หา "จุดก่อนหน้า" = เหตุการณ์ล่าสุดของเซลล์คนนี้ในวันเดียวกันที่เกิด ณ หรือก่อนเวลานี้
  // (กรอง eventTime <= now กันกรณีนาฬิกาอุปกรณ์เพี้ยน/ข้อมูลล่วงหน้า)
  const previous = await prisma.activity.findFirst({
    where: { userId: input.userId, workDate, eventTime: { lte: now } },
    orderBy: { eventTime: 'desc' },
    select: { lat: true, lng: true },
  });

  let leg: Prisma.ActivityCreateInput['legDistanceKm'] = 0;
  let durationMin = 0;
  let prevLat: number | null = null;
  let prevLng: number | null = null;
  let calcStatus: Prisma.ActivityCreateInput['calcStatus'] = 'SKIP';

  if (previous) {
    prevLat = previous.lat;
    prevLng = previous.lng;
    try {
      const result = await computeLeg(
        { lat: previous.lat, lng: previous.lng },
        { lat: input.lat, lng: input.lng },
      );
      leg = result.distanceKm;
      durationMin = result.durationMin;
      calcStatus = 'DONE';
    } catch (err) {
      console.error('computeLeg failed:', (err as Error).message);
      calcStatus = 'ERROR';
    }
  }

  return prisma.activity.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      eventTime: now,
      workDate,
      lat: input.lat,
      lng: input.lng,
      storeId: input.storeId ?? null,
      storeName: input.storeName ?? null,
      brand: input.brand ?? null,
      visitStatus: input.visitStatus ?? null,
      photoUrl: input.photoUrl ?? null,
      note: input.note ?? null,
      prevLat,
      prevLng,
      legDistanceKm: leg,
      legDurationMin: durationMin,
      calcStatus,
      processedAt: new Date(),
    },
    include: { store: true },
  });
}

/** กิจกรรมของเซลล์คนหนึ่งในวันที่กำหนด (ค่าเริ่มต้น = วันนี้) */
export async function getActivitiesForUserOnDate(userId: string, workDate: Date) {
  return prisma.activity.findMany({
    where: { userId, workDate },
    orderBy: { eventTime: 'asc' },
    include: { store: true },
  });
}
