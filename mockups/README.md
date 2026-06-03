# Mockups — YourFin Rider

ภาพดีไซน์หน้าจอ (mockup) ของแอป สี/ฟอนต์/ป้ายสถานะอ้างอิงจากธีมจริงในโค้ด
(`mobile/src/theme.ts`, `dashboard/src/lib/status.ts`) และข้อมูลตัวอย่างจาก seed

| ไฟล์ | คำอธิบาย |
|---|---|
| `yourfin-rider-mockup.html` | ไฟล์ต้นฉบับ — เปิดในเบราว์เซอร์เพื่อดูแบบเต็มความคมชัด (self-contained) |
| `mockup-mobile.png` | แอปเซลล์ 5 หน้าจอ: เข้าสู่ระบบ · หน้าหลัก · เช็คอินร้าน · แผนที่ · โปรไฟล์ |
| `mockup-dashboard.png` | แดชบอร์ดผู้บริหาร: scorecards · กราฟแนวโน้ม · สัดส่วนแบรนด์ · จัดอันดับ · Coverage Map |

> นี่คือ **mockup ดีไซน์** ไม่ใช่สกรีนช็อตจากแอปที่รัน — ใช้สื่อสารหน้าตา/ฟลоว์
> โค้ดแอปจริงอยู่ที่ `mobile/` และ `dashboard/` (รันตาม README หลัก)

## สร้างรูปใหม่จาก HTML (ออปชัน)

ต้องมี Node.js:

```bash
cd /tmp && npm i puppeteer        # ดาวน์โหลด Chromium
# แล้วรันสคริปต์ screenshot ที่โหลด mockups/yourfin-rider-mockup.html
# ตั้ง viewport + deviceScaleFactor=2 แล้ว page.screenshot()
```
