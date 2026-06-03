# 05 — สูตรสรุปยอดรายวันใน Google Sheets

สูตรเหล่านี้คำนวณ "สด" ทันทีที่ข้อมูลเข้า เหมาะกับ near real-time
(ทางเลือก: ใช้ `buildDailySummary()` ใน Apps Script เมื่อข้อมูลเยอะจนสูตรหน่วง — ดู `docs/04`)

> อ้างอิงเลย์เอาต์คอลัมน์ `Activity_Log` ตาม [`02-data-model.md`](02-data-model.md):
> `D=event_type, F=work_date, L=visit_status, Q=leg_distance_km`
>
> ⚠️ ตรวจ Time zone ไฟล์ = **Bangkok** และ `work_date`/`visit_status` ต้องเป็นชนิด Date/ข้อความตรงเป๊ะ

---

## 5.1 Scorecard "วันนี้" (ใส่ในแท็บ Dashboard หรือมุมบนของ Sheet)

```excel
ยอดปิดดีลวันนี้      =COUNTIFS(Activity_Log!F:F, TODAY(), Activity_Log!L:L, "สำเร็จ")
จำนวนเข้าพบวันนี้     =COUNTIFS(Activity_Log!F:F, TODAY(), Activity_Log!D:D, "CHECK_IN")
รอตัดสินใจวันนี้      =COUNTIFS(Activity_Log!F:F, TODAY(), Activity_Log!L:L, "รอตัดสินใจ")
ปฏิเสธวันนี้         =COUNTIFS(Activity_Log!F:F, TODAY(), Activity_Log!L:L, "ปฏิเสธ")
ระยะทางรวมวันนี้(กม.) =SUMIFS(Activity_Log!Q:Q, Activity_Log!F:F, TODAY())
Conversion วันนี้    =IFERROR(
                        COUNTIFS(Activity_Log!F:F,TODAY(),Activity_Log!L:L,"สำเร็จ") /
                        COUNTIFS(Activity_Log!F:F,TODAY(),Activity_Log!D:D,"CHECK_IN"), 0)
```

> 💡 `SUMIFS` ระยะทางไม่กรอง `event_type` จึงรวมทุก leg ของวันนั้น (รวมขาที่ออกจากจุด Clock-in
> และขากลับถ้ามี CLOCK_OUT)

---

## 5.2 ตารางสรุป "ต่อวัน" (ทั้งทีม) — แท็บ `Daily_Summary`

วางที่ `A1` เป็นหัวตาราง แล้วใส่สูตรที่ `A2`:

```excel
A2 (วันทำงาน):  =SORT(UNIQUE(FILTER(Activity_Log!F2:F, Activity_Log!F2:F<>"")), 1, FALSE)
```
จากนั้นคอลัมน์ถัดไป (ลากลงให้ครอบคลุมจำนวนวัน หรือใช้ ARRAYFORMULA):

```excel
B2 เข้าพบ:     =IF($A2="","", COUNTIFS(Activity_Log!$F:$F,$A2, Activity_Log!$D:$D,"CHECK_IN"))
C2 สำเร็จ:     =IF($A2="","", COUNTIFS(Activity_Log!$F:$F,$A2, Activity_Log!$L:$L,"สำเร็จ"))
D2 รอตัดสินใจ:  =IF($A2="","", COUNTIFS(Activity_Log!$F:$F,$A2, Activity_Log!$L:$L,"รอตัดสินใจ"))
E2 ปฏิเสธ:     =IF($A2="","", COUNTIFS(Activity_Log!$F:$F,$A2, Activity_Log!$L:$L,"ปฏิเสธ"))
F2 ระยะทาง(กม.): =IF($A2="","", SUMIFS(Activity_Log!$Q:$Q, Activity_Log!$F:$F,$A2))
G2 Conversion:  =IF($A2="","", IFERROR(C2/B2, 0))
```

---

## 5.3 ตารางสรุป "ต่อวัน × ต่อเซลล์" (ใช้ประเมินรายบุคคล)

สร้างคีย์ไม่ซ้ำของ (วัน, อีเมล, ชื่อ) แล้วนับด้วยเงื่อนไขคู่:

```excel
A2 (วัน|อีเมล|ชื่อ):
=SORT(
  UNIQUE(
    FILTER({Activity_Log!F2:F, Activity_Log!B2:B, Activity_Log!C2:C},
           Activity_Log!F2:F<>"")
  ), 1, FALSE)
```
สมมติผลลัพธ์อยู่คอลัมน์ `A`(วัน) `B`(อีเมล) `C`(ชื่อ) แล้วต่อด้วย:

```excel
D2 เข้าพบ:   =IF($A2="","", COUNTIFS(Activity_Log!$F:$F,$A2, Activity_Log!$B:$B,$B2, Activity_Log!$D:$D,"CHECK_IN"))
E2 สำเร็จ:   =IF($A2="","", COUNTIFS(Activity_Log!$F:$F,$A2, Activity_Log!$B:$B,$B2, Activity_Log!$L:$L,"สำเร็จ"))
F2 ระยะทาง:  =IF($A2="","", SUMIFS(Activity_Log!$Q:$Q, Activity_Log!$F:$F,$A2, Activity_Log!$B:$B,$B2))
G2 Conv.:    =IF($A2="","", IFERROR(E2/D2,0))
H2 เทียบเป้า: =IF($A2="","", E2 - IFERROR(LOOKUP($B2, Users!$A:$A, Users!$H:$H),0))
```
> `H2` เทียบยอดสำเร็จกับ `target_daily_close` ในแท็บ `Users` (บวก = เกินเป้า)

---

## 5.4 สรุปตามแบรนด์ (Samsung / Vivo / Oppo)

```excel
=QUERY(Activity_Log!A2:T,
  "select K, count(A), sum(Q)
   where D = 'CHECK_IN'
   group by K
   label K 'แบรนด์', count(A) 'จำนวนเข้าพบ', sum(Q) 'ระยะทางรวม(กม.)'", 0)
```

หรือยอด "ปิดสำเร็จ" แยกแบรนด์:
```excel
Samsung สำเร็จ =COUNTIFS(Activity_Log!K:K,"Samsung", Activity_Log!L:L,"สำเร็จ")
Vivo สำเร็จ    =COUNTIFS(Activity_Log!K:K,"Vivo",    Activity_Log!L:L,"สำเร็จ")
Oppo สำเร็จ    =COUNTIFS(Activity_Log!K:K,"Oppo",    Activity_Log!L:L,"สำเร็จ")
```

---

## 5.5 ข้อควรระวัง

- **ค่าภาษาไทยต้องตรงเป๊ะ** — `"สำเร็จ"`, `"รอตัดสินใจ"`, `"ปฏิเสธ"` (เว้นวรรค/ตัวสะกดต่างกัน = นับไม่เจอ)
- **`TODAY()` อิง Time zone ไฟล์** — ถ้าไฟล์เป็น UTC ตัวเลข "วันนี้" จะเพี้ยนช่วงดึก → ตั้งเป็น Bangkok
- ถ้า `work_date` หลุดมาเป็น *ข้อความ* (ไม่ใช่ Date) ให้ครอบ `DATEVALUE()` หรือแก้ชนิดคอลัมน์
- สูตร `COUNTIFS` ทั้งคอลัมน์ (`F:F`) สะดวกแต่หนักเมื่อข้อมูลแสนแถว → ตอนนั้นค่อยย้ายไป `buildDailySummary()`

ต่อด้วย → [`06-dashboard-looker.md`](06-dashboard-looker.md)
