import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { Button } from '@/components/common/Button';
import type { DifficultyLevel, SportCategory, UserProfile } from '@/types';

const SPORTS: { key: SportCategory; emoji: string; label: string }[] = [
  { key: 'strength', emoji: '💪', label: 'Musculation' },
  { key: 'football', emoji: '⚽', label: 'Football' },
  { key: 'rugby', emoji: '🏉', label: 'Rugby' },
  { key: 'cardio', emoji: '🏃', label: 'Course / Cardio' },
  { key: 'stretching', emoji: '🧘', label: 'Yoga / Étirements' },
];

const OBJECTIVES = [
  { key: 'muscle_gain', emoji: '💪', label: 'Prise de masse' },
  { key: 'fat_loss', emoji: '🔥', label: 'Perte de poids' },
  { key: 'strength', emoji: '🏋️', label: 'Force' },
  { key: 'endurance', emoji: '🏃', label: 'Endurance' },
  { key: 'general_fitness', emoji: '⚡', label: 'Forme générale' },
];

type Step = 'welcome' | 'basics' | 'sports' | 'objective' | 'level';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useUserStore();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [sports, setSports] = useState<SportCategory[]>(['strength']);
  const [objective, setObjective] = useState('muscle_gain');
  const [level, setLevel] = useState<DifficultyLevel>('beginner');

  function toggleSport(sport: SportCategory) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  async function finish() {
    await completeOnboarding({
      name: name || 'Athlete',
      age: age ? parseInt(age, 10) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      objective: objective as UserProfile['objective'],
      level,
      sports,
      preferredEquipment: ['barbell', 'dumbbells'],
    });
    router.replace('/(tabs)');
  }

  const steps: Step[] = ['welcome', 'basics', 'sports', 'objective', 'level'];
  const stepIndex = steps.indexOf(step);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {step !== 'welcome' && (
        <View style={styles.progress}>
          {steps.slice(1).map((s, i) => (
            <View key={s} style={[styles.progressDot, i < stepIndex && styles.activeDot]} />
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'welcome' && (
          <View style={styles.welcome}>
            <Text style={styles.logo}>⚡ GoFit</Text>
            <Text style={styles.welcomeTitle}>Bienvenue dans ton coach sportif personnel</Text>
            <Text style={styles.welcomeSub}>
              Prépare, planifie et exécute tes séances. La musculation, le football, le rugby, le cardio — tout en un seul endroit.
            </Text>
            <Button
              title="Commencer →"
              onPress={() => setStep('basics')}
              size="lg"
              fullWidth
              style={styles.welcomeBtn}
            />
          </View>
        )}

        {step === 'basics' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Comment tu t'appelles ?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton prénom"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <Text style={[styles.stepTitle, { marginTop: spacing.xl }]}>Quelques infos physiques</Text>
            <Text style={styles.stepSub}>(optionnel, pour calculer ton IMC et tes calories)</Text>
            <View style={styles.infoRow}>
              <LabelInput label="Âge" value={age} onChange={setAge} keyboardType="numeric" />
              <LabelInput label="Poids (kg)" value={weight} onChange={setWeight} keyboardType="decimal-pad" />
              <LabelInput label="Taille (cm)" value={height} onChange={setHeight} keyboardType="numeric" />
            </View>
          </View>
        )}

        {step === 'sports' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quels sports pratiques-tu ?</Text>
            <Text style={styles.stepSub}>Sélectionne tout ce qui te correspond.</Text>
            {SPORTS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.selectCard, sports.includes(s.key) && styles.selectedCard]}
                onPress={() => toggleSport(s.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.selectEmoji}>{s.emoji}</Text>
                <Text style={[styles.selectLabel, sports.includes(s.key) && styles.selectedLabel]}>
                  {s.label}
                </Text>
                {sports.includes(s.key) && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'objective' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quel est ton objectif principal ?</Text>
            {OBJECTIVES.map((obj) => (
              <TouchableOpacity
                key={obj.key}
                style={[styles.selectCard, objective === obj.key && styles.selectedCard]}
                onPress={() => setObjective(obj.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.selectEmoji}>{obj.emoji}</Text>
                <Text style={[styles.selectLabel, objective === obj.key && styles.selectedLabel]}>
                  {obj.label}
                </Text>
                {objective === obj.key && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'level' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quel est ton niveau ?</Text>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l.key}
                style={[styles.selectCard, level === l.key && styles.selectedCard]}
                onPress={() => setLevel(l.key as DifficultyLevel)}
                activeOpacity={0.75}
              >
                <Text style={styles.selectEmoji}>{l.emoji}</Text>
                <View>
                  <Text style={[styles.selectLabel, level === l.key && styles.selectedLabel]}>{l.label}</Text>
                  <Text style={styles.levelDesc}>{l.desc}</Text>
                </View>
                {level === l.key && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {step !== 'welcome' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {step !== 'level' ? (
            <Button
              title="Suivant"
              onPress={() => setStep(steps[stepIndex + 1])}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              title="C'est parti ! 🚀"
              onPress={finish}
              fullWidth
              size="lg"
            />
          )}
          {stepIndex < steps.length - 1 && (
            <TouchableOpacity onPress={() => setStep(steps[stepIndex + 1])}>
              <Text style={styles.skip}>Passer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function LabelInput({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View style={styles.labelInput}>
      <Text style={styles.labelInputLabel}>{label}</Text>
      <TextInput
        style={styles.labelInputField}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder="—"
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const LEVELS = [
  { key: 'beginner', emoji: '🟢', label: 'Débutant', desc: 'Moins de 1 an d\'entraînement régulier' },
  { key: 'intermediate', emoji: '🟡', label: 'Intermédiaire', desc: '1 à 3 ans d\'entraînement' },
  { key: 'advanced', emoji: '🔴', label: 'Avancé', desc: 'Plus de 3 ans, base solide' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  progress: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgElevated,
  },
  activeDot: { backgroundColor: colors.primary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },

  welcome: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  logo: { fontSize: typography.display, fontWeight: '900', color: colors.primary },
  welcomeTitle: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeBtn: { marginTop: spacing.xl },

  stepContent: { gap: spacing.lg },
  stepTitle: { fontSize: typography.xxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  stepSub: { fontSize: typography.sm, color: colors.textSecondary, marginTop: -spacing.sm },

  input: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  infoRow: { gap: spacing.sm },
  labelInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  labelInputLabel: { fontSize: typography.sm, color: colors.textSecondary, width: 100 },
  labelInputField: { flex: 1, fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },

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
  selectEmoji: { fontSize: 28 },
  selectLabel: { flex: 1, fontSize: typography.md, fontWeight: '600', color: colors.textSecondary },
  selectedLabel: { color: colors.textPrimary },
  check: { fontSize: typography.lg, color: colors.primary },
  levelDesc: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  skip: { fontSize: typography.sm, color: colors.textMuted, padding: spacing.sm },
});
