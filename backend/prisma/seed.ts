/**
 * Seed ข้อมูลตัวอย่าง — รันด้วย `npm run seed`
 * สร้างผู้ใช้ทดสอบ, ร้านค้า, และกิจกรรมย้อนหลัง ~10 วัน รอบ ๆ กรุงเทพฯ
 * ระยะทางคำนวณด้วย Haversine จึงใช้งานได้แม้ไม่มี Google Maps API key
 */
import { PrismaClient, Brand, VisitStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BKK = { lat: 13.7563, lng: 100.5018 };
const AVG_SPEED_KMH = 25;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))) * 100) / 100;
}

function toWorkDate(at: Date): Date {
  const bkk = new Date(at.getTime() + 7 * 3600 * 1000);
  return new Date(Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate()));
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(base: { lat: number; lng: number }, spread = 0.06) {
  return { lat: base.lat + rand(-spread, spread), lng: base.lng + rand(-spread, spread) };
}

const BRANDS: Brand[] = [Brand.SAMSUNG, Brand.VIVO, Brand.OPPO, Brand.XIAOMI, Brand.REALME];

// 60% success-ish weighting feels good for a demo
function weightedStatus(): VisitStatus {
  const r = Math.random();
  if (r < 0.42) return VisitStatus.SUCCESS;
  if (r < 0.75) return VisitStatus.PENDING;
  return VisitStatus.REJECTED;
}

type RiderNode = {
  id: string;
  commissionPerDeal: number;
  referredById: string | null;
  referralPercent: number;
};

// คิดคอม + ค่าแนะนำหลายชั้น (mirror ของ commission.service.accrueDealCommission)
async function accrueSeed(
  activityId: string,
  rider: RiderNode,
  userById: Map<string, RiderNode>,
) {
  const base = rider.commissionPerDeal || 0;
  const entries: Record<string, unknown>[] = [];
  if (base > 0) {
    entries.push({ userId: rider.id, type: 'DEAL', amount: base, level: 0, sourceActivityId: activityId, sourceUserId: rider.id });
  }
  let current: RiderNode = rider;
  const seen = new Set<string>([rider.id]);
  for (let level = 1; level <= 5 && current.referredById; level++) {
    const ref = userById.get(current.referredById);
    if (!ref || seen.has(ref.id)) break;
    seen.add(ref.id);
    const amt = Math.round(base * (current.referralPercent || 0)) / 100;
    if (amt > 0) {
      entries.push({ userId: ref.id, type: 'REFERRAL', amount: amt, level, sourceActivityId: activityId, sourceUserId: rider.id, note: `ค่าแนะนำชั้น ${level}` });
    }
    current = ref;
  }
  if (entries.length) await prisma.commissionEntry.createMany({ data: entries as never });
}

async function main() {
  console.log('🌱 Seeding YourFin Rider database...');

  // เคลียร์ข้อมูลเดิม (ลำดับสำคัญเพราะ FK)
  await prisma.activity.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const passAdmin = await bcrypt.hash('admin1234', 10);
  const passManager = await bcrypt.hash('manager1234', 10);
  const passSales = await bcrypt.hash('sales1234', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@yourfin.co',
      passwordHash: passAdmin,
      name: 'แอดมิน ระบบ',
      role: 'ADMIN',
      region: 'HQ',
      team: 'Operations',
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager@yourfin.co',
      passwordHash: passManager,
      name: 'มานพ ผู้จัดการ',
      role: 'MANAGER',
      region: 'กรุงเทพฯ',
      team: 'Sales',
    },
  });

  // ไรเดอร์ + ตั้งค่าคอม/affiliate (สายแนะนำหลายชั้น)
  // สายแนะนำ: สมชาย (บนสุด) ← สุดา ← อนันต์ ,  สมชาย ← น้อง
  const salesSeeds = [
    { email: 'somchai@yourfin.co', name: 'สมชาย ใจดี', region: 'กรุงเทพฯ ตะวันออก', target: 4,
      commissionPerDeal: 250, referralPercent: 0, referredBy: null as string | null, bank: 'กสิกรไทย', acc: '123-4-56789-0' },
    { email: 'suda@yourfin.co', name: 'สุดา รักงาน', region: 'กรุงเทพฯ เหนือ', target: 4,
      commissionPerDeal: 200, referralPercent: 5, referredBy: 'somchai@yourfin.co', bank: 'ไทยพาณิชย์', acc: '456-7-89012-3' },
    { email: 'anan@yourfin.co', name: 'อนันต์ ขยันขาย', region: 'กรุงเทพฯ ใต้', target: 3,
      commissionPerDeal: 200, referralPercent: 5, referredBy: 'suda@yourfin.co', bank: 'กรุงเทพ', acc: '789-0-12345-6' },
    { email: 'nong@yourfin.co', name: 'น้อง พากเพียร', region: 'นนทบุรี', target: 3,
      commissionPerDeal: 180, referralPercent: 4, referredBy: 'somchai@yourfin.co', bank: 'กรุงไทย', acc: '012-3-45678-9' },
  ];

  const sales = [];
  const byEmail = new Map<string, string>();
  for (const s of salesSeeds) {
    const u = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: passSales,
        name: s.name,
        role: 'SALES',
        region: s.region,
        team: 'Sales',
        targetDailyClose: s.target,
        commissionPerDeal: s.commissionPerDeal,
        referralPercent: s.referralPercent,
        referredById: s.referredBy ? byEmail.get(s.referredBy) ?? null : null,
        bankName: s.bank,
        bankAccountName: s.name,
        bankAccountNumber: s.acc,
      },
    });
    byEmail.set(s.email, u.id);
    sales.push(u);
  }
  const userById = new Map(sales.map((u) => [u.id, u]));

  // ร้านค้าตัวอย่าง
  const storeSeeds = [
    { name: 'มือถือ พลาซ่า บางกะปิ', brand: Brand.SAMSUNG, district: 'บางกะปิ' },
    { name: 'TG Phone รามคำแหง', brand: Brand.VIVO, district: 'บางกะปิ' },
    { name: 'iStudio ลาดพร้าว', brand: Brand.APPLE, district: 'ลาดพร้าว' },
    { name: 'Oppo Shop เดอะมอลล์', brand: Brand.OPPO, district: 'บางกะปิ' },
    { name: 'มือถือดี สะพานควาย', brand: Brand.XIAOMI, district: 'พญาไท' },
    { name: 'โฟนเฮ้าส์ บางนา', brand: Brand.REALME, district: 'บางนา' },
    { name: 'Smart Mobile นนทบุรี', brand: Brand.SAMSUNG, district: 'เมืองนนทบุรี' },
    { name: 'ครบเครื่องโมบาย อ่อนนุช', brand: Brand.VIVO, district: 'สวนหลวง' },
  ];
  for (const st of storeSeeds) {
    const loc = jitter(BKK, 0.08);
    await prisma.store.create({
      data: {
        name: st.name,
        brand: st.brand,
        district: st.district,
        province: 'กรุงเทพมหานคร',
        lat: loc.lat,
        lng: loc.lng,
        partnerStatus: pick(['PROSPECT', 'ACTIVE', 'PROSPECT'] as const),
        createdById: admin.id,
      },
    });
  }

  // กิจกรรมย้อนหลัง 10 วัน
  let activityCount = 0;
  const DAYS = 10;
  const today = new Date();

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);

    for (const rider of sales) {
      const home = jitter(BKK, 0.1); // จุดเริ่มของแต่ละคนต่างกัน
      let prev: { lat: number; lng: number } | null = null;

      const pushActivity = async (
        eventType: 'CLOCK_IN' | 'CHECK_IN' | 'CLOCK_OUT',
        hour: number,
        minute: number,
        loc: { lat: number; lng: number },
        extra: Partial<{ storeName: string; brand: Brand; visitStatus: VisitStatus }> = {},
      ) => {
        const eventTime = new Date(day);
        eventTime.setHours(hour, minute, 0, 0);
        const km = prev ? haversineKm(prev, loc) : 0;
        const created = await prisma.activity.create({
          data: {
            userId: rider.id,
            eventType,
            eventTime,
            workDate: toWorkDate(eventTime),
            lat: loc.lat,
            lng: loc.lng,
            storeName: extra.storeName ?? null,
            brand: extra.brand ?? null,
            visitStatus: extra.visitStatus ?? null,
            prevLat: prev?.lat ?? null,
            prevLng: prev?.lng ?? null,
            legDistanceKm: km,
            legDurationMin: prev ? Math.round((km / AVG_SPEED_KMH) * 60 * 100) / 100 : 0,
            calcStatus: prev ? 'DONE' : 'SKIP',
            processedAt: new Date(eventTime.getTime() + 60000),
          },
        });
        prev = loc;
        activityCount++;
        return created;
      };

      // เริ่มงาน
      await pushActivity('CLOCK_IN', 8, Math.floor(rand(15, 45)), home);

      // เข้าพบร้าน 4-8 ครั้ง
      const visits = Math.floor(rand(4, 9));
      for (let v = 0; v < visits; v++) {
        const hour = 9 + Math.floor((v / visits) * 7); // กระจาย 9:00-16:00
        const loc = jitter(BKK, 0.07);
        const status = weightedStatus();
        const act = await pushActivity('CHECK_IN', hour, Math.floor(rand(0, 59)), loc, {
          storeName: pick(storeSeeds).name,
          brand: pick(BRANDS),
          visitStatus: status,
        });
        if (status === VisitStatus.SUCCESS) {
          await accrueSeed(act.id, rider as unknown as RiderNode, userById as unknown as Map<string, RiderNode>);
        }
      }

      // เลิกงาน
      await pushActivity('CLOCK_OUT', 17, Math.floor(rand(10, 50)), jitter(BKK, 0.09));
    }
  }

  // คำขอถอนคอมมิชชั่นตัวอย่าง (หลายสถานะ + สลิป)
  const SLIP = 'https://placehold.co/480x720/png?text=Transfer+Slip';
  const withdrawPlan: { email: string; amount: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' }[] = [
    { email: 'somchai@yourfin.co', amount: 600, status: 'PAID' },
    { email: 'somchai@yourfin.co', amount: 300, status: 'PENDING' },
    { email: 'suda@yourfin.co', amount: 400, status: 'APPROVED' },
    { email: 'anan@yourfin.co', amount: 250, status: 'PENDING' },
    { email: 'nong@yourfin.co', amount: 150, status: 'REJECTED' },
  ];
  let wdCount = 0;
  for (const w of withdrawPlan) {
    const uid = byEmail.get(w.email)!;
    const u = userById.get(uid)! as unknown as { bankName: string; bankAccountNumber: string; bankAccountName: string };
    await prisma.withdrawal.create({
      data: {
        userId: uid,
        amount: w.amount,
        status: w.status,
        bankName: u.bankName,
        bankAccountNumber: u.bankAccountNumber,
        bankAccountName: u.bankAccountName,
        note: w.status === 'PENDING' ? 'ขอถอนค่าคอมรอบนี้ครับ' : null,
        slipUrl: w.status === 'PAID' ? SLIP : null,
        adminNote: w.status === 'REJECTED' ? 'ยอดสะสมยังไม่ถึงเกณฑ์ขั้นต่ำ' : null,
        processedById: w.status === 'PENDING' ? null : admin.id,
        processedAt: w.status === 'PENDING' ? null : new Date(),
      },
    });
    wdCount++;
  }

  const commissionTotal = await prisma.commissionEntry.aggregate({ _sum: { amount: true }, _count: { _all: true } });

  console.log(`✅ Done. Users: ${sales.length + 2}, Stores: ${storeSeeds.length}, Activities: ${activityCount}`);
  console.log(`   Commission entries: ${commissionTotal._count._all} (รวม ${commissionTotal._sum.amount ?? 0} บาท), Withdrawals: ${wdCount}`);
  console.log('\n🔑 Login accounts (password):');
  console.log('   admin@yourfin.co / admin1234     (ADMIN — ดูคำขอถอน/ตั้งค่า affiliate)');
  console.log('   manager@yourfin.co / manager1234 (MANAGER — dashboard)');
  console.log('   somchai@yourfin.co / sales1234   (SALES — แอป + กระเป๋าเงิน/ถอนคอม)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
