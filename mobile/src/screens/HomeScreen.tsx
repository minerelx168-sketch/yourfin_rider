import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { SummaryCard } from '../components/SummaryCard';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import type { Activity, MyDayResponse } from '../types';
import {
  colors,
  eventTypeLabel,
  formatTime,
} from '../theme';
import { getCurrentCoords, LocationError } from '../utils/location';

export function HomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<MyDayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clocking, setClocking] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.getMyDay();
      setData(res);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'โหลดข้อมูลไม่สำเร็จ';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const summary = data?.summary;
  const clockedIn = summary?.clockedIn ?? false;
  const clockedOut = summary?.clockedOut ?? false;

  const doClock = async (kind: 'in' | 'out') => {
    setClocking(true);
    try {
      const { lat, lng } = await getCurrentCoords();
      if (kind === 'in') {
        await api.clockIn(lat, lng);
        Alert.alert('สำเร็จ', 'เริ่มงานเรียบร้อยแล้ว');
      } else {
        await api.clockOut(lat, lng);
        Alert.alert('สำเร็จ', 'เลิกงานเรียบร้อยแล้ว');
      }
      await load('refresh');
    } catch (e) {
      const msg =
        e instanceof LocationError || e instanceof ApiError
          ? e.message
          : 'ดำเนินการไม่สำเร็จ';
      Alert.alert('ผิดพลาด', msg);
    } finally {
      setClocking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.greeting}>สวัสดี, {user?.name ?? ''}</Text>
        {user?.region ? <Text style={styles.region}>เขต {user.region}</Text> : null}

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.primary}
          />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton title="ลองใหม่" onPress={() => load('initial')} />
          </View>
        ) : (
          <>
            <View style={styles.cards}>
              <SummaryCard label="เช็คอินวันนี้" value={summary?.checkins ?? 0} />
              <SummaryCard
                label="ปิดดีล"
                value={summary?.success ?? 0}
                accent={colors.success}
              />
              <SummaryCard
                label="Conversion"
                value={`${summary?.conversionRate ?? 0}%`}
                accent={colors.primary}
              />
              <SummaryCard
                label="ระยะทางรวม (กม.)"
                value={summary?.totalDistanceKm ?? 0}
              />
            </View>

            <View style={styles.clockBox}>
              {!clockedIn ? (
                <PrimaryButton
                  title="เริ่มงาน (Clock In)"
                  onPress={() => doClock('in')}
                  loading={clocking}
                />
              ) : !clockedOut ? (
                <PrimaryButton
                  title="เลิกงาน (Clock Out)"
                  onPress={() => doClock('out')}
                  loading={clocking}
                  color={colors.rejected}
                />
              ) : (
                <View style={styles.doneBox}>
                  <Text style={styles.doneText}>จบงานวันนี้แล้ว ✓</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>กิจกรรมวันนี้</Text>
            {data && data.activities.length > 0 ? (
              data.activities.map((a) => <ActivityRow key={a.id} activity={a} />)
            ) : (
              <Text style={styles.empty}>ยังไม่มีกิจกรรมวันนี้</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTime}>{formatTime(activity.eventTime)}</Text>
      <View style={styles.rowMain}>
        <Text style={styles.rowType}>{eventTypeLabel(activity.eventType)}</Text>
        {activity.storeName ? (
          <Text style={styles.rowStore}>{activity.storeName}</Text>
        ) : null}
      </View>
      <StatusBadge status={activity.visitStatus} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  region: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  loader: { marginTop: 40 },
  errorBox: { marginTop: 24, gap: 12 },
  errorText: { color: colors.danger, fontSize: 15 },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  clockBox: { marginTop: 20 },
  doneBox: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  doneText: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: {
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rowTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    width: 48,
  },
  rowMain: { flex: 1 },
  rowType: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowStore: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
