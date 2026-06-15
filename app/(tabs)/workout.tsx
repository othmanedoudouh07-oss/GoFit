import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Search, Plus, Filter } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { getAllWorkoutTemplates } from '@/db/database';
import type { WorkoutTemplate, SportCategory } from '@/types';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { useExerciseStore } from '@/stores/exerciseStore';
import { getCategoryLabel, getCategoryEmoji } from '@/utils/helpers';

const CATEGORIES: { key: SportCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'strength', label: 'Musculation' },
  { key: 'football', label: 'Football' },
  { key: 'rugby', label: 'Rugby' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'stretching', label: 'Étirements' },
];

type Tab = 'workouts' | 'exercises';

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const [tab, setTab] = useState<Tab>('workouts');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filtered, setFiltered] = useState<WorkoutTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SportCategory | 'all'>(
    (params.category as SportCategory) ?? 'all'
  );

  const {
    filteredExercises,
    isLoading: exLoading,
    setSearchQuery,
    setSelectedCategory: setExCategory,
    loadExercises,
  } = useExerciseStore();

  useEffect(() => {
    loadTemplates();
    loadExercises();
  }, []);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category as SportCategory);
    }
  }, [params.category]);

  useEffect(() => {
    filterTemplates(selectedCategory);
    setExCategory(selectedCategory);
  }, [selectedCategory, templates]);

  async function loadTemplates() {
    const t = await getAllWorkoutTemplates();
    setTemplates(t);
    setFiltered(t);
  }

  function filterTemplates(cat: SportCategory | 'all') {
    setFiltered(cat === 'all' ? templates : templates.filter((t) => t.category === cat));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Entraînement</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/workout/create' as never)}
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'workouts' && styles.activeTab]}
          onPress={() => setTab('workouts')}
        >
          <Text style={[styles.tabText, tab === 'workouts' && styles.activeTabText]}>
            Séances
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'exercises' && styles.activeTab]}
          onPress={() => setTab('exercises')}
        >
          <Text style={[styles.tabText, tab === 'exercises' && styles.activeTabText]}>
            Exercices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search (exercises only) */}
      {tab === 'exercises' && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un exercice..."
              placeholderTextColor={colors.textMuted}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>
      )}

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, selectedCategory === cat.key && styles.activeChip]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text
              style={[styles.chipText, selectedCategory === cat.key && styles.activeChipText]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {tab === 'workouts' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              template={item}
              onPress={(t) => router.push(`/workout/${t.id}` as never)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.createBanner}
              onPress={() => router.push('/workout/create' as never)}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={styles.createBannerText}>Créer une séance personnalisée</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              onPress={(e) => router.push(`/exercise/${e.id}` as never)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary },
  activeTabText: { color: '#fff' },

  searchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 44,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: typography.sm },

  categoryScroll: { marginBottom: spacing.md },
  categoryContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary },
  activeChipText: { color: '#fff' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm },
  createBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  createBannerText: { fontSize: typography.md, fontWeight: '600', color: colors.primary },
});
