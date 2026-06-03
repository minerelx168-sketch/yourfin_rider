import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export interface Option<T extends string> {
  value: T;
  label: string;
  /** Optional accent color used when selected. */
  color?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** A simple wrapping set of selectable chips (used as picker / segmented control). */
export function OptionPicker<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const accent = opt.color ?? colors.primary;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              selected
                ? { backgroundColor: accent, borderColor: accent }
                : { backgroundColor: colors.white, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected ? '#fff' : colors.text },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
