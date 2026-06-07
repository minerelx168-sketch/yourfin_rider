# 🚀 Deployment — YourFin Rider

คู่มือนำระบบขึ้น production: **API (Node/Express)** + **Dashboard (React, web app)** + **MySQL**
(แอปมือถือ Expo build แยกผ่าน EAS — ดูท้ายเอกสาร)

> ✅ **สถานะการทดสอบ:** ผ่าน end-to-end ครบ 38/38 เคส (auth ทุก role, flow ไรเดอร์+คอม,
> affiliate หลายชั้น, ล็อกบัญชี/ถอนเงิน, อนุมัติ-จ่าย+สลิป, dashboard, จัดการผู้ใช้, RBAC).
> production build ของ backend (`dist/`) และ dashboard (`dist/`) คอมไพล์และรันผ่าน

---

## ภาพรวมสิ่งที่ต้อง deploy

| ส่วน | คืออะไร | โฮสต์ที่เหมาะ |
|---|---|---|
| **MySQL** | ฐานข้อมูล | managed (PlanetScale*/RDS/Cloud SQL) หรือคอนเทนเนอร์ |
| **backend/** | REST API | คอนเทนเนอร์ (Render/Railway/Fly/VPS) |
| **dashboard/** | เว็บแอป (static SPA) | nginx/คอนเทนเนอร์ หรือ Vercel/Netlify |
| **mobile/** | Expo app | EAS Build (App Store / Play) |

\* PlanetScale ปิด foreign key — โปรเจกต์นี้ใช้ FK ผ่าน Prisma แนะนำ MySQL ปกติ (RDS/Cloud SQL/self-host)

---

## ตัวเลือก A — Docker Compose (โฮสต์เดียว, ง่ายสุด) ✅ แนะนำ

ได้ครบทั้ง MySQL + API + Dashboard บนเครื่องเดียว โดย nginx เสิร์ฟ dashboard และ proxy `/api`+`/uploads`
ไปที่ backend → เบราว์เซอร์คุยกับ origin เดียว (ไม่มีปัญหา CORS) และรัน `prisma migrate deploy` ให้อัตโนมัติ

```bash
# 1) ตั้งค่า secret ของ backend
cp backend/.env.production.example backend/.env
#   แก้ JWT_SECRET (openssl rand -hex 32), GOOGLE_MAPS_API_KEY, PUBLIC_BASE_URL=https://โดเมนคุณ

# 2) (ออปชัน) ตั้งรหัส MySQL ผ่านไฟล์ .env ที่ root
cat > .env <<EOF
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
MYSQL_USER=yourfin
MYSQL_PASSWORD=$(openssl rand -hex 16)
EOF

# 3) build + run
docker compose -f docker-compose.prod.yml up -d --build

# 4) ดู log / ตรวจสุขภาพ
docker compose -f docker-compose.prod.yml logs -f backend
curl http://localhost/api/health
```

จากนั้น **seed บัญชีผู้ดูแลครั้งแรก** (ครั้งเดียว):
```bash
docker compose -f docker-compose.prod.yml exec backend npx tsx prisma/seed.ts
# หรือถ้าไม่อยากได้ข้อมูลตัวอย่าง ให้สร้าง ADMIN คนแรกเองด้วย SQL/สคริปต์
```
> ⚠️ **production จริงไม่ควรรัน seed ตัวอย่าง** (มันลบข้อมูลทั้งหมดแล้วใส่ข้อมูล demo) —
> ใช้เฉพาะตอน staging/ทดลอง. สำหรับ prod ให้สร้างผู้ใช้ ADMIN คนแรกด้วยสคริปต์เฉพาะ

ชี้โดเมน + ใส่ HTTPS ด้วย reverse proxy หน้าสุด (Caddy/Traefik/nginx + certbot) ชี้ไปที่พอร์ต 80 ของ dashboard

---

## ตัวเลือก B — แยกบริการ (PaaS)

**Backend** (Render / Railway / Fly.io):
- ใช้ `backend/Dockerfile` (มีอยู่แล้ว) หรือ build command `npm run build`, start `npm start`
- ตั้ง env ตาม `backend/.env.production.example`
- release/predeploy command: `npx prisma migrate deploy`
- เปิด health check ที่ `GET /api/health`

**Dashboard** (Vercel / Netlify / Cloudflare Pages):
- Root = `dashboard/`, build `npm run build`, output `dist`
- ตั้ง env **`VITE_API_URL=https://api.yourdomain.com/api`** (ฝังตอน build)
- SPA rewrite มีให้แล้ว: `dashboard/vercel.json` (Vercel) และ `dashboard/public/_redirects` (Netlify)
- ตั้ง **`CORS_ORIGINS`** ฝั่ง backend ให้เป็นโดเมน dashboard (เพราะคนละ origin)

**MySQL**: ใช้ managed (RDS/Cloud SQL) แล้วนำ connection string ใส่ `DATABASE_URL`

---

## ⚙️ Environment variables (backend)

| ตัวแปร | จำเป็น | หมายเหตุ |
|---|---|---|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/yourfin_rider` |
| `JWT_SECRET` | ✅ | สุ่มยาว `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | — | ค่าเริ่มต้น `7d` |
| `GOOGLE_MAPS_API_KEY` | — | เว้นว่าง = ใช้ Haversine fallback |
| `CORS_ORIGINS` | ✅* | โดเมน dashboard (คั่นด้วย ,). *ไม่ต้องถ้า same-origin |
| `PUBLIC_BASE_URL` | ✅ | origin สาธารณะที่เสิร์ฟ `/uploads` (ใช้ทำ URL สลิป) |
| `NODE_ENV` | ✅ | `production` (เปิด trust proxy + ปิด log dev) |
| `PORT` | — | ค่าเริ่มต้น `4000` |

---

## 🔒 Security checklist ก่อนเปิดใช้จริง

- [ ] `JWT_SECRET` เป็นค่าสุ่มยาว (ไม่ใช่ค่า default)
- [ ] `CORS_ORIGINS` ล็อกเฉพาะโดเมน dashboard (ห้าม `*`)
- [ ] เสิร์ฟผ่าน **HTTPS** ทั้งหมด (reverse proxy + ใบรับรอง)
- [ ] **restrict Google Maps API key** (จำกัด API + IP/referrer) + ตั้ง budget alert
- [ ] **รูปสลิป/หน้าร้าน:** prod ที่สเกลหลาย instance ควรย้ายจาก local disk ไป **S3/GCS**
      (ตอนนี้เก็บใน volume `uploads_data` — เหมาะกับ single instance)
- [ ] เปลี่ยนรหัสผ่านบัญชี seed ทั้งหมด / ไม่รัน seed ตัวอย่างบน prod
- [ ] ตั้ง **backup ฐานข้อมูล** อัตโนมัติ + ทดสอบ restore
- [ ] **PDPA:** มีหนังสือแจ้ง/ขอความยินยอมการเก็บพิกัด GPS พนักงาน + ข้อมูลร้าน/บัญชี
- [ ] rate-limit (มีแล้ว 300 req/นาที/IP) — ปรับตามจริง; ตรวจว่า `trust proxy` ทำงาน (NODE_ENV=production)

---

## ✅ Smoke test หลัง deploy

```bash
# 1) API ตื่น
curl https://YOURDOMAIN/api/health
# {"status":"ok",...}

# 2) login ได้ + ได้ token
curl -s -X POST https://YOURDOMAIN/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@yourfin.co","password":"admin1234"}'

# 3) เปิด dashboard แล้ว refresh ที่ /users, /finance/slips ต้องไม่ 404 (SPA rewrite)
```
รันชุดทดสอบ regression เต็ม (38 เคส) บน **staging/dev ที่ seed แล้ว** (อย่ารันทับข้อมูล prod จริง):
```bash
cd backend && API_URL=https://STAGING/api npm run test:e2e
```

---

## 📱 Mobile (Expo)

```bash
cd mobile
# ชี้ apiBaseUrl ไป production ใน app.json -> expo.extra.apiBaseUrl = https://YOURDOMAIN/api
npx eas build -p ios      # ต้องมีบัญชี Apple Developer
npx eas build -p android
```
ดูเพิ่มที่ `mobile/README.md`

---

## หมายเหตุการสเกล

- ปัจจุบันเหมาะกับ **single backend instance** (รูปอยู่ใน volume). หากต้องสเกลแนวนอน:
  ย้ายรูปไป object storage, และอย่ารัน `migrate deploy` พร้อมกันหลาย instance (ใช้ release step เดียว)
- Distance Matrix คิดเป็น element ต่อการเรียก — ติดตามต้นทุนใน GCP, มี Haversine fallback ถ้าคีย์ล่ม
