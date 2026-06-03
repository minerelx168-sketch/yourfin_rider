# YourFin Rider — Backend API

REST API ด้วย **Node.js + Express + TypeScript + Prisma + MySQL**
พร้อมการคำนวณระยะทางขับขี่จริงผ่าน **Google Maps Distance Matrix API** (มี Haversine fallback)

## คุณสมบัติ

- 🔐 JWT auth + RBAC (`SALES` / `MANAGER` / `ADMIN`)
- 📍 บันทึกเหตุการณ์ GPS: clock-in / check-in (ร้าน+แบรนด์+สถานะ+รูป) / clock-out
- 🗺️ คำนวณ `leg_distance_km` จาก "จุดก่อนหน้า" ของเซลล์ในวันเดียวกันอัตโนมัติ
- 📊 Dashboard aggregation: overview, leaderboard, timeseries, coverage map, activity feed
- 🖼️ อัปโหลดรูปหน้าร้าน (dev เก็บ local; prod แนะนำ S3/GCS)
- 🛡️ helmet, CORS, rate-limit, zod validation

## โครงสร้าง

```
backend/
├─ prisma/
│  ├─ schema.prisma          # data model (MySQL)
│  ├─ migrations/            # SQL migrations (commit ลง git)
│  └─ seed.ts                # ข้อมูลตัวอย่าง
├─ src/
│  ├─ config/env.ts          # โหลด/ตรวจ env
│  ├─ lib/prisma.ts          # Prisma client singleton
│  ├─ middleware/            # auth, error, validate, upload(multer)
│  ├─ services/              # maps, activity, dashboard (business logic)
│  ├─ controllers/           # ตัวจัดการ request + zod schema
│  ├─ routes/                # นิยาม endpoint
│  ├─ utils/                 # date (Asia/Bangkok), jwt
│  ├─ app.ts                 # ประกอบ express app
│  └─ index.ts               # bootstrap server
└─ uploads/                  # ไฟล์รูป (dev)
```

## เริ่มใช้งาน (Quickstart)

```bash
# 1) สตาร์ท MySQL (จาก root ของ repo)
docker compose up -d mysql

# 2) ตั้งค่า env
cd backend
cp .env.example .env          # แก้ค่าให้ตรง โดยเฉพาะ GOOGLE_MAPS_API_KEY (เว้นว่างได้ในdev)

# 3) ติดตั้ง + เตรียมฐานข้อมูล
npm install
npm run prisma:migrate        # สร้างตารางจาก schema
npm run seed                  # ใส่ข้อมูลตัวอย่าง (ผู้ใช้/ร้าน/กิจกรรม 10 วัน)

# 4) รัน
npm run dev                   # http://localhost:4000
```

ทดสอบ: `curl http://localhost:4000/api/health`

## บัญชีทดสอบ (จาก seed)

| Role | email | password |
|---|---|---|
| ADMIN | `admin@yourfin.co` | `admin1234` |
| MANAGER | `manager@yourfin.co` | `manager1234` |
| SALES | `somchai@yourfin.co` (และ suda/anan/nong) | `sales1234` |

## Scripts

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` | รันแบบ hot-reload (tsx watch) |
| `npm run build` | generate Prisma + คอมไพล์ TS → `dist/` |
| `npm start` | รัน production (`node dist/index.js`) |
| `npm run prisma:migrate` | สร้าง/อัปเดต migration (dev) |
| `npm run prisma:deploy` | apply migration (prod) |
| `npm run seed` | seed ข้อมูลตัวอย่าง |
| `npm run typecheck` | ตรวจชนิดข้อมูล |

## API

ดูสัญญา API ทั้งหมดที่ [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)

## Google Maps

ใส่ `GOOGLE_MAPS_API_KEY` ใน `.env` เพื่อใช้ระยะทางขับขี่จริง (mode=driving)
ถ้าเว้นว่าง ระบบจะใช้ **Haversine** (เส้นตรง) เป็น fallback — ใช้งาน/เดโมได้ทันทีโดยไม่ต้องมีคีย์

## หมายเหตุ production

- เปลี่ยน `JWT_SECRET` เป็นค่าสุ่มยาว และตั้ง `CORS_ORIGINS` ให้เจาะจง
- ย้ายการเก็บรูปไปที่ object storage (S3/GCS) แทน local disk
- จำกัดสิทธิ์ Google Maps API key (HTTP referrer / IP) และตั้ง budget alert
- PDPA: ระบบเก็บพิกัด GPS พนักงาน + ข้อมูลร้าน → ต้องมีหนังสือแจ้ง/ขอความยินยอม
