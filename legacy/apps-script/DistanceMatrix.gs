/**
 * DistanceMatrix.gs
 * ตัวห่อ (wrapper) สำหรับเรียก Google Maps Distance Matrix API
 * คำนวณ "ระยะทางการขับขี่จริง" ระหว่างจุด A (ก่อนหน้า) และจุด B (ปัจจุบัน)
 *
 * เอกสารอ้างอิง:
 *   https://developers.google.com/maps/documentation/distance-matrix/overview
 *
 * หมายเหตุสถาปัตยกรรม:
 *   - คิดค่าบริการแบบ "element" = (จำนวน origins) x (จำนวน destinations)
 *   - การคำนวณแบบ "ทีละ leg" (1 origin x 1 destination = 1 element) ประหยัด element
 *     ที่สุดสำหรับเส้นทางต่อเนื่อง A→B→C เพราะถ้ายัด matrix รวมจะถูกคิด NxN element
 *   - มี CacheService กันการเรียกซ้ำสำหรับคู่พิกัดเดิม
 */

/**
 * คำนวณระยะทาง/เวลาขับขี่ระหว่างสองพิกัด
 * @param {{lat:number,lng:number}} origin จุดเริ่ม (A)
 * @param {{lat:number,lng:number}} dest   จุดปลาย (B)
 * @return {{ok:boolean, km:number, min:number, status:string}}
 */
function getDrivingDistance_(origin, dest) {
  const cache = CacheService.getScriptCache();
  const p = CONFIG.CACHE_PRECISION;
  const cacheKey = [
    'dm',
    origin.lat.toFixed(p), origin.lng.toFixed(p),
    dest.lat.toFixed(p), dest.lng.toFixed(p),
    CONFIG.TRAVEL_MODE
  ].join('|');

  const cached = cache.get(cacheKey);
  if (cached) {
    const c = JSON.parse(cached);
    return { ok: true, km: c.km, min: c.min, status: 'CACHE' };
  }

  const base = 'https://maps.googleapis.com/maps/api/distancematrix/json';
  const url = base +
    '?units=' + CONFIG.UNITS +
    '&mode=' + CONFIG.TRAVEL_MODE +
    '&origins=' + encodeURIComponent(origin.lat + ',' + origin.lng) +
    '&destinations=' + encodeURIComponent(dest.lat + ',' + dest.lng) +
    '&key=' + getApiKey_();

  let attempt = 0;
  while (attempt <= CONFIG.MAX_RETRY) {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = res.getResponseCode();
    let json;
    try {
      json = JSON.parse(res.getContentText());
    } catch (e) {
      return { ok: false, km: '', min: '', status: 'BAD_JSON_' + code };
    }

    const top = json.status;
    if (top === 'OVER_QUERY_LIMIT' || code === 429 || code >= 500) {
      // โดน rate limit / server error -> backoff แล้วลองใหม่
      attempt++;
      Utilities.sleep(Math.pow(2, attempt) * 500); // 1s, 2s, 4s, 8s...
      continue;
    }
    if (top !== 'OK') {
      return { ok: false, km: '', min: '', status: top || ('HTTP_' + code) };
    }

    const el = json.rows && json.rows[0] && json.rows[0].elements && json.rows[0].elements[0];
    if (!el || el.status !== 'OK') {
      // ZERO_RESULTS / NOT_FOUND ฯลฯ
      return { ok: false, km: '', min: '', status: (el && el.status) || 'NO_ELEMENT' };
    }

    const km = Math.round((el.distance.value / 1000) * 100) / 100; // เมตร -> กม. ทศนิยม 2
    const min = Math.round((el.duration.value / 60) * 10) / 10;     // วินาที -> นาที ทศนิยม 1

    cache.put(cacheKey, JSON.stringify({ km: km, min: min }), CONFIG.CACHE_TTL_SEC);
    return { ok: true, km: km, min: min, status: 'OK' };
  }

  return { ok: false, km: '', min: '', status: 'RETRY_EXCEEDED' };
}

/** ฟังก์ชันทดสอบเร็ว ๆ ว่า API key ใช้งานได้ (รันจาก editor) */
function testDistance() {
  // สยามพารากอน -> เซ็นทรัลเวิลด์ (ระยะสั้น ๆ ใน กทม.)
  const a = { lat: 13.7466, lng: 100.5347 };
  const b = { lat: 13.7466, lng: 100.5392 };
  const r = getDrivingDistance_(a, b);
  Logger.log(JSON.stringify(r));
}
