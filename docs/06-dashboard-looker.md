# 06 — Dashboard ผู้บริหาร (Looker Studio)

เป้าหมาย: ผู้บริหารเปิดดูเองได้ตลอดเวลา (Zero-Meeting) — ยอดปิดคู่ค้ารายวัน, ระยะทางรวม,
Coverage Map และ Conversion Rate

---

## 6.1 ต่อแหล่งข้อมูล (Data Source)

1. https://lookerstudio.google.com → **Create ▸ Data source ▸ Google Sheets**
2. เลือกไฟล์ `YourFin Rider KPI` → แท็บ **`Activity_Log`** (แหล่งหลัก)
   - ติ๊ก **Use first row as headers**
3. ตั้งชนิดฟิลด์ให้ถูก:
   - `event_time`, `processed_at` → **Date & Time**
   - `work_date` → **Date**
   - `lat` → **Geo ▸ Latitude**, `lng` → **Geo ▸ Longitude**
   - `leg_distance_km`, `leg_duration_min` → **Number**
4. ตั้ง **Data freshness** (ไอคอนแหล่งข้อมูล) = **15 minutes** (ต่ำสุดของ Sheets connector)

> ออปชัน: เพิ่มแหล่งที่สองจากแท็บ `Daily_Summary` สำหรับกราฟที่ pre-aggregate แล้ว (เบากว่า)

---

## 6.2 สร้าง Calculated Fields (ฟิลด์คำนวณ)

ที่ Data source → **Add a field**:

```sql
-- ธงนับเช็คอิน
CheckinFlag        = CASE WHEN event_type = "CHECK_IN" THEN 1 ELSE 0 END

-- ธงปิดสำเร็จ
SuccessFlag        = CASE WHEN visit_status = "สำเร็จ" THEN 1 ELSE 0 END

-- พิกัดรวมสำหรับแผนที่ (ชนิด Geo ▸ Latitude, Longitude)
geo_point          = CONCAT(CAST(lat AS TEXT), ",", CAST(lng AS TEXT))

-- ป้ายสีสถานะ (ใช้เป็น Dimension สีบนแผนที่/กราฟ)
status_label       = CASE
                       WHEN event_type = "CLOCK_IN" THEN "เริ่มงาน"
                       WHEN visit_status = "สำเร็จ" THEN "ปิดดีลสำเร็จ"
                       WHEN visit_status = "รอตัดสินใจ" THEN "รอตัดสินใจ"
                       WHEN visit_status = "ปฏิเสธ" THEN "ปฏิเสธ"
                       ELSE "เยือนแล้ว"
                     END
```

**Conversion Rate** ทำเป็น metric ระดับ chart (Add metric ▸ Create field):
```sql
Conversion Rate = SUM(SuccessFlag) / SUM(CheckinFlag)
```
ตั้งรูปแบบเป็น **Percent**

---

## 6.3 เลย์เอาต์แดชบอร์ดที่แนะนำ

```
┌───────────────────────────── แถบฟิลเตอร์บนสุด ─────────────────────────────┐
│  [ช่วงวันที่ ▾]   [เซลล์ ▾]   [แบรนด์ ▾]   [พื้นที่/region ▾]                  │
├───────────────┬───────────────┬───────────────┬───────────────────────────┤
│ Scorecard     │ Scorecard     │ Scorecard     │ Scorecard                  │
│ ปิดดีลวันนี้   │ เข้าพบวันนี้   │ ระยะทางรวม กม. │ Conversion Rate %          │
├───────────────┴───────────────┴───────────────┴───────────────────────────┤
│  Time series: แนวโน้มยอดปิดดีล/เข้าพบ รายวัน      │  Bar: ยอดสำเร็จแยกเซลล์   │
├───────────────────────────────────────────────────┼───────────────────────┤
│  🗺️  COVERAGE MAP (Google Maps Bubble)            │  Pie: สัดส่วนแบรนด์      │
│      หมุด/ฟอง สีตาม status_label                   │  Table: สรุปต่อเซลล์      │
└───────────────────────────────────────────────────┴───────────────────────┘
```

### Scorecards
| การ์ด | Metric | ตั้งค่า |
|---|---|---|
| ปิดดีลวันนี้ | `SUM(SuccessFlag)` | filter ช่วงวันที่ = Today |
| เข้าพบวันนี้ | `SUM(CheckinFlag)` | — |
| ระยะทางรวม (กม.) | `SUM(leg_distance_km)` | — |
| Conversion Rate | `Conversion Rate` | format % |

### Time series (แนวโน้มรายวัน)
- Dimension: `work_date` · Metrics: `SUM(SuccessFlag)`, `SUM(CheckinFlag)`

### Bar chart (รายเซลล์)
- Dimension: `sales_name` · Metric: `SUM(SuccessFlag)` · เรียงมาก→น้อย

---

## 6.4 🗺️ Coverage Map (แผนที่ครอบคลุมพื้นที่)

1. **Add a chart ▸ Google Maps ▸ Bubble map**
2. **Location:** ฟิลด์ `geo_point` (ชนิด Geo ▸ Latitude,Longitude)
3. **Color dimension:** `status_label` → กำหนดสี: ปิดดีลสำเร็จ=เขียว, เยือนแล้ว=เทา, รอตัดสินใจ=ส้ม, ปฏิเสธ=แดง
4. **Bubble size:** (ออปชัน) `Record Count` หรือ `SUM(leg_distance_km)`
5. **Filter:** ใส่ `CheckinFlag = 1` เพื่อโชว์เฉพาะการเข้าพบร้าน

> ถ้า Google Maps viz ไม่ขึ้น ให้ตรวจว่า `lat`/`lng` ถูกตั้งชนิด Geo และ `geo_point` ไม่มีช่องว่าง/ค่าว่าง

---

## 6.5 ฟิลเตอร์และการแชร์

- เพิ่ม **Date range control** (ดีฟอลต์ = This month หรือ Today)
- เพิ่ม **Drop-down**: `sales_name`, `brand`, `region`
- **แชร์แบบดูอย่างเดียว** ให้ผู้บริหาร (`Share ▸ เพิ่มอีเมล ▸ Viewer`) — ผู้บริหารไม่ต้องแตะ Sheet
- ตั้ง **Email delivery** ส่ง snapshot รายเช้า (ออปชัน) ตอกย้ำวัฒนธรรม Zero-Meeting

---

## 6.6 ความสดของข้อมูล (จัดการความคาดหวัง)

- Looker + Sheets connector cache อย่างน้อย ~15 นาที → ตัวเลข "near real-time"
- ปุ่ม **Refresh data** บังคับดึงใหม่ได้ทันทีตอนต้องการ
- ถ้าต้องการสดกว่านี้และสเกลใหญ่ขึ้น → ย้าย pipeline ไป **BigQuery** (ดู `docs/01 ▸ 1.8`)

ต่อด้วย → [`07-security-pdpa-cost.md`](07-security-pdpa-cost.md)
