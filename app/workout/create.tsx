import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Plus, Minus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { getAllExercises } from '@/db/database';
import type { Exercise, WorkoutTemplate, SportCategory, BodyTarget, WorkoutType, DifficultyLevel, Equipment } from '@/types';
import { getCategoryLabel, getCategoryEmoji, getMuscleLabel, getEquipmentLabel } from '@/utils/helpers';
import { useSessionStore } from '@/stores/sessionStore';
import { saveWorkoutTemplate } from '@/db/database';
import { generateId } from '@/utils/helpers';
import { Button } from '@/components/common/Button';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';

type Step = 'type' | 'params' | 'exercises' | 'review';

const DURATIONS = [15, 30, 45, 60, 90];

export default function CreateWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { startSession } = useSessionStore();
  const [step, setStep] = useState<Step>('type');
  const [category, setCategory] = useState<SportCategory>('strength');
  const [type, setType] = useState<WorkoutType>('strength');
  const [bodyTarget, setBodyTarget] = useState<BodyTarget>('full_body');
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [equipment, setEquipment] = useState<Equipment[]>(['barbell', 'dumbbells']);
  const [selectedExercises, setSelectedExercises] = useState<{ exercise: Exercise; sets: number; reps: number; rest: number }[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, [category]);

  async function loadExercises() {
    const exs = await getAllExercises(category);
    setAvailableExercises(exs);
  }

  function toggleEquipment(eq: Equipment) {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  function toggleExercise(exercise: Exercise) {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.exercise.id === exercise.id);
      if (exists) return prev.filter((e) => e.exercise.id !== exercise.id);
      return [
        ...prev,
        {
          exercise,
          sets: exercise.defaultSets ?? 3,
          reps: exercise.defaultReps ?? 10,
          rest: exercise.defaultRest ?? 60,
        },
      ];
    });
  }

  async function handleStart() {
    if (selectedExercises.length === 0) {
      Alert.alert('Ajoute au moins un exercice');
      return;
    }
    setLoading(true);
    const template: WorkoutTemplate = {
      id: generateId(),
      name: `Séance ${getCategoryLabel(category)} - ${new Date().toLocaleDateString('fr-FR')}`,
      category,
      type,
      bodyTarget,
      difficulty,
      estimatedDuration: duration,
      equipment,
      exercises: selectedExercises.map((e, i) => ({
        exerciseId: e.exercise.id,
        exercise: e.exercise,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        order: i + 1,
      })),
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    await saveWorkoutTemplate(template);
    const session = await startSession(template);
    setLoading(false);
    router.replace(`/session/${session.id}` as never);
  }

  const steps: Step[] = ['type', 'params', 'exercises', 'review'];
  const stepIndex = steps.indexOf(step);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (stepIndex > 0 ? setStep(steps[stepIndex - 1]) : router.back())}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Créer une séance</Text>
        <Text style={styles.stepIndicator}>{stepIndex + 1}/{steps.length}</Text>
      </View>

      {/* Step indicator */}
      <View style={styles.stepsRow}>
        {steps.map((s, i) => (
          <View
            key={s}
            style={[styles.stepDot, i <= stepIndex && styles.activeStepDot]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Type */}
        {step === 'type' && (
          <Section title="Type d'entraînement">
            {CATEGORIES.map((cat) => (
              <SelectCard
                key={cat.key}
                emoji={cat.emoji}
                label={cat.label}
                selected={category === cat.key}
                onPress={() => setCategory(cat.key as SportCategory)}
              />
            ))}
          </Section>
        )}

        {/* STEP 2: Params */}
        {step === 'params' && (
          <>
            <Section title="Durée souhaitée">
              <View style={styles.chipRow}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, duration === d && styles.activeChip]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[styles.chipText, duration === d && styles.activeChipText]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            <Section title="Partie du corps">
              <View style={styles.chipRow}>
                {BODY_TARGETS.map((b) => (
                  <TouchableOpacity
                    key={b.key}
                    style={[styles.chip, bodyTarget === b.key && styles.activeChip]}
                    onPress={() => setBodyTarget(b.key as BodyTarget)}
                  >
                    <Text style={[styles.chipText, bodyTarget === b.key && styles.activeChipText]}>
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            <Section title="Niveau">
              <View style={styles.chipRow}>
                {LEVELS.map((l) => (
                  <TouchableOpacity
                    key={l.key}
                    style={[styles.chip, difficulty === l.key && styles.activeChip]}
                    onPress={() => setDifficulty(l.key as DifficultyLevel)}
                  >
                    <Text style={[styles.chipText, difficulty === l.key && styles.activeChipText]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            <Section title="Équipement disponible">
              <View style={styles.chipRow}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <TouchableOpacity
                    key={eq.key}
                    style={[styles.chip, equipment.includes(eq.key as Equipment) && styles.activeChip]}
                    onPress={() => toggleEquipment(eq.key as Equipment)}
                  >
                    <Text style={[styles.chipText, equipment.includes(eq.key as Equipment) && styles.activeChipText]}>
                      {eq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          </>
        )}

        {/* STEP 3: Exercises */}
        {step === 'exercises' && (
          <Section title={`Sélectionne tes exercices (${selectedExercises.length} choisis)`}>
            {availableExercises.map((ex) => {
              const isSelected = selectedExercises.some((e) => e.exercise.id === ex.id);
              return (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => toggleExercise(ex)}
                  style={[styles.exSelectRow, isSelected && styles.exSelected]}
                  activeOpacity={0.75}
                >
                  <ExerciseCard exercise={ex} compact />
                  <View style={[styles.checkCircle, isSelected && styles.checkedCircle]}>
                    {isSelected && <Check size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Section>
        )}

        {/* STEP 4: Review */}
        {step === 'review' && (
          <Section title="Récapitulatif">
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Discipline</Text>
              <Text style={styles.reviewValue}>{getCategoryLabel(category)}</Text>
            </View>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Durée</Text>
              <Text style={styles.reviewValue}>{duration} min</Text>
            </View>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Exercices</Text>
              <Text style={styles.reviewValue}>{selectedExercises.length}</Text>
            </View>
            {selectedExercises.map((e, i) => (
              <View key={i} style={styles.reviewExRow}>
                <Text style={styles.reviewExNum}>{i + 1}</Text>
                <View style={styles.reviewExInfo}>
                  <Text style={styles.reviewExName}>{e.exercise.name}</Text>
                  <View style={styles.setsRow}>
                    <TouchableOpacity onPress={() => setSelectedExercises((prev) => prev.map((ex, idx) => idx === i ? { ...ex, sets: Math.max(1, ex.sets - 1) } : ex))}>
                      <Minus size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.setsText}>{e.sets} × {e.reps}</Text>
                    <TouchableOpacity onPress={() => setSelectedExercises((prev) => prev.map((ex, idx) => idx === i ? { ...ex, sets: ex.sets + 1 } : ex))}>
                      <Plus size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step !== 'review' ? (
          <Button
            title="Suivant"
            onPress={() => setStep(steps[stepIndex + 1])}
            fullWidth
            size="lg"
            icon={<ArrowRight size={20} color="#fff" />}
          />
        ) : (
          <Button
            title="Démarrer la séance"
            onPress={handleStart}
            loading={loading}
            fullWidth
            size="lg"
          />
        )}
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SelectCard({ emoji, label, selected, onPress }: { emoji: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.selectCard, selected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.selectEmoji}>{emoji}</Text>
      <Text style={[styles.selectLabel, selected && styles.selectedLabel]}>{label}</Text>
      {selected && <Check size={18} color={colors.primary} style={styles.checkMark} />}
    </TouchableOpacity>
  );
}

const CATEGORIES = [
  { key: 'strength', emoji: '💪', label: 'Musculation' },
  { key: 'football', emoji: '⚽', label: 'Football' },
  { key: 'rugby', emoji: '🏉', label: 'Rugby' },
  { key: 'cardio', emoji: '🏃', label: 'Cardio' },
  { key: 'stretching', emoji: '🧘', label: 'Étirements' },
];

const BODY_TARGETS = [
  { key: 'upper_body', label: 'Haut du corps' },
  { key: 'lower_body', label: 'Bas du corps' },
  { key: 'core', label: 'Core' },
  { key: 'full_body', label: 'Full body' },
];

const LEVELS = [
  { key: 'beginner', label: 'Débutant' },
  { key: 'intermediate', label: 'Intermédiaire' },
  { key: 'advanced', label: 'Avancé' },
];

const EQUIPMENT_OPTIONS = [
  { key: 'bodyweight', label: 'Poids du corps' },
  { key: 'dumbbells', label: 'Haltères' },
  { key: 'barbell', label: 'Barre' },
  { key: 'machine', label: 'Machine' },
  { key: 'cable', label: 'Poulie' },
  { key: 'kettlebell', label: 'Kettlebell' },
  { key: 'resistance_band', label: 'Élastiques' },
  { key: 'pull_up_bar', label: 'Barre traction' },
];

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
  title: { flex: 1, fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  stepIndicator: { fontSize: typography.sm, color: colors.textSecondary },

  stepsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgElevated,
  },
  activeStepDot: { backgroundColor: colors.primary },

  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 100 },

  section: { gap: spacing.md },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },

  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  selectedCard: { borderColor: colors.primary + '60', backgroundColor: colors.primary + '08' },
  selectEmoji: { fontSize: 24 },
  selectLabel: { flex: 1, fontSize: typography.md, fontWeight: '600', color: colors.textSecondary },
  selectedLabel: { color: colors.textPrimary },
  checkMark: { marginLeft: 'auto' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary },
  activeChipText: { color: '#fff' },

  exSelectRow: { position: 'relative' },
  exSelected: { opacity: 1 },
  checkCircle: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCircle: { backgroundColor: colors.primary, borderColor: colors.primary },

  reviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewLabel: { fontSize: typography.sm, color: colors.textSecondary },
  reviewValue: { fontSize: typography.sm, fontWeight: '700', color: colors.textPrimary },
  reviewExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewExNum: {
    width: 24,
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  reviewExInfo: { flex: 1 },
  reviewExName: { fontSize: typography.sm, fontWeight: '600', color: colors.textPrimary },
  setsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  setsText: { fontSize: typography.sm, color: colors.textSecondary },

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
