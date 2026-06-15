import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Dumbbell,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react-native';
import { getExerciseById } from '@/db/database';
import type { Exercise } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import {
  getMuscleLabel,
  getEquipmentLabel,
  getDifficultyLabel,
  getDifficultyColor,
  getCategoryLabel,
  getCategoryEmoji,
} from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';

export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (id) getExerciseById(id).then(setExercise);
  }, [id]);

  if (!exercise) return null;

  const diffColor = getDifficultyColor(exercise.difficulty);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{getCategoryEmoji(exercise.category)}</Text>
          <Text style={styles.name}>{exercise.name}</Text>
          <View style={styles.badges}>
            <Badge
              label={getCategoryLabel(exercise.category)}
              color={colors.primary}
              bgColor={colors.primary}
              size="md"
            />
            <Badge
              label={getDifficultyLabel(exercise.difficulty)}
              color={diffColor}
              bgColor={diffColor}
              size="md"
            />
          </View>
          <Text style={styles.description}>{exercise.description}</Text>
        </View>

        {/* Default sets */}
        {(exercise.defaultSets || exercise.defaultReps) && (
          <View style={styles.defaultsRow}>
            {exercise.defaultSets && (
              <View style={styles.defaultCard}>
                <Text style={styles.defaultValue}>{exercise.defaultSets}</Text>
                <Text style={styles.defaultLabel}>Séries</Text>
              </View>
            )}
            {exercise.defaultReps && (
              <View style={styles.defaultCard}>
                <Text style={styles.defaultValue}>{exercise.defaultReps}</Text>
                <Text style={styles.defaultLabel}>Répétitions</Text>
              </View>
            )}
            {exercise.defaultDuration && (
              <View style={styles.defaultCard}>
                <Text style={styles.defaultValue}>{exercise.defaultDuration}s</Text>
                <Text style={styles.defaultLabel}>Durée</Text>
              </View>
            )}
            {exercise.defaultRest && (
              <View style={styles.defaultCard}>
                <Text style={styles.defaultValue}>{exercise.defaultRest}s</Text>
                <Text style={styles.defaultLabel}>Repos</Text>
              </View>
            )}
          </View>
        )}

        {/* Muscles */}
        <Section title="Muscles ciblés" icon={<Target size={16} color={colors.accent} />}>
          <View style={styles.muscleList}>
            {exercise.muscleGroups.map((m) => (
              <View key={m} style={[styles.muscleTag, m === exercise.primaryMuscle && styles.primaryTag]}>
                <Text style={[styles.muscleTagText, m === exercise.primaryMuscle && styles.primaryTagText]}>
                  {getMuscleLabel(m)} {m === exercise.primaryMuscle ? '(Principal)' : ''}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Equipment */}
        <Section title="Équipement" icon={<Dumbbell size={16} color={colors.primary} />}>
          <View style={styles.equipList}>
            {exercise.equipment.map((e) => (
              <View key={e} style={styles.equipTag}>
                <Text style={styles.equipText}>{getEquipmentLabel(e)}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Instructions */}
        <Section title="Instructions" icon={<CheckCircle2 size={16} color={colors.success} />}>
          {exercise.instructions.map((inst, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{inst}</Text>
            </View>
          ))}
        </Section>

        {/* Coach tips */}
        {exercise.coachTips.length > 0 && (
          <Section title="Conseils du coach" icon={<Lightbulb size={16} color="#f59e0b" />}>
            {exercise.coachTips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>💡</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Common mistakes */}
        {exercise.commonMistakes.length > 0 && (
          <Section title="Erreurs courantes" icon={<AlertTriangle size={16} color={colors.error} />}>
            {exercise.commonMistakes.map((m, i) => (
              <View key={i} style={styles.mistakeRow}>
                <Text style={styles.mistakeBullet}>⚠️</Text>
                <Text style={styles.mistakeText}>{m}</Text>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },

  content: { padding: spacing.lg, gap: spacing.xl },

  hero: { alignItems: 'center', gap: spacing.md },
  heroEmoji: { fontSize: 60 },
  name: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: spacing.sm },
  description: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  defaultsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  defaultCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  defaultValue: { fontSize: typography.xl, fontWeight: '800', color: colors.primary },
  defaultLabel: { fontSize: typography.xs, color: colors.textMuted },

  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  sectionContent: { gap: spacing.sm },

  muscleList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muscleTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryTag: { backgroundColor: colors.accent + '15', borderColor: colors.accent + '50' },
  muscleTagText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600' },
  primaryTagText: { color: colors.accent },

  equipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  equipTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  equipText: { fontSize: typography.sm, color: colors.primary, fontWeight: '600' },

  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNum: { fontSize: typography.sm, fontWeight: '700', color: '#fff' },
  stepText: { flex: 1, fontSize: typography.md, color: colors.textPrimary, lineHeight: 22 },

  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  tipBullet: { fontSize: typography.md },
  tipText: { flex: 1, fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },

  mistakeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  mistakeBullet: { fontSize: typography.md },
  mistakeText: { flex: 1, fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },
});
