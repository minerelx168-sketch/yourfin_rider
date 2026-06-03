import { prisma } from '../lib/prisma';
import { formatWorkDate } from '../utils/date';

interface Range {
  from: Date;
  to: Date;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** สรุปตัวเลขรวมสำหรับ Scorecards บน dashboard */
export async function getOverview({ from, to }: Range) {
  const where = { workDate: { gte: from, lte: to } };
  const checkinWhere = { ...where, eventType: 'CHECK_IN' as const };

  const [totalCheckins, statusGroups, distanceAgg, activeRiders, brandGroups, storesVisited] =
    await Promise.all([
      prisma.activity.count({ where: checkinWhere }),
      prisma.activity.groupBy({
        by: ['visitStatus'],
        where: checkinWhere,
        _count: { _all: true },
      }),
      prisma.activity.aggregate({ where, _sum: { legDistanceKm: true } }),
      prisma.activity.findMany({ where, distinct: ['userId'], select: { userId: true } }),
      prisma.activity.groupBy({ by: ['brand'], where: checkinWhere, _count: { _all: true } }),
      prisma.activity.findMany({
        where: checkinWhere,
        distinct: ['storeName'],
        select: { storeName: true },
      }),
    ]);

  const statusCount = (status: string) =>
    statusGroups.find((g) => g.visitStatus === status)?._count._all ?? 0;

  const success = statusCount('SUCCESS');
  const pending = statusCount('PENDING');
  const rejected = statusCount('REJECTED');

  return {
    range: { from: formatWorkDate(from), to: formatWorkDate(to) },
    totalCheckins,
    success,
    pending,
    rejected,
    conversionRate: totalCheckins > 0 ? round2((success / totalCheckins) * 100) : 0,
    totalDistanceKm: round2(distanceAgg._sum.legDistanceKm ?? 0),
    activeRiders: activeRiders.length,
    storesVisited: storesVisited.filter((s) => s.storeName).length,
    brandBreakdown: brandGroups
      .filter((g) => g.brand)
      .map((g) => ({ brand: g.brand as string, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
  };
}

/** ตารางจัดอันดับเซลล์ (ผลงานต่อคน) */
export async function getLeaderboard({ from, to }: Range) {
  const where = { workDate: { gte: from, lte: to } };

  const [checkinByUser, successByUser, pendingByUser, rejectByUser, distByUser, users] =
    await Promise.all([
      prisma.activity.groupBy({
        by: ['userId'],
        where: { ...where, eventType: 'CHECK_IN' },
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ['userId'],
        where: { ...where, visitStatus: 'SUCCESS' },
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ['userId'],
        where: { ...where, visitStatus: 'PENDING' },
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ['userId'],
        where: { ...where, visitStatus: 'REJECTED' },
        _count: { _all: true },
      }),
      prisma.activity.groupBy({ by: ['userId'], where, _sum: { legDistanceKm: true } }),
      prisma.user.findMany({
        where: { role: 'SALES' },
        select: { id: true, name: true, region: true, team: true, targetDailyClose: true },
      }),
    ]);

  const countMap = (rows: { userId: string; _count: { _all: number } }[]) =>
    new Map(rows.map((r) => [r.userId, r._count._all]));

  const checkins = countMap(checkinByUser);
  const success = countMap(successByUser);
  const pending = countMap(pendingByUser);
  const rejected = countMap(rejectByUser);
  const distance = new Map(distByUser.map((r) => [r.userId, r._sum.legDistanceKm ?? 0]));

  return users
    .map((u) => {
      const c = checkins.get(u.id) ?? 0;
      const s = success.get(u.id) ?? 0;
      return {
        userId: u.id,
        name: u.name,
        region: u.region,
        team: u.team,
        targetDailyClose: u.targetDailyClose,
        checkins: c,
        success: s,
        pending: pending.get(u.id) ?? 0,
        rejected: rejected.get(u.id) ?? 0,
        conversionRate: c > 0 ? round2((s / c) * 100) : 0,
        distanceKm: round2(distance.get(u.id) ?? 0),
      };
    })
    .sort((a, b) => b.success - a.success || b.checkins - a.checkins);
}

/** แนวโน้มรายวัน (สำหรับกราฟ time series) */
export async function getTimeseries({ from, to }: Range) {
  const where = { workDate: { gte: from, lte: to } };

  const [checkinByDate, successByDate, distByDate] = await Promise.all([
    prisma.activity.groupBy({
      by: ['workDate'],
      where: { ...where, eventType: 'CHECK_IN' },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({
      by: ['workDate'],
      where: { ...where, visitStatus: 'SUCCESS' },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({ by: ['workDate'], where, _sum: { legDistanceKm: true } }),
  ]);

  const key = (d: Date) => formatWorkDate(d);
  const checkins = new Map(checkinByDate.map((r) => [key(r.workDate), r._count._all]));
  const success = new Map(successByDate.map((r) => [key(r.workDate), r._count._all]));
  const distance = new Map(distByDate.map((r) => [key(r.workDate), r._sum.legDistanceKm ?? 0]));

  const dates = new Set<string>([...checkins.keys(), ...success.keys(), ...distance.keys()]);
  return [...dates]
    .sort()
    .map((date) => ({
      date,
      checkins: checkins.get(date) ?? 0,
      success: success.get(date) ?? 0,
      distanceKm: round2(distance.get(date) ?? 0),
    }));
}

/** จุดเช็คอินสำหรับ Coverage Map (หมุดสีตามสถานะ) */
export async function getMapPoints({ from, to }: Range) {
  const points = await prisma.activity.findMany({
    where: { workDate: { gte: from, lte: to }, eventType: 'CHECK_IN' },
    select: {
      id: true,
      lat: true,
      lng: true,
      storeName: true,
      brand: true,
      visitStatus: true,
      eventTime: true,
      user: { select: { name: true } },
    },
    orderBy: { eventTime: 'desc' },
    take: 2000,
  });
  return points.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    storeName: p.storeName,
    brand: p.brand,
    visitStatus: p.visitStatus,
    eventTime: p.eventTime,
    riderName: p.user.name,
  }));
}

/** ฟีดกิจกรรมล่าสุด (สำหรับ "เกิดอะไรขึ้นตอนนี้") */
export async function getActivityFeed({ from, to }: Range, limit = 50) {
  const rows = await prisma.activity.findMany({
    where: { workDate: { gte: from, lte: to } },
    orderBy: { eventTime: 'desc' },
    take: limit,
    include: { user: { select: { name: true } } },
  });
  return rows.map((a) => ({
    id: a.id,
    riderName: a.user.name,
    eventType: a.eventType,
    storeName: a.storeName,
    brand: a.brand,
    visitStatus: a.visitStatus,
    legDistanceKm: a.legDistanceKm,
    lat: a.lat,
    lng: a.lng,
    eventTime: a.eventTime,
  }));
}
