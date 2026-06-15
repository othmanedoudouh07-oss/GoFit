import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Dumbbell, Clock, ChevronRight } from 'lucide-react-native';
import type { Exercise } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { getMuscleLabel, getDifficultyColor, getDifficultyLabel, getCategoryEmoji } from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: (exercise: Exercise) => void;
  compact?: boolean;
  showCategory?: boolean;
}

export function ExerciseCard({ exercise, onPress, compact = false, showCategory = true }: ExerciseCardProps) {
  const diffColor = getDifficultyColor(exercise.difficulty);

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compact]}
      onPress={() => onPress?.(exercise)}
      activeOpacity={0.75}
    >
      {/* Category icon */}
      <View style={[styles.iconBox, { backgroundColor: colors.bgElevated }]}>
        <Text style={styles.categoryEmoji}>{getCategoryEmoji(exercise.category)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.name}
          </Text>
          {!compact && (
            <Badge
              label={getDifficultyLabel(exercise.difficulty)}
              color={diffColor}
              bgColor={diffColor}
            />
          )}
        </View>

        <Text style={styles.muscle} numberOfLines={1}>
          {exercise.muscleGroups.slice(0, 3).map(getMuscleLabel).join(' · ')}
        </Text>

        {!compact && (
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Dumbbell size={11} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {exercise.equipment.length === 1 && exercise.equipment[0] === 'bodyweight'
                  ? 'Poids du corps'
                  : exercise.equipment.length + ' équipements'}
              </Text>
            </View>
            {exercise.defaultReps && (
              <View style={styles.metaItem}>
                <Clock size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {exercise.defaultSets}×{exercise.defaultReps}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  compact: {
    padding: spacing.sm,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: { fontSize: 22 },
  content: { flex: 1, gap: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.md,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  muscle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.xs, color: colors.textMuted },
});
