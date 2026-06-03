# YourFin Rider — Mobile App

แอปมือถือสำหรับทีมขายภาคสนาม (riders) ของ YourFin Rider ใช้เช็คอินร้านค้าคู่ค้า
บันทึก GPS + รูปถ่าย และลงเวลาเข้า–ออกงาน

Built with **Expo SDK 56** + React Native + TypeScript.

## Stack / versions

| | |
|---|---|
| Expo SDK | **56** (`expo ~56.0.8`, React Native 0.85.3, React 19.2.3) |
| Navigation | `@react-navigation/*` v7 (bottom tabs) |
| Native modules | `expo-location`, `expo-image-picker`, `expo-secure-store`, `expo-constants`, `react-native-maps` |
| Language | TypeScript (strict) |

## Prerequisites

- Node.js 18+ (tested on Node 22)
- The backend API running and seeded at `http://localhost:4000/api`
  (from the repo root `backend/`). The app talks to this contract — see
  `docs/API_CONTRACT.md`.
- For device testing: the **Expo Go** app, or a dev build.

## Run

```bash
cd mobile
npm install          # install dependencies
npx expo start       # start the Metro dev server
```

Then:
- Press `a` for an Android emulator, `i` for an iOS simulator, or
- scan the QR code with **Expo Go** on a physical phone.

Type-checking:

```bash
npm run typecheck    # tsc --noEmit
```

## Pointing the app at the backend (`apiBaseUrl`)

The API base URL is read from `app.json` → `expo.extra.apiBaseUrl`
(see `src/config.ts`). Default:

```json
"extra": { "apiBaseUrl": "http://localhost:4000/api" }
```

Pick the right value for where the app runs:

| Where the app runs | `apiBaseUrl` |
|---|---|
| iOS simulator | `http://localhost:4000/api` |
| Android emulator | `http://10.0.2.2:4000/api` |
| **Physical device (Expo Go)** | `http://<your-computer-LAN-IP>:4000/api` e.g. `http://192.168.1.42:4000/api` |

> On a physical phone, `localhost` means the **phone itself**, not your computer —
> you must use your machine's LAN IP. Find it with `ipconfig` (Windows) or
> `ifconfig` / `ip addr` (macOS/Linux), and make sure the phone and computer are on
> the same Wi-Fi network and the backend is reachable (no firewall blocking port 4000).

After editing `app.json`, restart `expo start`.

## Test login

```
อีเมล:   somchai@yourfin.co
รหัสผ่าน: sales1234
```

(Other seeded riders: `suda@`, `anan@`, `nong@` — all `@yourfin.co` with the same
password. Manager/Admin accounts exist too but this app targets the SALES role.)

## Screens

- **เข้าสู่ระบบ (Login)** — email/password, persists the JWT in `expo-secure-store`.
- **หน้าหลัก (Home)** — daily summary cards (เช็คอิน / ปิดดีล / Conversion% / ระยะทาง),
  เริ่มงาน/เลิกงาน (Clock In/Out) with GPS, today's activity list, pull-to-refresh.
- **เช็คอินร้าน (Check-in)** — GPS, ชื่อร้าน, แบรนด์, สถานะ (ปิดดีล/รอตัดสินใจ/ปฏิเสธ),
  หมายเหตุ, ถ่ายรูปหน้าร้าน → upload → check-in (shows computed `legDistanceKm`).
- **แผนที่ (Map)** — current location + today's check-ins as colored markers
  (เขียว = ปิดดีล, ส้ม = รอตัดสินใจ, แดง = ปฏิเสธ).
- **โปรไฟล์ (Profile)** — user info + ออกจากระบบ (Logout).

## Project structure

```
src/
  api/client.ts        fetch wrapper + typed endpoint functions
  auth/AuthContext.tsx  auth state, token persistence, restore on start
  components/           StatusBadge, SummaryCard, PrimaryButton, OptionPicker
  config.ts            API_BASE_URL from expo-constants extra
  navigation/RootNavigator.tsx  login vs. bottom-tabs switch
  screens/             Login, Home, CheckIn, Map, Profile
  theme.ts             colors + status/label/time helpers
  types.ts             types mirroring the API contract
  utils/location.ts    GPS permission + getCurrentCoords
```

## Notes / limitations

- **Maps require a real device or emulator.** `react-native-maps` does not render on
  web (the Map tab shows a friendly message on web). On Android, Google Maps may
  require an API key in a production build; in Expo Go on a device it works out of
  the box for development.
- **Camera & GPS require a physical device** (or a simulator with a mocked location)
  to exercise fully. The app degrades gracefully and shows Thai messages if
  permission is denied.
- Photo upload uses `multipart/form-data` with field name `photo` per the contract,
  then sends the returned `url` as `photoUrl` on check-in.
