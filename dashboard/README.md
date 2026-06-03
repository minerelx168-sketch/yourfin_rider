# YourFin Rider — Executive Dashboard

แดชบอร์ดสำหรับผู้บริหาร/ผู้จัดการ ใช้ติดตามผลงานของเซลล์ภาคสนาม (sales riders)
แบบใกล้เคียงเรียลไทม์ ตามวัฒนธรรม **Zero-Meeting**

Built with **Vite + React + TypeScript**, `react-router-dom`, `recharts`,
และ `react-leaflet` (OpenStreetMap, ไม่ต้องใช้ API key)

---

## การติดตั้งและรัน

```bash
npm install        # ติดตั้ง dependencies
npm run dev        # โหมดพัฒนา (http://localhost:5173)
npm run build      # build สำหรับ production (tsc -b && vite build -> dist/)
npm run preview    # เปิดดูผล build จาก dist/
npm run lint       # ตรวจ ESLint
```

ต้องมี backend API รันอยู่ที่ `http://localhost:4000/api` (ดู `../backend`)

## Environment

ตั้งค่า base URL ของ API ผ่านตัวแปร `VITE_API_URL`
(ดูตัวอย่างใน [`.env.example`](./.env.example))

```bash
cp .env.example .env
# .env
VITE_API_URL=http://localhost:4000/api   # ค่า default ถ้าไม่ตั้ง
```

## บัญชีทดสอบ (ผู้จัดการ)

```
อีเมล:    manager@yourfin.co
รหัสผ่าน:  manager1234
```

> แดชบอร์ดเปิดให้เฉพาะ role `MANAGER` / `ADMIN` เท่านั้น
> ถ้าล็อกอินด้วยบัญชี `SALES` จะแสดงข้อความ "ไม่มีสิทธิ์เข้าถึง"

---

## หน้าต่างๆ (Pages)

| เส้นทาง | หน้า | รายละเอียด |
|---|---|---|
| `/login` | เข้าสู่ระบบ | อีเมล/รหัสผ่าน + แสดง error + hint บัญชีทดสอบ |
| `/` | **ภาพรวม** | Scorecards (เช็คอิน, ปิดดีล, Conversion %, ระยะทาง, เซลล์ที่ออกตรวจ, ร้านที่เยือน) + กราฟสัดส่วนแบรนด์ + กราฟแนวโน้มรายวัน |
| `/leaderboard` | **อันดับเซลล์** | ตารางจัดอันดับ (เรียงตามยอดปิดดีล) พร้อมแถบความคืบหน้าเทียบเป้า และไฮไลต์แถวที่ทำได้ตามเป้า |
| `/map` | **แผนที่** | หมุดวงกลมสีตามสถานะ (เขียว=SUCCESS, ส้ม=PENDING, แดง=REJECTED) บน OpenStreetMap + popup + legend |
| `/feed` | **กิจกรรมล่าสุด** | ฟีดกิจกรรมล่าสุด (ใหม่สุดก่อน) — เวลา, เซลล์, ประเภท event, ร้าน, สถานะ, ระยะทาง |

### ฟีเจอร์ทั่วทั้งระบบ
- **ตัวกรองช่วงวันที่** (global date-range filter) บนแถบบน — ค่าเริ่มต้น 7 วันล่าสุด
  พร้อมปุ่มลัด (วันนี้ / 7 วัน / 30 วัน) — ขับเคลื่อนข้อมูลทุกหน้า
- **Auto-refresh ทุก 60 วินาที** (polling) พร้อมป้าย "อัปเดตล่าสุด HH:mm:ss"
- จัดการสถานะ loading / error / empty ครบทุกหน้า
- สีของ status badge ตรงกับสีหมุดบนแผนที่

---

## โครงสร้างโค้ด

```
src/
  api/client.ts            # fetch wrapper, base URL จาก VITE_API_URL,
                           # แนบ Bearer token, ฟังก์ชัน typed ทุก endpoint
  types.ts                 # types ตรงตาม docs/API_CONTRACT.md
  auth/                    # AuthContext/Provider/useAuth + token store (localStorage)
  range/                   # global date-range context
  lastupdated/             # context ของเวลา "อัปเดตล่าสุด"
  hooks/usePolledData.ts   # generic data hook + polling 60s
  lib/                     # format (วัน/เวลา/ตัวเลข, ป้าย Thai) + status colors
  components/              # Layout, Scorecard, StatusBadge, DateRangeFilter, ...
  pages/                   # LoginPage, OverviewPage, LeaderboardPage, MapPage, FeedPage
```

API ทั้งหมดอ้างอิงตาม `../docs/API_CONTRACT.md`
