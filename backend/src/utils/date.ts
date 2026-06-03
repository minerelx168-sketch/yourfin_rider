// ตัวช่วยเรื่องวันที่ — โซนเวลาอ้างอิง Asia/Bangkok (UTC+7)
// ทุกอย่างที่เกี่ยวกับ "วันทำงาน (work_date)" ต้องผ่านที่นี่ เพื่อกันปัญหา timezone drift

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * คืน "วันตามปฏิทินกรุงเทพ" ของช่วงเวลาที่ให้มา เป็น Date ที่ตรึงไว้ที่เที่ยงคืน UTC
 * (เหมาะกับคอลัมน์ Prisma @db.Date ที่เก็บเฉพาะส่วนวันที่)
 */
export function toWorkDate(at: Date = new Date()): Date {
  const bangkok = new Date(at.getTime() + BANGKOK_OFFSET_MS);
  const y = bangkok.getUTCFullYear();
  const m = bangkok.getUTCMonth();
  const d = bangkok.getUTCDate();
  return new Date(Date.UTC(y, m, d));
}

/** แปลง 'YYYY-MM-DD' (เวลากรุงเทพ) เป็น Date ที่เที่ยงคืน UTC */
export function parseWorkDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** ฟอร์แมต Date เป็น 'YYYY-MM-DD' (ตามค่าที่เก็บใน @db.Date คือ UTC) */
export function formatWorkDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** จุดเริ่มต้นของช่วง: ถ้าไม่ระบุ ใช้ค่าเริ่มต้น N วันย้อนหลังจากวันนี้ */
export function rangeFromQuery(
  from?: string,
  to?: string,
  defaultDays = 7,
): { from: Date; to: Date } {
  const toDate = to ? parseWorkDate(to) : toWorkDate();
  const fromDate = from
    ? parseWorkDate(from)
    : new Date(toDate.getTime() - defaultDays * 24 * 60 * 60 * 1000);
  return { from: fromDate, to: toDate };
}
