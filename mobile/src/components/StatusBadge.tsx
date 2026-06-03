import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { VisitStatus } from '../types';
import { statusColor, visitStatusLabel } from '../theme';

export function StatusBadge({ status }: { status: VisitStatus | null | undefined }) {
  if (!status) return null;
  const color = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{visitStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
