import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Dumbbell,
  Trophy,
  Flame,
  Calendar,
  ChevronRight,
  Zap,
  Target,
  Clock,
} from 'lucide-react-native';
import { useUserStore } from '@/stores/userStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';
import {
  formatDate,
  getWeekDates,
  getTodayString,
  getCategoryEmoji,
  getCategoryLabel,
} from '@/utils/helpers';
import { getAllWorkoutTemplates, getTotalSessionsCompleted } from '@/db/database';
import type { WorkoutTemplate } from '@/types';

const COACH_TIPS = [
  'La régularité est plus importante que l\'intensité. Une séance imparfaite vaut mieux que pas de séance.',
  'Hydrate-toi : bois 500ml d\'eau avant chaque entraînement.',
  'Le sommeil est le meilleur complément nutritionnel. Vise 7-9h par nuit.',
  'La progression en force vient de l\'add-on progressif. +2.5kg par semaine, c\'est +130kg par an.',
  'Chaque série difficile te rend plus fort. La difficulté est le prix à payer pour la progression.',
  'Échauffement = prévention. 5 minutes d\'échauffement peuvent éviter des semaines de blessure.',
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUserStore();
  const { sessions, loadSessions } = useSessionStore();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const todayTip = COACH_TIPS[new Date().getDay() % COACH_TIPS.length];

  const today = getTodayString();
  const { start, end } = getWeekDates();
  const weekSessions = sessions.filter(
    (s) => s.date >= start && s.date <= end && s.status === 'completed'
  );
  const todaySessions = sessions.filter((s) => s.date === today);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [t, count] = await Promise.all([
      getAllWorkoutTemplates(),
      getTotalSessionsCompleted(),
    ]);
    setTemplates(t.slice(0, 3));
    setTotalSessions(count);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadSessions();
    await loadData();
    setRefreshing(false);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  const streak = calculateStreak(sessions);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{profile?.name ?? 'Athlete'} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.avatarText}>
            {(profile?.name ?? 'A')[0].toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Flame size={20} color={colors.primary} />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Jours streak</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={20} color={colors.accent} />
            <Text style={styles.statValue}>{weekSessions.length}</Text>
            <Text style={styles.statLabel}>Cette semaine</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Total séances</Text>
          </View>
        </View>

        {/* Today's session or CTA */}
        {todaySessions.length > 0 ? (
          <Card style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Text style={styles.sectionTitle}>Aujourd'hui</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ Complété</Text>
              </View>
            </View>
            {todaySessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.sessionRow}
                onPress={() => router.push(`/session/${s.id}` as never)}
              >
                <Clock size={15} color={colors.textMuted} />
                <Text style={styles.sessionName}>{s.name}</Text>
                {s.duration && (
                  <Text style={styles.sessionDuration}>{s.duration} min</Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        ) : (
          <TouchableOpacity
            style={styles.startCta}
            onPress={() => router.push('/workout/create' as never)}
            activeOpacity={0.85}
          >
            <View style={styles.ctaLeft}>
              <View style={styles.ctaIcon}>
                <Zap size={24} color={colors.primary} fill={colors.primary} />
              </View>
              <View>
                <Text style={styles.ctaTitle}>Commencer une séance</Text>
                <Text style={styles.ctaSubtitle}>Crée ou choisis une séance</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Coach tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Target size={16} color={colors.accent} />
            <Text style={styles.tipTitle}>Conseil du coach</Text>
          </View>
          <Text style={styles.tipText}>{todayTip}</Text>
        </View>

        {/* Sport categories */}
        <View>
          <Text style={styles.sectionTitle}>Disciplines</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryCard, { borderColor: cat.color + '30' }]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/workout',
                    params: { category: cat.key },
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catName}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick workouts */}
        {templates.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Séances rapides</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/workout')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.quickWorkout}
                onPress={() => router.push(`/workout/${t.id}` as never)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickEmoji}>{getCategoryEmoji(t.category)}</Text>
                <View style={styles.quickInfo}>
                  <Text style={styles.quickName}>{t.name}</Text>
                  <Text style={styles.quickMeta}>
                    {t.exercises.length} ex · {t.estimatedDuration} min
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const CATEGORIES = [
  { key: 'strength', label: 'Musculation', emoji: '💪', color: colors.primary },
  { key: 'football', label: 'Football', emoji: '⚽', color: colors.success },
  { key: 'rugby', label: 'Rugby', emoji: '🏉', color: colors.warning },
  { key: 'cardio', label: 'Cardio', emoji: '🏃', color: colors.error },
  { key: 'stretching', label: 'Étirements', emoji: '🧘', color: '#a855f7' },
];

function calculateStreak(sessions: ReturnType<typeof useSessionStore.getState>['sessions']): number {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => s.date)
    .sort()
    .reverse();

  if (completed.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (completed.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greeting: { fontSize: typography.sm, color: colors.textSecondary },
  name: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.lg, fontWeight: '700', color: colors.primary },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },

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
  statValue: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, textAlign: 'center' },

  todayCard: { gap: spacing.md },
  todayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completedBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  completedText: { fontSize: typography.xs, color: colors.success, fontWeight: '600' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionName: { flex: 1, fontSize: typography.sm, color: colors.textPrimary },
  sessionDuration: { fontSize: typography.xs, color: colors.textMuted },

  startCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  ctaLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  ctaSubtitle: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },

  tipCard: {
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tipTitle: { fontSize: typography.sm, fontWeight: '700', color: colors.accent },
  tipText: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },

  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  seeAll: { fontSize: typography.sm, color: colors.primary, fontWeight: '600' },

  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  categoryCard: {
    width: '45%',
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  catEmoji: { fontSize: 28 },
  catName: { fontSize: typography.sm, fontWeight: '600', color: colors.textPrimary },

  quickWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  quickEmoji: { fontSize: 22 },
  quickInfo: { flex: 1 },
  quickName: { fontSize: typography.md, fontWeight: '600', color: colors.textPrimary },
  quickMeta: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
});
