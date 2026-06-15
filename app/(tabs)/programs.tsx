import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Clock, Calendar, Target, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { getAllPrograms, getActiveUserProgram } from '@/db/database';
import type { Program, UserProgram } from '@/types';
import { getCategoryEmoji, getDifficultyLabel, getDifficultyColor } from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<UserProgram | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [p, a] = await Promise.all([getAllPrograms(), getActiveUserProgram()]);
    setPrograms(p);
    setActiveProgram(a);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Programmes</Text>
      </View>

      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            isActive={activeProgram?.programId === item.id}
            onPress={() => router.push(`/program/${item.id}` as never)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeProgram ? (
            <View style={styles.activeBanner}>
              <Text style={styles.activeBannerTitle}>Programme en cours</Text>
              <Text style={styles.activeBannerSub}>
                Semaine {activeProgram.currentWeek} · {activeProgram.completedSessions.length} séances complétées
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function ProgramCard({
  program,
  isActive,
  onPress,
}: {
  program: Program;
  isActive: boolean;
  onPress: () => void;
}) {
  const diffColor = getDifficultyColor(program.difficulty);

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.activeCard]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {isActive && (
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>En cours</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{getCategoryEmoji(program.category)}</Text>
        <View style={styles.cardTitles}>
          <Text style={styles.programName}>{program.name}</Text>
          <Badge
            label={getDifficultyLabel(program.difficulty)}
            color={diffColor}
            bgColor={diffColor}
          />
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {program.description}
      </Text>
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Calendar size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{program.durationWeeks} semaines</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{program.sessionsPerWeek}x/semaine</Text>
        </View>
        <View style={styles.metaItem}>
          <Target size={13} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {program.objective}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.md },

  activeBanner: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  activeBannerTitle: { fontSize: typography.md, fontWeight: '700', color: colors.primary },
  activeBannerSub: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  activeCard: { borderColor: colors.primary + '50' },
  activePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  activePillText: { fontSize: typography.xs, color: colors.primary, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', gap: spacing.md },
  emoji: { fontSize: 36 },
  cardTitles: { flex: 1, gap: spacing.xs },
  programName: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  description: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.xs, color: colors.textMuted },
  chevron: { position: 'absolute', right: spacing.lg, top: spacing.lg },
});
