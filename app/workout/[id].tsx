import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Play, Clock, Dumbbell, BarChart2 } from 'lucide-react-native';
import { getWorkoutTemplateById, getExerciseById } from '@/db/database';
import type { WorkoutTemplate, Exercise } from '@/types';
import { useSessionStore } from '@/stores/sessionStore';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import {
  getDifficultyLabel,
  getDifficultyColor,
  getCategoryLabel,
  getCategoryEmoji,
  formatMinutes,
  getMuscleLabel,
  formatDuration,
} from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startSession } = useSessionStore();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) loadTemplate(id);
  }, [id]);

  async function loadTemplate(templateId: string) {
    const t = await getWorkoutTemplateById(templateId);
    setTemplate(t);
    if (t) {
      const exMap: Record<string, Exercise> = {};
      for (const we of t.exercises) {
        const ex = await getExerciseById(we.exerciseId);
        if (ex) exMap[we.exerciseId] = ex;
      }
      setExercises(exMap);
    }
  }

  async function handleStart() {
    if (!template) return;
    setLoading(true);
    try {
      const session = await startSession(template);
      router.push(`/session/${session.id}` as never);
    } finally {
      setLoading(false);
    }
  }

  if (!template) return null;

  const diffColor = getDifficultyColor(template.difficulty);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Détail séance
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{getCategoryEmoji(template.category)}</Text>
          <Text style={styles.name}>{template.name}</Text>
          <View style={styles.badges}>
            <Badge label={getCategoryLabel(template.category)} color={colors.primary} bgColor={colors.primary} size="md" />
            <Badge label={getDifficultyLabel(template.difficulty)} color={diffColor} bgColor={diffColor} size="md" />
          </View>
          {template.description && (
            <Text style={styles.description}>{template.description}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon={<Clock size={18} color={colors.accent} />} value={formatMinutes(template.estimatedDuration)} label="Durée" />
          <StatCard icon={<Dumbbell size={18} color={colors.primary} />} value={`${template.exercises.length}`} label="Exercices" />
          <StatCard icon={<BarChart2 size={18} color="#f59e0b" />} value={template.exercises.reduce((s, e) => s + e.sets, 0).toString()} label="Séries total" />
        </View>

        {/* Exercises list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programme de la séance</Text>
          {template.exercises.map((we, index) => {
            const ex = exercises[we.exerciseId];
            return (
              <TouchableOpacity
                key={we.exerciseId + index}
                style={styles.exerciseRow}
                onPress={() => router.push(`/exercise/${we.exerciseId}` as never)}
                activeOpacity={0.75}
              >
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{ex?.name ?? we.exerciseId}</Text>
                  <Text style={styles.exMeta}>
                    {we.sets} séries ×{' '}
                    {we.reps ? `${we.reps} reps` : we.duration ? formatDuration(we.duration) : '—'}
                    {' · '}Repos {formatDuration(we.rest)}
                  </Text>
                </View>
                {ex && (
                  <Text style={styles.exEmoji}>{getCategoryEmoji(ex.category)}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Start CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Démarrer la séance"
          onPress={handleStart}
          loading={loading}
          fullWidth
          size="lg"
          icon={<Play size={20} color="#fff" fill="#fff" />}
        />
      </View>
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  description: { fontSize: typography.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: typography.xl, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: typography.xs, color: colors.textMuted },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
  exInfo: { flex: 1 },
  exName: { fontSize: typography.md, fontWeight: '600', color: colors.textPrimary },
  exMeta: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  exEmoji: { fontSize: 20 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
});
