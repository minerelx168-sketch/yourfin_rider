/**
 * DailySummary.gs — สร้างตารางสรุปรายวันด้วย Apps Script (ทางเลือกแทนสูตรใน Sheets)
 * ใช้เมื่อข้อมูลเริ่มเยอะจนสูตร ARRAYFORMULA/QUERY เริ่มหน่วง
 *
 * ผลลัพธ์เขียนลงแท็บ Daily_Summary โดยสรุปต่อ (วันทำงาน x เซลล์):
 *   total_checkins, success, pending, reject, total_distance_km, conversion_rate,
 *   first_event, last_event, active_hours
 *
 * รันได้ทั้งแบบ manual หรือผูก time-driven trigger ตอนปลายวัน (เช่น ทุกวัน 23:30)
 */
function buildDailySummary() {
  const src = getSheet_(CONFIG.ACTIVITY_SHEET);
  const values = src.getDataRange().getValues();
  if (values.length < 2) return;
  const H = indexHeaders_(values[0]);

  const map = {}; // key = workDate|email
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (String(r[H.event_type]).toUpperCase() !== CONFIG.EVENT.CHECK_IN &&
        String(r[H.event_type]).toUpperCase() !== CONFIG.EVENT.CLOCK_IN &&
        String(r[H.event_type]).toUpperCase() !== CONFIG.EVENT.CLOCK_OUT) {
      continue;
    }
    const date = fmtDate_(r[H.work_date] || r[H.event_time]);
    const email = String(r[H.sales_email] || '').toLowerCase();
    if (!date || !email) continue;
    const key = date + '|' + email;

    if (!map[key]) {
      map[key] = {
        date: date, email: email,
        name: r[H.sales_name] || '',
        checkins: 0, success: 0, pending: 0, reject: 0,
        dist: 0, first: null, last: null
      };
    }
    const g = map[key];
    const t = toTime_(r[H.event_time]);
    if (t) {
      if (g.first === null || t < g.first) g.first = t;
      if (g.last === null || t > g.last) g.last = t;
    }
    const dist = Number(r[H.leg_distance_km]);
    if (isFinite(dist)) g.dist += dist;

    if (String(r[H.event_type]).toUpperCase() === CONFIG.EVENT.CHECK_IN) {
      g.checkins++;
      const status = String(r[H.visit_status] || '').trim();
      if (status === 'สำเร็จ') g.success++;
      else if (status === 'รอตัดสินใจ') g.pending++;
      else if (status === 'ปฏิเสธ') g.reject++;
    }
  }

  const rows = Object.keys(map).sort().map(function (k) {
    const g = map[k];
    const conv = g.checkins ? Math.round((g.success / g.checkins) * 1000) / 1000 : 0;
    const hours = (g.first !== null && g.last !== null)
      ? Math.round(((g.last - g.first) / 3600000) * 100) / 100 : 0;
    return [
      g.date, g.email, g.name,
      g.checkins, g.success, g.pending, g.reject,
      Math.round(g.dist * 100) / 100, conv,
      g.first ? new Date(g.first) : '', g.last ? new Date(g.last) : '', hours
    ];
  });

  const header = ['work_date', 'sales_email', 'sales_name', 'total_checkins', 'success',
    'pending', 'reject', 'total_distance_km', 'conversion_rate',
    'first_event', 'last_event', 'active_hours'];

  const out = getSheet_(CONFIG.SUMMARY_SHEET);
  out.clearContents();
  out.getRange(1, 1, 1, header.length).setValues([header]);
  if (rows.length) out.getRange(2, 1, rows.length, header.length).setValues(rows);
  Logger.log('buildDailySummary: เขียนสรุป ' + rows.length + ' แถว');
}
