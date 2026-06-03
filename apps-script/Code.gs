/**
 * Code.gs — แกนหลังบ้าน (Backend Logic) ของ YourFin Rider KPI
 * ============================================================
 * หน้าที่:
 *   1) processPendingDistances()  : สแกนแถวที่ยังไม่คำนวณ (PENDING) แล้วเติม
 *      ระยะทางขับขี่จริง (กม.) ระหว่างจุดก่อนหน้า -> จุดปัจจุบัน ของเซลล์คนเดียวกันในวันเดียวกัน
 *   2) doPost(e)                  : endpoint สำหรับ AppSheet Bot (เรียกแบบเรียลไทม์เมื่อมีเช็คอินใหม่)
 *   3) setupTriggers()            : ติดตั้ง time-driven trigger (ตาข่ายกันพลาดทุก ๆ นาที)
 *
 * กลยุทธ์ทริกเกอร์ (ทำไมต้องมี 2 ชั้น):
 *   - AppSheet เขียนข้อมูลผ่าน Sheets API ซึ่ง "ไม่ทำให้ onEdit/onChange แบบ simple ทำงานเสมอไป"
 *   - จึงใช้แบบผสม: (ก) AppSheet Bot ยิง webhook มา doPost เพื่อความเรียลไทม์
 *                    (ข) time-driven trigger ทุก 1 นาที เก็บตกแถว PENDING ที่หลุด
 */

/** คอลัมน์ที่สคริปต์เป็นเจ้าของ (เขียนกลับ) — ต้องมีหัวตารางตรงตามนี้ใน Activity_Log */
const OWNED_COLS = ['prev_lat', 'prev_lng', 'leg_distance_km', 'leg_duration_min', 'calc_status', 'processed_at'];

/**
 * สแกนและคำนวณระยะทางสำหรับแถวที่ยังไม่ถูกประมวลผล
 * ปลอดภัยต่อการรันซ้ำ (idempotent): ประมวลผลเฉพาะแถวที่ calc_status ว่าง หรือ = PENDING
 */
function processPendingDistances() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('processPendingDistances: มีงานกำลังรันอยู่ ข้ามรอบนี้');
    return { processed: 0, skipped: true };
  }
  try {
    const sh = getSheet_(CONFIG.ACTIVITY_SHEET);
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return { processed: 0 };

    const H = indexHeaders_(values[0]);
    assertColumns_(H, ['sales_email', 'event_type', 'event_time', 'work_date', 'lat', 'lng', 'calc_status'].concat(OWNED_COLS));

    // ห่อแต่ละแถวพร้อมเลขแถวจริงใน sheet
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      rows.push({ r: values[i], sheetRow: i + 1 });
    }

    // หา "จุดก่อนหน้า" ของแต่ละแถว: เรียงตาม (เซลล์, วันทำงาน, เวลา) แล้วไล่ลำดับ
    const prevByRow = buildPrevMap_(rows, H);

    // เตรียมอาเรย์คอลัมน์ที่จะเขียนกลับ (เริ่มจากค่าปัจจุบันเพื่อไม่ทับของเดิม)
    const n = values.length - 1;
    const out = {};
    OWNED_COLS.forEach(c => {
      out[c] = [];
      for (let i = 1; i < values.length; i++) out[c].push([values[i][H[c]]]);
    });

    let processed = 0, errors = 0;
    const now = new Date();

    rows.forEach((o, i) => {
      const st = String(o.r[H.calc_status] || '').toUpperCase();
      if (st === CONFIG.STATUS.DONE || st === CONFIG.STATUS.SKIP || st === CONFIG.STATUS.ERROR) return;

      const prev = prevByRow[o.sheetRow];
      // จุดแรกของวัน (รวม Clock-in) ไม่มีจุดก่อนหน้า -> SKIP, ระยะ 0
      if (!prev) {
        out.prev_lat[i] = ['']; out.prev_lng[i] = [''];
        out.leg_distance_km[i] = [0]; out.leg_duration_min[i] = [0];
        out.calc_status[i] = [CONFIG.STATUS.SKIP]; out.processed_at[i] = [now];
        processed++;
        return;
      }

      const lat = Number(o.r[H.lat]), lng = Number(o.r[H.lng]);
      const plat = Number(prev.r[H.lat]), plng = Number(prev.r[H.lng]);
      out.prev_lat[i] = [isFinite(plat) ? plat : ''];
      out.prev_lng[i] = [isFinite(plng) ? plng : ''];

      if (![lat, lng, plat, plng].every(isFinite)) {
        out.leg_distance_km[i] = ['']; out.leg_duration_min[i] = [''];
        out.calc_status[i] = [CONFIG.STATUS.ERROR]; out.processed_at[i] = [now];
        errors++;
        return;
      }

      const dm = getDrivingDistance_({ lat: plat, lng: plng }, { lat: lat, lng: lng });
      if (dm.ok) {
        out.leg_distance_km[i] = [dm.km]; out.leg_duration_min[i] = [dm.min];
        out.calc_status[i] = [CONFIG.STATUS.DONE]; out.processed_at[i] = [now];
        processed++;
      } else {
        out.leg_distance_km[i] = ['']; out.leg_duration_min[i] = [''];
        out.calc_status[i] = [CONFIG.STATUS.ERROR + ':' + dm.status]; out.processed_at[i] = [now];
        errors++;
      }
    });

    // เขียนกลับทีละคอลัมน์ (รวม 6 ครั้ง) เพื่อประหยัดโควต้า Sheets
    OWNED_COLS.forEach(c => {
      sh.getRange(2, H[c] + 1, n, 1).setValues(out[c]);
    });

    Logger.log('processPendingDistances: เสร็จ ' + processed + ' แถว, error ' + errors + ' แถว');
    return { processed: processed, errors: errors };
  } finally {
    lock.releaseLock();
  }
}

/**
 * สร้างแผนที่ sheetRow -> แถวก่อนหน้า (ภายในกลุ่มเซลล์เดียวกัน + วันเดียวกัน)
 */
function buildPrevMap_(rows, H) {
  const sorted = rows.slice().sort(function (a, b) {
    const ka = groupKey_(a.r, H), kb = groupKey_(b.r, H);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return toTime_(a.r[H.event_time]) - toTime_(b.r[H.event_time]);
  });

  const prevByRow = {};
  let curKey = null, prev = null;
  sorted.forEach(function (o) {
    const k = groupKey_(o.r, H);
    if (k !== curKey) { curKey = k; prev = null; }
    prevByRow[o.sheetRow] = prev;
    prev = o;
  });
  return prevByRow;
}

function groupKey_(r, H) {
  return String(r[H.sales_email]).toLowerCase() + '|' + fmtDate_(r[H.work_date]);
}

/**
 * Web App endpoint สำหรับ AppSheet Automation (Call a webhook)
 * ตัวอย่าง payload (POST JSON): { "secret": "<WEBHOOK_SECRET>", "activity_id": "..." }
 * เราเพียงยืนยัน secret แล้วเรียก sweeper (มี LockService กันชนกันอยู่แล้ว)
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }
    const secret = getWebhookSecret_();
    if (secret && body.secret !== secret) {
      return jsonOut_({ ok: false, error: 'unauthorized' });
    }
    const result = processPendingDistances();
    return jsonOut_({ ok: true, result: result });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet() {
  // health check
  return jsonOut_({ ok: true, service: 'YourFin Rider KPI backend' });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** ติดตั้ง time-driven trigger ทุก 1 นาที (รันครั้งเดียวจาก editor) */
function setupTriggers() {
  // ลบทริกเกอร์เดิมของฟังก์ชันนี้กันซ้ำ
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processPendingDistances') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('processPendingDistances')
    .timeBased().everyMinutes(1).create();
  Logger.log('ติดตั้ง trigger ทุก 1 นาที เรียบร้อย');
}

/** สั่งคำนวณซ้ำเฉพาะแถวที่เคย ERROR (ล้างสถานะให้กลับเป็น PENDING) */
function retryErrors() {
  const sh = getSheet_(CONFIG.ACTIVITY_SHEET);
  const values = sh.getDataRange().getValues();
  const H = indexHeaders_(values[0]);
  const col = sh.getRange(2, H.calc_status + 1, values.length - 1, 1);
  const cur = col.getValues();
  for (let i = 0; i < cur.length; i++) {
    if (String(cur[i][0]).toUpperCase().indexOf(CONFIG.STATUS.ERROR) === 0) {
      cur[i][0] = CONFIG.STATUS.PENDING;
    }
  }
  col.setValues(cur);
  processPendingDistances();
}

/* ----------------------- helpers ----------------------- */

/** map ชื่อหัวตาราง -> ดัชนีคอลัมน์ (0-based) */
function indexHeaders_(headerRow) {
  const H = {};
  headerRow.forEach(function (name, i) {
    const k = String(name).trim();
    if (k) H[k] = i;
  });
  return H;
}

function assertColumns_(H, required) {
  const missing = required.filter(function (c) { return !(c in H); });
  if (missing.length) {
    throw new Error('แท็บ ' + CONFIG.ACTIVITY_SHEET + ' ขาดคอลัมน์: ' + missing.join(', '));
  }
}

/** แปลงค่าวันให้เป็นสตริง yyyy-MM-dd ตาม time zone ธุรกิจ */
function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.TZ, 'yyyy-MM-dd');
  if (!v) return '';
  // เผื่อ work_date มาเป็น datetime string
  const d = new Date(v);
  return isNaN(d) ? String(v) : Utilities.formatDate(d, CONFIG.TZ, 'yyyy-MM-dd');
}

function toTime_(v) {
  const d = (v instanceof Date) ? v : new Date(v);
  return isNaN(d) ? 0 : d.getTime();
}
