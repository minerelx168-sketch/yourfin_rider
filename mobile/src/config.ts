import Constants from 'expo-constants';

/**
 * Base URL of the YourFin Rider REST API.
 *
 * Resolved from `app.json` -> `expo.extra.apiBaseUrl`, with a sensible default.
 *
 * IMPORTANT (physical device):
 *   `http://localhost:4000/api` points to the *device itself*, not your computer.
 *   When running on a real phone (Expo Go / dev build), set `apiBaseUrl` in app.json
 *   to your computer's LAN IP, e.g. `http://192.168.1.42:4000/api`.
 *   (Find it with `ipconfig` on Windows or `ifconfig`/`ip addr` on macOS/Linux.)
 *
 *   Android emulator can reach the host machine via `http://10.0.2.2:4000/api`.
 *   iOS simulator can use `http://localhost:4000/api`.
 */
const extra =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined) ?? {};

export const API_BASE_URL: string = extra.apiBaseUrl ?? 'http://localhost:4000/api';
