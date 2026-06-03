import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

export class LocationError extends Error {}

/**
 * Request foreground permission and return the current GPS coordinates.
 * Throws LocationError with a Thai message if denied or unavailable.
 */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new LocationError('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ตำแหน่งในการตั้งค่า');
  }
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    throw new LocationError('ดึงตำแหน่ง GPS ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
}
