import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Dumbbell, ChevronRight, Zap } from 'lucide-react-native';
import type { WorkoutTemplate } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import {
  getCategoryEmoji,
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
  formatMinutes,
} from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';

interface WorkoutCardProps {
  template: WorkoutTemplate;
  onPress?: (template: WorkoutTemplate) => void;
  variant?: 'default' | 'featured';
}

export function WorkoutCard({ template, onPress, variant = 'default' }: WorkoutCardProps) {
  const diffColor = getDifficultyColor(template.difficulty);
  const isFeatured = variant === 'featured';

  return (
    <TouchableOpacity
      style={[styles.container, isFeatured && styles.featured]}
      onPress={() => onPress?.(template)}
      activeOpacity={0.75}
    >
      {isFeatured && (
        <View style={styles.featuredBadge}>
          <Zap size={12} color={colors.primary} fill={colors.primary} />
          <Text style={styles.featuredLabel}>Recommandé</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.emoji}>{getCategoryEmoji(template.category)}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {template.name}
          </Text>
          <Badge
            label={getDifficultyLabel(template.difficulty)}
            color={diffColor}
            bgColor={diffColor}
          />
        </View>
      </View>

      {template.description && (
        <Text style={styles.description} numberOfLines={2}>
          {template.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Clock size={13} color={colors.textMuted} />
          <Text style={styles.statText}>{formatMinutes(template.estimatedDuration)}</Text>
        </View>
        <View style={styles.stat}>
          <Dumbbell size={13} color={colors.textMuted} />
          <Text style={styles.statText}>{template.exercises.length} exercices</Text>
        </View>
        <Text style={styles.category}>{getCategoryLabel(template.category)}</Text>
        <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  featured: {
    borderColor: colors.primary + '50',
    backgroundColor: colors.primary + '08',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  featuredLabel: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  emoji: { fontSize: 28 },
  titleRow: { flex: 1, gap: spacing.xs },
  name: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: typography.xs, color: colors.textMuted },
  category: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  chevron: { marginLeft: spacing.xs },
});
