# 03 — Frontend: คู่มือสร้างแอป AppSheet (สำหรับเซลล์ไรเดอร์)

แอปนี้รองรับ iOS/Android, จับ GPS อัตโนมัติ, มีแผนที่หมุดสี, อัปโหลดรูป และทำงาน offline ได้

> ภาพรวม: AppSheet สร้างแอปจาก Google Sheet โดยตรง → ทุกการบันทึกกลายเป็นแถวใน `Activity_Log`

---

## 3.1 สร้างแอปและเชื่อมข้อมูล

1. ไปที่ https://www.appsheet.com → **Create ▸ App ▸ Start with existing data** → เลือก Google Sheet `YourFin Rider KPI`
2. เพิ่มทุกแท็บเป็น Table: `Activity_Log` (หลัก), `Users`, `Stores`, `Daily_Summary` *(read-only)*
3. ที่ `Data ▸ Columns` ของ `Activity_Log` ตั้งชนิดคอลัมน์ตาม [`02-data-model.md`](02-data-model.md)

---

## 3.2 ตั้งค่าคอลัมน์สำคัญ (Auto-capture GPS/เวลา/ผู้ใช้)

ที่ตาราง `Activity_Log` → `Data ▸ Columns` กำหนด **Initial value / App formula**:

| คอลัมน์ | ตั้งค่า | ผล |
|---|---|---|
| `activity_id` | Initial value: `UNIQUEID()` · ตั้งเป็น **Key** | รหัสอัตโนมัติ |
| `sales_email` | Initial value: `USEREMAIL()` · `Editable=FALSE` | รู้ว่าใครบันทึก |
| `sales_name` | App formula: `LOOKUP(USEREMAIL(), "Users", "sales_email", "sales_name")` | เติมชื่อให้เอง |
| `event_time` | Initial value: `NOW()` · `Editable=FALSE` | เวลาปัจจุบัน |
| `work_date` | Initial value: `TODAY()` · `Editable=FALSE` | วันทำงาน |
| `geo` | Type **LatLong** · Initial value: `HERE()` · `Editable=FALSE` | **จับพิกัดอัตโนมัติ** |
| `lat` | App formula: `LATITUDE([geo])` | แยก lat ให้ Looker |
| `lng` | App formula: `LONGITUDE([geo])` | แยก lng ให้ Looker |
| `calc_status` | Initial value: `"PENDING"` | ให้ backend มาคำนวณต่อ |
| `photo_url` | Type **Image** | อัปโหลดเข้า Drive อัตโนมัติ |
| `prev_lat`,`prev_lng`,`leg_distance_km`,`leg_duration_min`,`processed_at` | `Editable=FALSE` (Apps Script เขียน) | กันเซลล์แก้ |

> 📍 **HERE() vs ความแม่นยำ:** `HERE()` อ่านพิกัดตอนเปิดฟอร์ม ตั้ง `Editable=FALSE` เพื่อกันแก้มือ
> ถ้าต้องการกันปลอมพิกัด ให้ดูหัวข้อ 3.7

---

## 3.3 ปุ่ม "เริ่มงาน" (Clock-in) — กดทีเดียวจบ

สร้าง **Action** แบบ one-tap (ไม่ต้องเปิดฟอร์มยาว):

`Behavior ▸ Actions ▸ New Action`
- **Action name:** `เริ่มงาน (Clock-in)`
- **For a record of this table:** `Activity_Log`
- **Do this:** `Data: add a new row to another table using values from this row`
- **Table to add to:** `Activity_Log`
- **Set these columns:**
  - `event_type` = `"CLOCK_IN"`
  - `geo` = `HERE()`
  - `event_time` = `NOW()`
  - `work_date` = `TODAY()`
  - `sales_email` = `USEREMAIL()`
  - `calc_status` = `"PENDING"`
- **Prominence:** `Display prominently` → ปุ่มใหญ่หน้าแรก
- ใส่ไอคอน 🏍️ และสี เพื่อให้กดง่าย

> ทางเลือก: ทำเป็น **Form view** เฉพาะ Clock-in ก็ได้ ถ้าต้องการให้ยืนยันก่อนบันทึก

---

## 3.4 ฟอร์ม "เพิ่มข้อมูลการเข้าพบ" (Store Check-in)

สร้าง **Form view** สำหรับ `Activity_Log`:

`UX ▸ Views ▸ New View`
- **View name:** `เพิ่มข้อมูลการเข้าพบ`
- **View type:** `Form` · **For this data:** `Activity_Log`
- **Position:** ใส่ไว้ใน menu/center button
- ตั้งให้ฟอร์มนี้ตั้งค่า `event_type = "CHECK_IN"` อัตโนมัติ (ผ่าน Initial value หรือซ่อนคอลัมน์แล้ว set)

**ลำดับฟิลด์ในฟอร์ม (ให้กรอกไว):**
1. `store_name` *(ถ้าใช้ Master ให้เป็น Ref ไป `Stores` + ปุ่ม "เพิ่มร้านใหม่")*
2. `brand` (Enum → แสดงเป็นปุ่ม Buttons)
3. `visit_status` (Enum → Buttons: สำเร็จ / รอตัดสินใจ / ปฏิเสธ)
4. `photo_url` (Image → เปิดกล้องถ่ายหน้าร้าน)
5. `note` (ออปชัน)
6. `geo`, `event_time`, `work_date`, `sales_email`, `calc_status` → **ซ่อน** (auto)

> ใช้ `Show? = FALSE` กับฟิลด์ auto เพื่อให้ฟอร์มสั้น กรอกจบใน 15 วินาที

---

## 3.5 Map View — หมุดร้านแยกสีในแอป

**ขั้นที่ 1 — สร้าง virtual column สำหรับสี**
ที่ `Activity_Log` เพิ่มคอลัมน์ `Pin_Color` (Type: **Color**) ตั้ง **App formula**:

```
IFS(
  [event_type] = "CLOCK_IN", "Blue",
  [visit_status] = "สำเร็จ",      "Green",
  [visit_status] = "รอตัดสินใจ",  "Orange",
  [visit_status] = "ปฏิเสธ",      "Red",
  TRUE, "Grey"
)
```
> ตรงตามที่ต้องการ: 🟢 เขียว = ปิดดีลสำเร็จ, ⚪/Grey = เยือนแล้วยังไม่สำเร็จ
> (เสริม 🟠 รอตัดสินใจ, 🔴 ปฏิเสธ, 🔵 จุดเริ่มงาน)

**ขั้นที่ 2 — สร้าง Map view**
- **View type:** `Map` · **For this data:** `Activity_Log`
- **Map column:** `geo`
- **Color:** เลือกคอลัมน์ `Pin_Color`
- **Filter:** แสดงเฉพาะ `CHECK_IN` (และของวันนี้/ของฉัน) เช่นใช้ **slice**:
  `[event_type] = "CHECK_IN"` *(ดู slice ในข้อ 3.6)*

---

## 3.6 Slices + Security Filter (เซลล์เห็นของตัวเอง, ผู้จัดการเห็นทั้งทีม)

**Security filter** (ที่ `Data ▸ Tables ▸ Activity_Log ▸ Security filter`) — ลดข้อมูลที่ sync ลงเครื่อง:

```
OR(
  LOOKUP(USEREMAIL(), "Users", "sales_email", "role") <> "Sales",
  [sales_email] = USEREMAIL()
)
```
→ ถ้า role = Manager/Admin เห็นทุกแถว, ถ้าเป็น Sales เห็นเฉพาะของตัวเอง

**Slices ที่มีประโยชน์:**
- `My_Today_Checkins`: `AND([sales_email]=USEREMAIL(), [work_date]=TODAY(), [event_type]="CHECK_IN")`
- `Team_Today`: `[work_date]=TODAY()` (ให้ Manager ดู)

---

## 3.7 ความถูกต้องของ GPS / กันปลอมพิกัด (Anti-spoofing)

- ตั้ง `geo` เป็น `Editable=FALSE` + `Initial value=HERE()` เพื่อกันพิมพ์พิกัดเอง
- เปิด **Require image** สำหรับ `photo_url` ใน CHECK_IN → ได้รูปหน้าร้านเป็นหลักฐานคู่พิกัด
- (ออปชันเข้ม) เพิ่มคอลัมน์ตรวจระยะห่างระหว่าง `geo` กับ `Stores.lat/lng` ด้วย
  `DISTANCE([geo], LATLONG([store_lat],[store_lng]))` แล้วเตือนถ้าเกินรัศมีที่กำหนด
- AppSheet ใช้พิกัดจาก OS ของอุปกรณ์ (ควรประกาศใน PDPA notice — ดู `docs/07`)

---

## 3.8 เชื่อม Backend แบบเรียลไทม์ — AppSheet Bot ยิง webhook

ให้ Distance Matrix คำนวณทันทีที่มีเช็คอินใหม่:

`Automation ▸ Create Bot`
- **Event:** Data change · Table `Activity_Log` · **Adds only**
- **Condition:** `[event_type] = "CHECK_IN"`
- **Task:** `Call a webhook`
  - **URL:** `<Web app URL จาก Apps Script>` (ดู `docs/04`)
  - **HTTP method:** `POST`
  - **Body (JSON):**
    ```json
    { "secret": "<WEBHOOK_SECRET>", "activity_id": "<<[activity_id]>>" }
    ```
> ถ้า webhook พลาด ไม่เป็นไร — time trigger ใน Apps Script (ทุก 1 นาที) จะเก็บตกให้

---

## 3.9 Offline & UX

- เปิด **Offline use** (`Settings ▸ Offline/Sync`) → เซลล์บันทึกได้แม้สัญญาณหาย แล้ว sync เมื่อกลับมา
- ตั้ง **Sync ▸ Delayed sync = OFF** สำหรับงานนี้ (อยากให้ขึ้น dashboard ไว) หรือ ON ถ้าเน้นประหยัดเน็ต
- ทำหน้า **Dashboard view** ในแอปให้เซลล์เห็น KPI ตัวเอง (กระตุ้นยอด) เช่น count ของ slice `My_Today_Checkins`

ต่อด้วย → [`04-backend-apps-script.md`](04-backend-apps-script.md)
