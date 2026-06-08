# Project TODO

## Database & Schema
- [x] สร้าง users table (id, openId, name, email, phone, team, region, role SALES/MANAGER/ADMIN, targetDailyClose, photoUrl, active)
- [x] สร้าง stores table (id, name, brand, province, district, address, lat, lng, partnerStatus, ownerName, ownerContact)
- [x] สร้าง activities table (id, userId, eventType CLOCK_IN/CHECK_IN/CLOCK_OUT, eventTime, workDate, lat, lng, storeId, storeName, brand, visitStatus, photoUrl, note, prevLat, prevLng, legDistanceKm, legDurationMin, calcStatus)

## Backend API
- [x] Auth system with protectedProcedure (Manus OAuth)
- [x] Activity endpoints (clock-in, check-in, clock-out) with GPS
- [x] Store list/getById/create endpoints
- [x] Distance calculation (Haversine formula)
- [x] Dashboard API (overview stats, leaderboard, timeseries, map data, activity feed)
- [x] Photo upload to S3 storage
- [x] Date range filter on dashboard endpoints
- [x] Add RBAC role guards (restrict dashboard to MANAGER/ADMIN via managerProcedure)
- [x] Add user/brand/region filter params to dashboard endpoints

## Mobile PWA (พนักงาน)
- [x] Login page with role-based redirect
- [x] Home page with daily summary (visits count, distance, conversion rate)
- [x] Clock-in / Clock-out with GPS capture
- [x] Check-in form (store name, brand, visit status, photo upload, note)
- [x] Map view with colored pins (green=สำเร็จ, gray=รอ, orange/red=ปฏิเสธ)
- [x] Profile page with logout
- [x] Mobile-first responsive design
- [x] PWA manifest.json for installability

## Dashboard (ผู้บริหาร)
- [x] Scorecards (total visits, conversion rate, total distance, active riders)
- [x] Daily trend chart (visits and distance over time)
- [x] Leaderboard (top performers by visits/conversions)
- [x] Coverage Map with colored pins
- [x] Activity Feed with auto-refresh every 60 seconds
- [x] Date range filter on all pages
- [x] Desktop-optimized layout with sidebar
- [x] Add user/brand/region filter dropdowns on dashboard UI (all 4 pages)

## Design & UX
- [x] Design system (colors, typography, spacing) suitable for Sales Management
- [x] Light/clean theme for Mobile PWA and Dashboard
- [x] Consistent status colors (green=สำเร็จ, gray=รอ, orange=ปฏิเสธ)

## Data & Testing
- [x] Seed data: sample users (5 SALES + 1 MANAGER)
- [x] Seed data: sample stores (12 stores with various brands)
- [x] Seed data: sample activities (11 days, 320+ records)
- [x] Vitest unit tests for backend procedures (9 tests passing)
