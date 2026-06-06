# YourFin Rider — API Contract

REST API ของระบบ ใช้ร่วมกันทั้ง **mobile app** (เซลล์) และ **dashboard** (ผู้บริหาร)

- Base URL (dev): `http://localhost:4000/api`
- Auth: `Authorization: Bearer <JWT>` ทุก endpoint ยกเว้น `POST /auth/login` และ `GET /health`
- Content-Type: `application/json` (ยกเว้นอัปโหลดรูปเป็น `multipart/form-data`)
- รูปแบบ error: `{ "error": string, "details"?: any }` พร้อม HTTP status ที่เหมาะสม

---

## Enums

| Enum | ค่า |
|---|---|
| `Role` | `SALES`, `MANAGER`, `FINANCE`, `ADMIN` |
| `EventType` | `CLOCK_IN`, `CHECK_IN`, `CLOCK_OUT` |
| `Brand` | `SAMSUNG`, `VIVO`, `OPPO`, `XIAOMI`, `REALME`, `APPLE`, `OTHER` |
| `VisitStatus` | `SUCCESS`, `PENDING`, `REJECTED` |
| `PartnerStatus` | `PROSPECT`, `ACTIVE`, `CLOSED` |
| `CalcStatus` | `PENDING`, `DONE`, `SKIP`, `ERROR` |
| `CommissionType` | `DEAL`, `REFERRAL`, `ADJUSTMENT` |
| `WithdrawalStatus` | `PENDING`, `APPROVED`, `REJECTED`, `PAID` |

---

## Auth

### `POST /auth/login`
Request: `{ "email": string, "password": string }`
Response `200`: `{ "token": string, "user": User }`

### `GET /auth/me`  (auth)
Response `200`: `{ "user": User }`

### `POST /auth/register`  (ADMIN)
Request: `{ email, password, name, phone?, team?, region?, role?, targetDailyClose? }`
Response `201`: `{ "user": User }`

**User object**
```jsonc
{
  "id": "cuid", "email": "x@y.co", "name": "สมชาย",
  "phone": null, "team": "Sales", "region": "กรุงเทพฯ",
  "role": "SALES", "active": true, "targetDailyClose": 4, "photoUrl": null,
  // คอมมิชชั่น & affiliate
  "commissionPerDeal": 250,        // คอมคงที่ต่อดีลที่ปิดได้ (บาท)
  "referralPercent": 5,            // % ที่ "ผู้แนะนำของฉัน" ได้รับต่อดีลในสายของฉัน
  "referredById": "cuid|null",     // ผู้แนะนำ (upline)
  "bankName": null, "bankAccountNumber": null, "bankAccountName": null,
  "createdAt": "ISO"
}
```

---

## Activities  (auth — ใช้โดยเซลล์)

### `POST /activities/clock-in`
Request: `{ "lat": number, "lng": number }`
Response `201`: `{ "activity": Activity }`

### `POST /activities/clock-out`
เหมือน clock-in

### `POST /activities/check-in`
Request:
```jsonc
{
  "lat": number, "lng": number,
  "storeName": string,                 // required
  "brand": Brand,                      // default OTHER
  "visitStatus": VisitStatus,          // required
  "storeId"?: string, "photoUrl"?: string, "note"?: string
}
```
Response `201`: `{ "activity": Activity }`
> backend จะคำนวณ `legDistanceKm`/`legDurationMin` จากจุดก่อนหน้าให้อัตโนมัติ

### `GET /activities/me/day?date=YYYY-MM-DD`
`date` ออปชัน (default = วันนี้, โซนเวลา Asia/Bangkok)
Response `200`:
```jsonc
{
  "workDate": "2026-06-03",
  "summary": {
    "checkins": 5, "success": 2, "pending": 2, "rejected": 1,
    "conversionRate": 40, "totalDistanceKm": 12.3,
    "clockedIn": true, "clockedOut": false
  },
  "activities": [ Activity, ... ]   // เรียงตามเวลา
}
```

**Activity object**
```jsonc
{
  "id":"cuid","userId":"cuid","eventType":"CHECK_IN",
  "eventTime":"ISO","workDate":"ISO","lat":13.75,"lng":100.50,
  "storeId":null,"storeName":"ร้าน A","brand":"SAMSUNG","visitStatus":"SUCCESS",
  "photoUrl":null,"note":null,
  "prevLat":13.74,"prevLng":100.49,"legDistanceKm":2.35,"legDurationMin":9.5,
  "calcStatus":"DONE","processedAt":"ISO","createdAt":"ISO","store":null
}
```

---

## Stores  (auth)

- `GET /stores?brand=&partnerStatus=&q=` → `{ "stores": Store[] }`
- `POST /stores` → `{ name, brand?, province?, district?, address?, lat?, lng?, partnerStatus?, ownerName?, ownerContact? }` → `201 { "store": Store }`
- `GET /stores/:id` → `{ "store": Store & { activities: [...] } }`

---

## Uploads  (auth)

### `POST /uploads`  — `multipart/form-data`, field `photo`
Response `201`: `{ "url": string, "filename": string, "size": number }`
> ใช้ก่อน check-in: อัปโหลดรูป → ได้ `url` → ส่งใน `photoUrl`

---

## Dashboard  (MANAGER / ADMIN)

ทุก endpoint รับ query `?from=YYYY-MM-DD&to=YYYY-MM-DD` (ออปชัน, default = 7 วันล่าสุด)

### `GET /dashboard/overview`
```jsonc
{
  "range":{"from":"2026-05-27","to":"2026-06-03"},
  "totalCheckins":178,"success":78,"pending":56,"rejected":44,
  "conversionRate":43.82,"totalDistanceKm":1728.43,
  "activeRiders":4,"storesVisited":8,
  "brandBreakdown":[{"brand":"REALME","count":41}, ...]
}
```

### `GET /dashboard/leaderboard`
```jsonc
{ "leaderboard": [
  { "userId":"...","name":"สมชาย","region":"...","team":"Sales",
    "targetDailyClose":4,"checkins":42,"success":23,"pending":10,
    "rejected":9,"conversionRate":54.76,"distanceKm":418.56 }
]}
```

### `GET /dashboard/timeseries`
```jsonc
{ "series": [ { "date":"2026-06-01","checkins":20,"success":9,"distanceKm":180.5 } ] }
```

### `GET /dashboard/map`
```jsonc
{ "points": [
  { "id":"...","lat":13.75,"lng":100.50,"storeName":"ร้าน A",
    "brand":"SAMSUNG","visitStatus":"SUCCESS","eventTime":"ISO","riderName":"สมชาย" }
]}
```

### `GET /dashboard/feed?limit=50`
```jsonc
{ "feed": [
  { "id":"...","riderName":"สมชาย","eventType":"CHECK_IN","storeName":"ร้าน A",
    "brand":"SAMSUNG","visitStatus":"SUCCESS","legDistanceKm":2.35,
    "lat":13.75,"lng":100.50,"eventTime":"ISO" }
]}
```

---

## Users  (ADMIN)

- `GET /users` → `{ "users": User[] }`
- `PATCH /users/:id` → ตั้งค่าทั่วไป + **คอม/affiliate**:
  `{ name?, phone?, team?, region?, role?, active?, targetDailyClose?,`
  ` commissionPerDeal?, referralPercent?, referredById?(string|null),`
  ` bankName?, bankAccountNumber?, bankAccountName? }` → `{ "user": User }`
  > ตั้ง `referredById` เพื่อผูกสายแนะนำ (affiliate). ระบบกันสายวน (ตอบ 400 ถ้าวน)

---

## Wallet & Withdrawals  (ไรเดอร์ — auth)

### `GET /wallet`
```jsonc
{
  "balance": { "totalEarned": 7928.4, "totalPaid": 600, "pending": 300, "available": 7028.4 },
  "settings": { "commissionPerDeal": 250, "referralPercent": 5, "referredById": null,
                "bankName": "กสิกรไทย", "bankAccountNumber": "...", "bankAccountName": "สมชาย ใจดี" },
  "earnedFromDeals": 7250, "earnedFromReferral": 678.4, "directReferrals": 2,
  "recentEntries": [ CommissionEntry, ... ]   // 30 ล่าสุด
}
```
**CommissionEntry**
```jsonc
{ "id":"...","userId":"...","type":"DEAL|REFERRAL|ADJUSTMENT","amount":250,"level":0,
  "sourceActivityId":"...","sourceUserId":"...","note":null,"createdAt":"ISO" }
```

### `POST /wallet/withdrawals`
Request: `{ "amount": number, "bankName"?, "bankAccountNumber"?, "bankAccountName"?, "note"? }`
- ตรวจ `amount` ≤ `available` (ไม่พอ → 400 พร้อม `details.available`)
Response `201`: `{ "withdrawal": Withdrawal }`

### `GET /wallet/withdrawals`
Response: `{ "withdrawals": Withdrawal[] }`  (ของฉัน เรียงล่าสุดก่อน)

**Withdrawal object**
```jsonc
{ "id":"...","userId":"...","amount":500,"status":"PENDING|APPROVED|REJECTED|PAID",
  "bankName":"...","bankAccountNumber":"...","bankAccountName":"...","note":null,
  "slipUrl":null,"adminNote":null,"processedById":null,
  "requestedAt":"ISO","processedAt":null,
  "user"?:{ "id","name","region","phone" } }   // user แนบมาเฉพาะ endpoint ของแอดมิน
```

---

## Admin — Withdrawals & Finance  (ADMIN / MANAGER / FINANCE)

> **role `FINANCE` (ผู้จัดการฝ่ายการเงิน):** เข้าถึงได้เฉพาะ endpoint ใต้หัวข้อนี้ +
> `POST /uploads` (สลิป) เท่านั้น — ถูกบล็อก (403) จาก `/dashboard/*`, `/users`, ตั้งค่า affiliate

### `GET /admin/finance/summary`
ภาพรวมการเงินสำหรับ FINANCE dashboard
```jsonc
{
  "pending":  { "count":2, "amount":550 },
  "approved": { "count":1, "amount":400 },
  "paid":     { "count":2, "amount":1100 },
  "rejected": { "count":1, "amount":150 },
  "paidToday":     { "count":1, "amount":600 },
  "paidThisMonth": { "count":1, "amount":600 },
  "recentPayouts": [
    { "id":"...","riderName":"สมชาย ใจดี","region":"...","amount":600,
      "bankName":"กสิกรไทย","slipUrl":"https://...","processedAt":"ISO" }
  ]
}
```

### `GET /admin/withdrawals?status=&from=YYYY-MM-DD&to=YYYY-MM-DD`
```jsonc
{
  "withdrawals": [ Withdrawal (มี user), ... ],   // เรียง PENDING ก่อน
  "summary": {
    "pending":  { "count":2, "amount":550 },
    "approved": { "count":1, "amount":400 },
    "paid":     { "count":2, "amount":1100 },
    "rejected": { "count":1, "amount":150 }
  }
}
```

### `PATCH /admin/withdrawals/:id`
Request: `{ "action": "APPROVE"|"REJECT"|"PAY", "slipUrl"?, "adminNote"? }`
- `APPROVE`: PENDING → APPROVED
- `REJECT`: PENDING/APPROVED → REJECTED
- `PAY`: PENDING/APPROVED → PAID — **ต้องมี `slipUrl`** (อัปโหลดรูปสลิปผ่าน `POST /uploads` ก่อน)
- เปลี่ยนสถานะที่ไม่อนุญาต → 409
Response: `{ "withdrawal": Withdrawal }`

> **คอมมิชชั่นเข้ากระเป๋าเมื่อไร:** ทุกครั้งที่บันทึก check-in สถานะ `SUCCESS` ระบบจะให้คอมฐาน
> `commissionPerDeal` แก่ไรเดอร์ แล้วไล่จ่ายค่าแนะนำขึ้นสายแนะนำ (สูงสุด 5 ชั้น):
> ผู้แนะนำชั้นที่ n ได้ = `คอมฐาน × (referralPercent ของโหนดชั้นล่าง) %`

---

## หมุดสีบนแผนที่ (convention)

| `visitStatus` | สี | ความหมาย |
|---|---|---|
| `SUCCESS` | 🟢 เขียว | ปิดดีล/เปิดคู่ค้าสำเร็จ |
| `PENDING` | 🟠 ส้ม | รอตัดสินใจ |
| `REJECTED` | 🔴 แดง | ปฏิเสธ |
