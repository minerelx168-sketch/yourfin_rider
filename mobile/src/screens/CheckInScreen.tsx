import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { PrimaryButton } from '../components/PrimaryButton';
import { OptionPicker, Option } from '../components/OptionPicker';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import type { Brand, VisitStatus } from '../types';
import { colors } from '../theme';
import { getCurrentCoords, LocationError, Coords } from '../utils/location';

const BRAND_OPTIONS: Option<Brand>[] = [
  { value: 'SAMSUNG', label: 'SAMSUNG' },
  { value: 'VIVO', label: 'VIVO' },
  { value: 'OPPO', label: 'OPPO' },
  { value: 'XIAOMI', label: 'XIAOMI' },
  { value: 'REALME', label: 'REALME' },
  { value: 'APPLE', label: 'APPLE' },
  { value: 'OTHER', label: 'อื่น ๆ' },
];

const STATUS_OPTIONS: Option<VisitStatus>[] = [
  { value: 'SUCCESS', label: 'ปิดดีล', color: colors.success },
  { value: 'PENDING', label: 'รอตัดสินใจ', color: colors.pending },
  { value: 'REJECTED', label: 'ปฏิเสธ', color: colors.rejected },
];

interface PhotoAsset {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

export function CheckInScreen() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  const [storeName, setStoreName] = useState('');
  const [brand, setBrand] = useState<Brand>('OTHER');
  const [visitStatus, setVisitStatus] = useState<VisitStatus | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<PhotoAsset | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchLocation = async () => {
    setLocLoading(true);
    setLocError(null);
    try {
      const c = await getCurrentCoords();
      setCoords(c);
    } catch (e) {
      setLocError(e instanceof LocationError ? e.message : 'ดึงตำแหน่งไม่สำเร็จ');
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('ต้องการสิทธิ์กล้อง', 'กรุณาเปิดสิทธิ์การใช้กล้องในการตั้งค่า');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets.length > 0) {
      const a = result.assets[0];
      setPhoto({
        uri: a.uri,
        fileName: a.fileName ?? undefined,
        mimeType: a.mimeType,
      });
    }
  };

  const resetForm = () => {
    setStoreName('');
    setBrand('OTHER');
    setVisitStatus(null);
    setNote('');
    setPhoto(null);
  };

  const onSubmit = async () => {
    if (!coords) {
      Alert.alert('ไม่มีตำแหน่ง', 'ยังไม่ได้ตำแหน่ง GPS กรุณาลองดึงตำแหน่งใหม่');
      return;
    }
    if (!storeName.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อร้าน');
      return;
    }
    if (!visitStatus) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกสถานะการเข้าพบ');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        const uploaded = await api.uploadPhoto(
          photo.uri,
          photo.fileName,
          photo.mimeType,
        );
        photoUrl = uploaded.url;
      }

      const activity = await api.checkIn({
        lat: coords.lat,
        lng: coords.lng,
        storeName: storeName.trim(),
        brand,
        visitStatus,
        note: note.trim() ? note.trim() : undefined,
        photoUrl,
      });

      const km =
        activity.legDistanceKm != null
          ? `${activity.legDistanceKm.toFixed(2)} กม.`
          : 'ไม่ระบุ';
      Alert.alert('เช็คอินสำเร็จ', `บันทึกการเข้าพบ "${activity.storeName}" แล้ว\nระยะทางจากจุดก่อนหน้า: ${km}`);
      resetForm();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'เช็คอินไม่สำเร็จ';
      Alert.alert('ผิดพลาด', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>เช็คอินร้าน</Text>

          {/* Location */}
          <View style={styles.gpsBox}>
            <Text style={styles.gpsLabel}>ตำแหน่งปัจจุบัน (GPS)</Text>
            {locLoading ? (
              <Text style={styles.gpsValue}>กำลังดึงตำแหน่ง...</Text>
            ) : locError ? (
              <>
                <Text style={styles.gpsError}>{locError}</Text>
                <Pressable onPress={fetchLocation}>
                  <Text style={styles.retryLink}>ลองดึงตำแหน่งใหม่</Text>
                </Pressable>
              </>
            ) : coords ? (
              <View style={styles.gpsRow}>
                <Text style={styles.gpsValue}>
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </Text>
                <Pressable onPress={fetchLocation}>
                  <Text style={styles.retryLink}>รีเฟรช</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Store name */}
          <Text style={styles.label}>ชื่อร้าน *</Text>
          <TextInput
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="เช่น มือถือ พลาซ่า บางกะปิ"
            placeholderTextColor={colors.textMuted}
            editable={!submitting}
          />

          {/* Brand */}
          <Text style={styles.label}>แบรนด์</Text>
          <OptionPicker options={BRAND_OPTIONS} value={brand} onChange={setBrand} />

          {/* Visit status */}
          <Text style={styles.label}>สถานะ *</Text>
          <OptionPicker
            options={STATUS_OPTIONS}
            value={visitStatus}
            onChange={setVisitStatus}
          />

          {/* Note */}
          <Text style={styles.label}>หมายเหตุ</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={note}
            onChangeText={setNote}
            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            editable={!submitting}
          />

          {/* Photo */}
          <Text style={styles.label}>รูปหน้าร้าน</Text>
          <Pressable style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>
              {photo ? 'ถ่ายรูปใหม่' : 'ถ่ายรูปหน้าร้าน'}
            </Text>
          </Pressable>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
          ) : null}

          <PrimaryButton
            title="ยืนยันเช็คอิน"
            onPress={onSubmit}
            loading={submitting}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  gpsBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
  },
  gpsLabel: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },
  gpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  gpsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  gpsError: { fontSize: 14, color: colors.danger, marginTop: 4 },
  retryLink: { color: colors.primary, fontWeight: '600', marginTop: 4 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  photoButtonText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  thumb: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: colors.border,
  },
  submit: { marginTop: 28 },
});
