/**
 * Config.gs
 * ค่าคงที่และการตั้งค่ากลางของระบบ YourFin Rider KPI
 * --------------------------------------------------
 * - ห้าม hard-code API Key / Secret ลงในไฟล์นี้ ให้เก็บไว้ใน Script Properties แทน
 *   (Project Settings > Script Properties)
 *     MAPS_API_KEY   = <Google Maps Distance Matrix API key>
 *     WEBHOOK_SECRET = <สตริงลับสำหรับยืนยัน webhook จาก AppSheet>
 */

const CONFIG = {
  // ชื่อแท็บ (sheet tab) ใน Google Sheets
  ACTIVITY_SHEET: 'Activity_Log',
  SUMMARY_SHEET: 'Daily_Summary',
  USERS_SHEET: 'Users',

  // Time zone ของธุรกิจ (ใช้ตอนคำนวณ work_date / รายงานรายวัน)
  TZ: 'Asia/Bangkok',

  // คีย์ใน Script Properties
  PROP_MAPS_KEY: 'MAPS_API_KEY',
  PROP_WEBHOOK_SECRET: 'WEBHOOK_SECRET',

  // โหมดการเดินทางสำหรับ Distance Matrix: driving | walking | bicycling | transit
  TRAVEL_MODE: 'driving',

  // หน่วยวัด: metric (กม.) | imperial (ไมล์)
  UNITS: 'metric',

  // หากเรียก API ติด OVER_QUERY_LIMIT จะ retry กี่ครั้ง (exponential backoff)
  MAX_RETRY: 4,

  // ปัดพิกัดกี่ตำแหน่งทศนิยมตอนทำ cache key (5 ตำแหน่ง ≈ ความละเอียด ~1.1 เมตร)
  CACHE_PRECISION: 5,

  // อายุ cache ของผลลัพธ์ระยะทาง (วินาที) — ลดการเรียก API ซ้ำสำหรับ leg เดิม
  CACHE_TTL_SEC: 6 * 60 * 60,

  // สถานะการคำนวณในคอลัมน์ calc_status
  STATUS: {
    PENDING: 'PENDING', // ยังไม่ได้คำนวณ (ค่าเริ่มต้นจาก AppSheet)
    DONE: 'DONE',       // คำนวณระยะทางสำเร็จ
    SKIP: 'SKIP',       // ไม่ต้องคำนวณ (เป็นจุดแรกของวัน / Clock-in)
    ERROR: 'ERROR'      // คำนวณไม่สำเร็จ (พิกัดผิด / API error)
  },

  // ประเภท event ในคอลัมน์ event_type
  EVENT: {
    CLOCK_IN: 'CLOCK_IN',
    CHECK_IN: 'CHECK_IN',
    CLOCK_OUT: 'CLOCK_OUT'
  }
};

/** อ่าน Google Maps API key จาก Script Properties */
function getApiKey_() {
  const key = PropertiesService.getScriptProperties().getProperty(CONFIG.PROP_MAPS_KEY);
  if (!key) {
    throw new Error('ไม่พบ ' + CONFIG.PROP_MAPS_KEY + ' ใน Script Properties — กรุณาตั้งค่า Google Maps API key ก่อน');
  }
  return key;
}

/** อ่าน webhook secret (ใช้ยืนยันคำขอจาก AppSheet) */
function getWebhookSecret_() {
  return PropertiesService.getScriptProperties().getProperty(CONFIG.PROP_WEBHOOK_SECRET) || '';
}

/** ดึง sheet ตามชื่อ พร้อม error ที่อ่านง่าย */
function getSheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแท็บชื่อ "' + name + '" ใน Spreadsheet นี้');
  return sh;
}
