import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '@/utils/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, color, bgColor, size = 'sm', style }: BadgeProps) {
  return (
    <View
      style={[
        styles.base,
        size === 'md' && styles.md,
        bgColor ? { backgroundColor: bgColor + '22' } : styles.defaultBg,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'md' && styles.textMd,
          color ? { color } : styles.defaultText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  defaultBg: { backgroundColor: colors.bgElevated },
  text: { fontSize: typography.xs, fontWeight: '600', letterSpacing: 0.2 },
  textMd: { fontSize: typography.sm },
  defaultText: { color: colors.textSecondary },
});
