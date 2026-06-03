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
| `Role` | `SALES`, `MANAGER`, `ADMIN` |
| `EventType` | `CLOCK_IN`, `CHECK_IN`, `CLOCK_OUT` |
| `Brand` | `SAMSUNG`, `VIVO`, `OPPO`, `XIAOMI`, `REALME`, `APPLE`, `OTHER` |
| `VisitStatus` | `SUCCESS`, `PENDING`, `REJECTED` |
| `PartnerStatus` | `PROSPECT`, `ACTIVE`, `CLOSED` |
| `CalcStatus` | `PENDING`, `DONE`, `SKIP`, `ERROR` |

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
  "role": "SALES", "active": true, "targetDailyClose": 4,
  "photoUrl": null, "createdAt": "ISO"
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
- `PATCH /users/:id` → `{ name?, phone?, team?, region?, role?, active?, targetDailyClose? }` → `{ "user": User }`

---

## หมุดสีบนแผนที่ (convention)

| `visitStatus` | สี | ความหมาย |
|---|---|---|
| `SUCCESS` | 🟢 เขียว | ปิดดีล/เปิดคู่ค้าสำเร็จ |
| `PENDING` | 🟠 ส้ม | รอตัดสินใจ |
| `REJECTED` | 🔴 แดง | ปฏิเสธ |
