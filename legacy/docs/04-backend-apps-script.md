# 04 — Backend: Google Apps Script + Distance Matrix API

โค้ดอยู่ในโฟลเดอร์ [`apps-script/`](../apps-script/) — คัดลอกไปวางใน Apps Script project ของ Sheet

---

## 4.1 เตรียม Google Cloud + Distance Matrix API

1. ไปที่ https://console.cloud.google.com → สร้าง/เลือก **Project** (เช่น `yourfin-rider-kpi`)
2. **APIs & Services ▸ Library** → เปิดใช้ **Distance Matrix API**
   *(ของใหม่จะชวนไป **Routes API** ได้เช่นกัน — ดูข้อ 4.8)*
3. **Billing** → ผูกบัตร/บัญชีจ่ายเงิน (จำเป็น แม้จะมี free tier)
4. **APIs & Services ▸ Credentials ▸ Create credentials ▸ API key**
5. **จำกัดสิทธิ์ API key (สำคัญมากด้านความปลอดภัย):**
   - **API restrictions:** เลือกเฉพาะ `Distance Matrix API`
   - **Application restrictions:** เนื่องจากเรียกจากเซิร์ฟเวอร์ Apps Script (IP ของ Google ไม่คงที่)
     ให้พึ่ง *API restriction* เป็นหลัก และ **เก็บคีย์ใน Script Properties เท่านั้น** (ห้าม commit ลงโค้ด)

---

## 4.2 วางโค้ดและตั้งค่า

1. เปิด Sheet → `Extensions ▸ Apps Script`
2. สร้างไฟล์ให้ตรงกับในรีโป แล้ววางเนื้อหา:
   - `Config.gs`, `DistanceMatrix.gs`, `Code.gs`, `DailySummary.gs`
   - ตั้งค่า manifest ตาม `appsscript.json` (เปิด `Project Settings ▸ Show "appsscript.json"`)
3. **Project Settings ▸ Script Properties ▸ Add property:**
   | Property | Value |
   |---|---|
   | `MAPS_API_KEY` | *(API key จากข้อ 4.1)* |
   | `WEBHOOK_SECRET` | *(สุ่มสตริงยาว ๆ เช่นจาก password generator)* |
4. ตรวจว่า Sheet มีแท็บ `Activity_Log` หัวตารางครบตาม `02-data-model.md`

---

## 4.3 ทดสอบทีละชั้น

1. รัน `testDistance()` → ดู `View ▸ Logs` ควรได้ `{"ok":true,"km":...}` = API key ใช้ได้
2. ใส่ข้อมูลทดสอบ 2–3 แถว (CLOCK_IN + CHECK_IN) ที่ `calc_status=PENDING`
3. รัน `processPendingDistances()` → คอลัมน์ `leg_distance_km`, `calc_status=DONE` ควรถูกเติม
   - แถว `CLOCK_IN`/แถวแรกของวัน → `calc_status=SKIP`, ระยะ 0
4. ครั้งแรกจะมีป๊อปอัป **ขออนุญาตสิทธิ์ (OAuth)** → กด Allow

---

## 4.4 ติดตั้ง Time-driven Trigger (ตาข่ายกันพลาด)

รัน `setupTriggers()` หนึ่งครั้ง → ระบบสร้าง trigger เรียก `processPendingDistances()` **ทุก 1 นาที**

ตรวจได้ที่เมนู `Triggers (นาฬิกาซ้ายมือ)` ควรเห็น 1 รายการ

> ปรับความถี่ได้ใน `setupTriggers()` (เช่น `everyMinutes(5)` ถ้าอยากประหยัดโควต้า execution)

---

## 4.5 Deploy เป็น Web App (สำหรับ AppSheet webhook เรียลไทม์)

1. `Deploy ▸ New deployment ▸ Type = Web app`
2. ตั้งค่า:
   - **Execute as:** `Me` (เจ้าของสคริปต์)
   - **Who has access:** `Anyone` *(เพราะ AppSheet เรียกแบบ anonymous — เราป้องกันด้วย `WEBHOOK_SECRET` ในโค้ดแล้ว)*
3. กด Deploy → คัดลอก **Web app URL**
4. เอา URL ไปใส่ใน AppSheet Bot (`docs/03 ▸ 3.8`)
5. ทดสอบ: เปิด URL ด้วย browser ควรเห็น `{"ok":true,"service":...}` (จาก `doGet`)

> ⚠️ ทุกครั้งที่แก้โค้ดแล้วอยากให้ webhook ใช้เวอร์ชันใหม่ ต้อง **Deploy ▸ Manage deployments ▸ Edit ▸ New version**

---

## 4.6 อธิบายการทำงานของโค้ด (ย่อ)

| ฟังก์ชัน | ไฟล์ | หน้าที่ |
|---|---|---|
| `processPendingDistances()` | `Code.gs` | สแกนแถว PENDING → หาจุดก่อนหน้า → เรียก Distance Matrix → เขียนกลับ (มี `LockService` กันชน) |
| `buildPrevMap_()` | `Code.gs` | จัดกลุ่ม (เซลล์+วัน) เรียงเวลา หา "จุดก่อนหน้า" ของทุกแถว |
| `getDrivingDistance_()` | `DistanceMatrix.gs` | เรียก API + cache + exponential backoff เมื่อ rate limit |
| `doPost()` / `doGet()` | `Code.gs` | endpoint webhook (ยืนยัน secret) / health check |
| `setupTriggers()` | `Code.gs` | สร้าง time trigger ทุก 1 นาที |
| `retryErrors()` | `Code.gs` | รีเซ็ตแถว ERROR → PENDING แล้วคำนวณใหม่ |
| `buildDailySummary()` | `DailySummary.gs` | สรุปรายวันด้วยสคริปต์ (ทางเลือกแทนสูตร) |

**คุณสมบัติเด่นของโค้ด:**
- 🔁 **Idempotent** — ประมวลผลเฉพาะ blank/`PENDING` ไม่คิดเงิน API ซ้ำ
- 🗺️ **อ้างชื่อหัวตาราง** (`indexHeaders_`) — สลับลำดับคอลัมน์ได้โดยไม่พัง
- 💾 **Cache** ผลลัพธ์ leg เดิม ลดการเรียก API
- 🔒 **Lock** กัน webhook กับ time trigger ทำงานชนกัน
- ⏱️ **Backoff** เมื่อ `OVER_QUERY_LIMIT`

---

## 4.7 โควต้าและต้นทุน (สรุป — ละเอียดใน `docs/07`)

- Distance Matrix คิดเป็น **element**; การคำนวณทีละ leg = 1 element/leg (ประหยัดสุดสำหรับเส้นทางต่อเนื่อง)
- Apps Script มีลิมิต *execution time/วัน* — งานสเกลนี้ห่างลิมิตมาก
- `UrlFetchApp` มีลิมิตจำนวนเรียก/วัน — cache ช่วยลดได้

---

## 4.8 หมายเหตุ: อนาคต = Routes API

Google แนะนำ **Routes API** (`computeRouteMatrix`) เป็นตัวสืบทอด Distance Matrix
ถ้าจะย้าย ให้แก้เฉพาะ `DistanceMatrix.gs ▸ getDrivingDistance_()` (เปลี่ยน endpoint/รูปแบบ request เป็น POST + field mask)
ส่วน `Code.gs`, `Looker`, `AppSheet` **ไม่ต้องแก้** — ประโยชน์ของการแยกชั้น (separation of concerns)

ต่อด้วย → [`05-sheets-formulas.md`](05-sheets-formulas.md)
