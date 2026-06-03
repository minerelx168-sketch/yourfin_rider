import axios from 'axios';
import { env } from '../config/env';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LegResult {
  distanceKm: number;
  durationMin: number;
  source: 'google' | 'haversine';
}

const EARTH_RADIUS_KM = 6371;

/** ระยะทางเส้นตรง (นกบิน) — ใช้เป็น fallback เมื่อไม่มี/เรียก Google Maps ไม่ได้ */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * คำนวณ "ระยะทางขับขี่จริง" จาก origin → dest
 * - ถ้ามี GOOGLE_MAPS_API_KEY: เรียก Distance Matrix API (mode=driving)
 * - ถ้าไม่มี/ผิดพลาด: ใช้ Haversine + ประมาณเวลาจากความเร็วเฉลี่ย
 */
export async function computeLeg(origin: LatLng, dest: LatLng): Promise<LegResult> {
  if (env.googleMapsApiKey) {
    try {
      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${dest.lat},${dest.lng}`,
            mode: 'driving',
            units: 'metric',
            key: env.googleMapsApiKey,
          },
          timeout: 8000,
        },
      );
      const element = data?.rows?.[0]?.elements?.[0];
      if (data?.status === 'OK' && element?.status === 'OK') {
        return {
          distanceKm: round2(element.distance.value / 1000),
          durationMin: round2(element.duration.value / 60),
          source: 'google',
        };
      }
      console.warn(
        `Distance Matrix returned non-OK status: api=${data?.status} element=${element?.status}`,
      );
    } catch (err) {
      console.warn('Distance Matrix call failed, falling back to Haversine:', (err as Error).message);
    }
  }

  const km = haversineKm(origin, dest);
  const durationMin = env.fallbackAvgSpeedKmh > 0 ? (km / env.fallbackAvgSpeedKmh) * 60 : 0;
  return { distanceKm: round2(km), durationMin: round2(durationMin), source: 'haversine' };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
