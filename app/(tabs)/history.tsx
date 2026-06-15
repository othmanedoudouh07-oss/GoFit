import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Clock,
  Trophy,
  Flame,
  TrendingUp,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useSessionStore } from '@/stores/sessionStore';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { formatShortDate, formatMinutes, getCategoryEmoji } from '@/utils/helpers';
import type { Session } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, loadSessions } = useSessionStore();
  const [sections, setSections] = useState<{ title: string; data: Session[] }[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    buildSections();
  }, [sessions]);

  function buildSections() {
    const completed = sessions.filter((s) => s.status === 'completed');
    const grouped: Record<string, Session[]> = {};
    for (const s of completed) {
      const month = new Date(s.date).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(s);
    }
    const secs = Object.entries(grouped).map(([title, data]) => ({ title, data }));
    setSections(secs);
  }

  const completed = sessions.filter((s) => s.status === 'completed');
  const totalDuration = completed.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const totalCalories = completed.reduce((acc, s) => acc + (s.caloriesBurned ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      {/* Global stats */}
      <View style={styles.statsRow}>
        <StatBox icon={<Trophy size={18} color="#f59e0b" />} value={completed.length} label="Séances" />
        <StatBox
          icon={<Clock size={18} color={colors.accent} />}
          value={`${Math.round(totalDuration / 60)}h`}
          label="Total"
        />
        <StatBox
          icon={<Flame size={18} color={colors.error} />}
          value={`${Math.round(totalCalories / 1000)}k`}
          label="kcal"
        />
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={52} color={colors.textMuted} />}
          title="Aucune séance terminée"
          description="Commence une séance pour voir ton historique ici."
          actionLabel="Démarrer une séance"
          onAction={() => router.push('/workout/create' as never)}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionRow session={item} onPress={() => router.push(`/session/${item.id}` as never)} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statBox}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SessionRow({ session, onPress }: { session: Session; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.sessionLeft}>
        <View style={styles.dateBox}>
          <Text style={styles.day}>
            {new Date(session.date).getDate()}
          </Text>
          <Text style={styles.monthShort}>
            {new Date(session.date).toLocaleDateString('fr-FR', { month: 'short' })}
          </Text>
        </View>
        <View>
          <Text style={styles.sessionName} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={styles.sessionMeta}>
            {session.duration ? formatMinutes(session.duration) : ''}
            {session.caloriesBurned ? ` · ${session.caloriesBurned} kcal` : ''}
            {session.exerciseLogs?.length ? ` · ${session.exerciseLogs.length} ex` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        {session.rating !== undefined && (
          <Text style={styles.rating}>{'⭐'.repeat(session.rating)}</Text>
        )}
        <CheckCircle size={16} color={colors.success} />
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  sectionHeader: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sessionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { fontSize: typography.lg, fontWeight: '800', color: colors.primary },
  monthShort: { fontSize: typography.xs, color: colors.primary, fontWeight: '600' },
  sessionName: { fontSize: typography.md, fontWeight: '600', color: colors.textPrimary },
  sessionMeta: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rating: { fontSize: typography.xs },
});
