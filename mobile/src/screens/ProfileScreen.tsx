import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';
import type { Role } from '../types';

const ROLE_LABEL: Record<Role, string> = {
  SALES: 'พนักงานขาย',
  MANAGER: 'ผู้จัดการ',
  ADMIN: 'ผู้ดูแลระบบ',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name ?? '-'}</Text>
        <Text style={styles.email}>{user?.email ?? '-'}</Text>

        <View style={styles.card}>
          <InfoRow label="ตำแหน่ง" value={user ? ROLE_LABEL[user.role] : '-'} />
          <InfoRow label="ทีม" value={user?.team ?? '-'} />
          <InfoRow label="เขตพื้นที่" value={user?.region ?? '-'} />
          <InfoRow
            label="เป้าหมายปิดดีล/วัน"
            value={user ? String(user.targetDailyClose) : '-'}
          />
          <InfoRow label="เบอร์โทร" value={user?.phone ?? '-'} />
        </View>

        <PrimaryButton
          title="ออกจากระบบ"
          onPress={logout}
          color={colors.rejected}
          style={styles.logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12 },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 15, color: colors.textMuted },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  logout: { alignSelf: 'stretch', marginTop: 32 },
});
