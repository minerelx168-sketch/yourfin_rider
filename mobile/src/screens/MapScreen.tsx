import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { PrimaryButton } from '../components/PrimaryButton';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import type { Activity } from '../types';
import { colors, statusColor, visitStatusLabel } from '../theme';
import { getCurrentCoords } from '../utils/location';

const BANGKOK: Region = {
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export function MapScreen() {
  const [checkins, setCheckins] = useState<Activity[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyDay();
      setCheckins(res.activities.filter((a) => a.eventType === 'CHECK_IN'));
      // Best-effort location; ignore if denied.
      try {
        const c = await getCurrentCoords();
        setUserCoords(c);
      } catch {
        setUserCoords(null);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'โหลดข้อมูลแผนที่ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // react-native-maps does not support web.
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.message}>
            แผนที่รองรับเฉพาะบนมือถือ (iOS/Android) เท่านั้น
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton title="ลองใหม่" onPress={load} style={styles.retryBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const initialRegion: Region = userCoords
    ? {
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : BANGKOK;

  return (
    <View style={styles.flex}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!!userCoords}
        showsMyLocationButton
      >
        {checkins.map((a) => (
          <Marker
            key={a.id}
            coordinate={{ latitude: a.lat, longitude: a.lng }}
            pinColor={statusColor(a.visitStatus)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>
                  {a.storeName ?? 'ไม่ระบุชื่อร้าน'}
                </Text>
                <Text
                  style={[styles.calloutStatus, { color: statusColor(a.visitStatus) }]}
                >
                  {visitStatusLabel(a.visitStatus)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: { color: colors.danger, fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 16, alignSelf: 'stretch' },
  callout: { minWidth: 140, padding: 4 },
  calloutTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  calloutStatus: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
