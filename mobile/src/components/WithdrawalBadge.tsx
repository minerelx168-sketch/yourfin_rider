import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WithdrawalStatus } from '../types';
import { withdrawalStatusColor, withdrawalStatusLabel } from '../theme';

/** Pill badge for a withdrawal status (mirrors StatusBadge). */
export function WithdrawalBadge({ status }: { status: WithdrawalStatus }) {
  const color = withdrawalStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{withdrawalStatusLabel(status)}</Text>
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
