import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  value: string | number;
  accent?: string;
}

export function SummaryCard({ label, value, accent }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
});
