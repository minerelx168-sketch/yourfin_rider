/**
 * Seed data script for YourFin Rider
 * Run: node seed-data.mjs
 * 
 * Creates sample users, stores, and activities for testing
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('Connected to database');

  try {
    // ── Seed Users ─────────────────────────────────────────
    console.log('Seeding users...');
    const users = [
      { openId: 'sales-001', name: 'สมชาย ใจดี', email: 'somchai@yourfin.co', role: 'sales', team: 'ทีม A', region: 'กรุงเทพฯ', phone: '081-111-1111', targetDailyClose: 3 },
      { openId: 'sales-002', name: 'สมหญิง รักงาน', email: 'somying@yourfin.co', role: 'sales', team: 'ทีม A', region: 'กรุงเทพฯ', phone: '081-222-2222', targetDailyClose: 3 },
      { openId: 'sales-003', name: 'วิชัย เก่งมาก', email: 'wichai@yourfin.co', role: 'sales', team: 'ทีม B', region: 'ปริมณฑล', phone: '081-333-3333', targetDailyClose: 4 },
      { openId: 'sales-004', name: 'นิดา สู้งาน', email: 'nida@yourfin.co', role: 'sales', team: 'ทีม B', region: 'ปริมณฑล', phone: '081-444-4444', targetDailyClose: 3 },
      { openId: 'sales-005', name: 'ประเสริฐ ขยัน', email: 'prasert@yourfin.co', role: 'sales', team: 'ทีม C', region: 'ชลบุรี', phone: '081-555-5555', targetDailyClose: 3 },
      { openId: 'manager-001', name: 'ผู้จัดการ ทีมA', email: 'manager.a@yourfin.co', role: 'manager', team: 'ทีม A', region: 'กรุงเทพฯ', phone: '082-111-1111', targetDailyClose: 0 },
    ];

    for (const u of users) {
      await connection.execute(
        `INSERT INTO users (openId, name, email, role, team, region, phone, targetDailyClose, active, createdAt, updatedAt, lastSignedIn) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), team=VALUES(team), region=VALUES(region)`,
        [u.openId, u.name, u.email, u.role, u.team, u.region, u.phone, u.targetDailyClose]
      );
    }
    console.log(`  ✓ ${users.length} users seeded`);

    // ── Seed Stores ────────────────────────────────────────
    console.log('Seeding stores...');
    const stores = [
      { name: 'ร้านมือถือ สยาม', brand: 'SAMSUNG', province: 'กรุงเทพฯ', district: 'ปทุมวัน', lat: 13.7449, lng: 100.5341, partnerStatus: 'ACTIVE', ownerName: 'คุณสมศักดิ์' },
      { name: 'Vivo Shop อโศก', brand: 'VIVO', province: 'กรุงเทพฯ', district: 'วัฒนา', lat: 13.7378, lng: 100.5602, partnerStatus: 'ACTIVE', ownerName: 'คุณวิภา' },
      { name: 'OPPO Store เซ็นทรัลลาดพร้าว', brand: 'OPPO', province: 'กรุงเทพฯ', district: 'จตุจักร', lat: 13.8163, lng: 100.5617, partnerStatus: 'ACTIVE', ownerName: 'คุณอรุณ' },
      { name: 'Xiaomi สาขาบางนา', brand: 'XIAOMI', province: 'กรุงเทพฯ', district: 'บางนา', lat: 13.6672, lng: 100.6017, partnerStatus: 'PROSPECT', ownerName: 'คุณชัยวัฒน์' },
      { name: 'Samsung Experience ฟิวเจอร์พาร์ค', brand: 'SAMSUNG', province: 'ปทุมธานี', district: 'ธัญบุรี', lat: 13.9887, lng: 100.6162, partnerStatus: 'ACTIVE', ownerName: 'คุณมานะ' },
      { name: 'ร้านโทรศัพท์ นนทบุรี', brand: 'REALME', province: 'นนทบุรี', district: 'เมืองนนทบุรี', lat: 13.8621, lng: 100.5144, partnerStatus: 'PROSPECT', ownerName: 'คุณสุนีย์' },
      { name: 'Apple Premium Reseller สีลม', brand: 'APPLE', province: 'กรุงเทพฯ', district: 'บางรัก', lat: 13.7262, lng: 100.5237, partnerStatus: 'ACTIVE', ownerName: 'คุณธนา' },
      { name: 'มือถือถูก ชลบุรี', brand: 'OTHER', province: 'ชลบุรี', district: 'เมืองชลบุรี', lat: 13.3622, lng: 100.9847, partnerStatus: 'ACTIVE', ownerName: 'คุณพิชัย' },
      { name: 'Samsung Galaxy Store พัทยา', brand: 'SAMSUNG', province: 'ชลบุรี', district: 'บางละมุง', lat: 12.9236, lng: 100.8825, partnerStatus: 'PROSPECT', ownerName: 'คุณสมพร' },
      { name: 'Vivo Concept Store รังสิต', brand: 'VIVO', province: 'ปทุมธานี', district: 'ธัญบุรี', lat: 13.9656, lng: 100.6156, partnerStatus: 'ACTIVE', ownerName: 'คุณอนุชา' },
      { name: 'OPPO Shop สมุทรปราการ', brand: 'OPPO', province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ', lat: 13.5990, lng: 100.5998, partnerStatus: 'ACTIVE', ownerName: 'คุณวรรณา' },
      { name: 'Realme Store มีนบุรี', brand: 'REALME', province: 'กรุงเทพฯ', district: 'มีนบุรี', lat: 13.8129, lng: 100.7291, partnerStatus: 'CLOSED', ownerName: 'คุณเกษม' },
    ];

    for (const s of stores) {
      await connection.execute(
        `INSERT INTO stores (name, brand, province, district, lat, lng, partnerStatus, ownerName, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [s.name, s.brand, s.province, s.district, s.lat, s.lng, s.partnerStatus, s.ownerName]
      );
    }
    console.log(`  ✓ ${stores.length} stores seeded`);

    // ── Seed Activities (10 days, ~300+ records) ──────────
    console.log('Seeding activities...');
    
    // Get user IDs
    const [userRows] = await connection.execute('SELECT id, openId FROM users WHERE role = "sales"');
    const salesUsers = userRows;
    
    // Get store info
    const [storeRows] = await connection.execute('SELECT id, name, brand, lat, lng FROM stores');
    const storeList = storeRows;

    const visitStatuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'PENDING', 'REJECTED']; // weighted toward success
    let activityCount = 0;

    // Generate 10 days of data
    for (let dayOffset = 10; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const workDate = date.toISOString().split('T')[0];

      for (const user of salesUsers) {
        // Random: some days a user might not work
        if (Math.random() < 0.1) continue;

        // Clock-in (7:30-9:00 AM)
        const clockInHour = 7 + Math.random() * 1.5;
        const clockInTime = new Date(date);
        clockInTime.setHours(Math.floor(clockInHour), Math.floor((clockInHour % 1) * 60), 0);

        // Base location (Bangkok area)
        const baseLat = 13.7 + (Math.random() - 0.5) * 0.3;
        const baseLng = 100.5 + (Math.random() - 0.5) * 0.3;

        await connection.execute(
          `INSERT INTO activities (userId, eventType, eventTime, workDate, lat, lng, calcStatus, createdAt) 
           VALUES (?, 'CLOCK_IN', ?, ?, ?, ?, 'SKIP', NOW())`,
          [user.id, clockInTime, workDate, baseLat, baseLng]
        );
        activityCount++;

        // 3-6 check-ins per day
        const numCheckIns = 3 + Math.floor(Math.random() * 4);
        let prevLat = baseLat;
        let prevLng = baseLng;

        for (let i = 0; i < numCheckIns; i++) {
          const store = storeList[Math.floor(Math.random() * storeList.length)];
          const visitStatus = visitStatuses[Math.floor(Math.random() * visitStatuses.length)];
          
          // Check-in time (spread throughout the day)
          const checkInHour = 9 + (i * 1.5) + Math.random();
          const checkInTime = new Date(date);
          checkInTime.setHours(Math.floor(checkInHour), Math.floor((checkInHour % 1) * 60), 0);

          // Location near the store with some randomness
          const lat = store.lat + (Math.random() - 0.5) * 0.01;
          const lng = store.lng + (Math.random() - 0.5) * 0.01;

          // Calculate distance from previous point
          const dLat = (lat - prevLat) * Math.PI / 180;
          const dLng = (lng - prevLng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(prevLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const legDistanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          await connection.execute(
            `INSERT INTO activities (userId, eventType, eventTime, workDate, lat, lng, storeId, storeName, brand, visitStatus, prevLat, prevLng, legDistanceKm, legDurationMin, calcStatus, createdAt) 
             VALUES (?, 'CHECK_IN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DONE', NOW())`,
            [user.id, checkInTime, workDate, lat, lng, store.id, store.name, store.brand, visitStatus, prevLat, prevLng, Math.round(legDistanceKm * 10) / 10, Math.round(legDistanceKm * 2 * 10) / 10]
          );
          activityCount++;

          prevLat = lat;
          prevLng = lng;
        }

        // Clock-out (16:00-18:00)
        const clockOutHour = 16 + Math.random() * 2;
        const clockOutTime = new Date(date);
        clockOutTime.setHours(Math.floor(clockOutHour), Math.floor((clockOutHour % 1) * 60), 0);

        const finalLat = prevLat + (Math.random() - 0.5) * 0.02;
        const finalLng = prevLng + (Math.random() - 0.5) * 0.02;

        await connection.execute(
          `INSERT INTO activities (userId, eventType, eventTime, workDate, lat, lng, prevLat, prevLng, legDistanceKm, calcStatus, createdAt) 
           VALUES (?, 'CLOCK_OUT', ?, ?, ?, ?, ?, ?, ?, 'DONE', NOW())`,
          [user.id, clockOutTime, workDate, finalLat, finalLng, prevLat, prevLng, Math.round(Math.random() * 3 * 10) / 10]
        );
        activityCount++;
      }
    }

    console.log(`  ✓ ${activityCount} activities seeded`);
    console.log('\n✅ Seed complete!');

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await connection.end();
  }
}

seed();
