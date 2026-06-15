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
import { ArrowLeft, Play, Calendar, CheckCircle, Lock } from 'lucide-react-native';
import { getProgramById, getWorkoutTemplateById, saveUserProgram } from '@/db/database';
import type { Program, WorkoutTemplate, UserProgram } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import {
  getCategoryEmoji,
  getDifficultyLabel,
  getDifficultyColor,
  formatMinutes,
  generateId,
} from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function ProgramDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) loadProgram(id);
  }, [id]);

  async function loadProgram(programId: string) {
    const p = await getProgramById(programId);
    setProgram(p);
    if (p) {
      const names: Record<string, string> = {};
      const ids = new Set(p.weeks.flatMap((w) => w.workouts.map((wo) => wo.workoutTemplateId)));
      for (const tid of ids) {
        const t = await getWorkoutTemplateById(tid);
        if (t) names[tid] = t.name;
      }
      setWorkoutNames(names);
    }
  }

  async function handleStart() {
    if (!program) return;
    setLoading(true);
    const userProgram: UserProgram = {
      id: generateId(),
      programId: program.id,
      startDate: new Date().toISOString().split('T')[0],
      currentWeek: 1,
      isActive: true,
      completedSessions: [],
    };
    await saveUserProgram(userProgram);
    setLoading(false);
    Alert.alert(
      'Programme démarré !',
      `Tu as commencé "${program.name}". Suis le programme chaque semaine pour progresser.`,
      [{ text: 'Super !', onPress: () => router.back() }]
    );
  }

  if (!program) return null;

  const diffColor = getDifficultyColor(program.difficulty);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Programme</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{getCategoryEmoji(program.category)}</Text>
          <Text style={styles.name}>{program.name}</Text>
          <View style={styles.badges}>
            <Badge label={getDifficultyLabel(program.difficulty)} color={diffColor} bgColor={diffColor} size="md" />
            <Badge label={`${program.durationWeeks} semaines`} color={colors.accent} bgColor={colors.accent} size="md" />
          </View>
          <Text style={styles.description}>{program.description}</Text>
        </View>

        {/* Info cards */}
        <View style={styles.statsRow}>
          <InfoCard value={`${program.durationWeeks}`} label="Semaines" />
          <InfoCard value={`${program.sessionsPerWeek}x`} label="/ Semaine" />
          <InfoCard value={`~${program.sessionsPerWeek * program.durationWeeks}`} label="Séances total" />
        </View>

        {/* Objective */}
        <View style={styles.objectiveCard}>
          <Text style={styles.objectiveLabel}>Objectif</Text>
          <Text style={styles.objectiveValue}>{program.objective}</Text>
        </View>

        {/* Weekly schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Semaine type</Text>
          {program.weeks[0]?.workouts.map((wo, i) => (
            <View key={i} style={styles.dayRow}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{DAY_LABELS[wo.dayOfWeek]}</Text>
              </View>
              <Text style={styles.dayWorkout}>
                {workoutNames[wo.workoutTemplateId] ?? 'Chargement...'}
              </Text>
            </View>
          ))}
          {/* Rest days */}
          {Array.from({ length: 7 }).map((_, i) => {
            const hasWorkout = program.weeks[0]?.workouts.some((w) => w.dayOfWeek === i);
            if (hasWorkout) return null;
            return (
              <View key={`rest-${i}`} style={[styles.dayRow, styles.restDay]}>
                <View style={[styles.dayBadge, styles.restDayBadge]}>
                  <Text style={[styles.dayText, styles.restDayText]}>{DAY_LABELS[i]}</Text>
                </View>
                <Text style={styles.restText}>Repos / Récupération</Text>
              </View>
            );
          })}
        </View>

        {/* All weeks (collapsed) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan complet ({program.durationWeeks} semaines)</Text>
          {program.weeks.map((week) => (
            <View key={week.weekNumber} style={styles.weekRow}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={styles.weekLabel}>Semaine {week.weekNumber}</Text>
              <Text style={styles.weekSessions}>{week.workouts.length} séances</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Démarrer ce programme"
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

function InfoCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
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
  infoCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  infoValue: { fontSize: typography.xxl, fontWeight: '800', color: colors.primary },
  infoLabel: { fontSize: typography.xs, color: colors.textMuted },
  objectiveCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  objectiveLabel: { fontSize: typography.xs, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  objectiveValue: { fontSize: typography.md, color: colors.textPrimary },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restDay: { opacity: 0.5 },
  dayBadge: {
    width: 40,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayBadge: { backgroundColor: colors.bgElevated },
  dayText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  restDayText: { color: colors.textMuted },
  dayWorkout: { flex: 1, fontSize: typography.sm, color: colors.textPrimary, fontWeight: '600' },
  restText: { flex: 1, fontSize: typography.sm, color: colors.textMuted },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  weekLabel: { flex: 1, fontSize: typography.sm, color: colors.textSecondary },
  weekSessions: { fontSize: typography.sm, color: colors.textMuted },
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
