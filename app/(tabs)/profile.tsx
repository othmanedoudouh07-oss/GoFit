import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Scale, Ruler, Target, Dumbbell, Edit2, Save } from 'lucide-react-native';
import { useUserStore } from '@/stores/userStore';
import { useSessionStore } from '@/stores/sessionStore';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { calculateBMI, getBMICategory, getMuscleLabel } from '@/utils/helpers';
import { Button } from '@/components/common/Button';
import type { DifficultyLevel } from '@/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUserStore();
  const { sessions } = useSessionStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    weight: profile?.weight?.toString() ?? '',
    height: profile?.height?.toString() ?? '',
    age: profile?.age?.toString() ?? '',
  });

  const completed = sessions.filter((s) => s.status === 'completed');
  const totalDuration = completed.reduce((acc, s) => acc + (s.duration ?? 0), 0);

  const bmi =
    profile?.weight && profile?.height
      ? calculateBMI(profile.weight, profile.height)
      : null;

  async function save() {
    await updateProfile({
      name: form.name,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      age: form.age ? parseInt(form.age, 10) : undefined,
    });
    setEditing(false);
    Alert.alert('Profil mis à jour', 'Tes informations ont été sauvegardées.');
  }

  const levels: { key: DifficultyLevel; label: string }[] = [
    { key: 'beginner', label: 'Débutant' },
    { key: 'intermediate', label: 'Intermédiaire' },
    { key: 'advanced', label: 'Avancé' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(profile?.name ?? 'A')[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.name ?? 'Athlete'}</Text>
          <Text style={styles.level}>
            {profile?.level === 'beginner' ? '🟢 Débutant'
              : profile?.level === 'intermediate' ? '🟡 Intermédiaire'
              : '🔴 Avancé'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? save() : setEditing(true))}
        >
          {editing ? <Save size={18} color={colors.primary} /> : <Edit2 size={18} color={colors.textSecondary} />}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Séances" value={completed.length} />
        <StatCard label="Heures" value={`${Math.round(totalDuration / 60)}h`} />
        {bmi && <StatCard label="IMC" value={bmi} />}
      </View>

      {/* Edit form */}
      {editing ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <LabelInput label="Prénom" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
          <LabelInput label="Âge" value={form.age} onChangeText={(v) => setForm((f) => ({ ...f, age: v }))} keyboardType="numeric" />
          <LabelInput label="Poids (kg)" value={form.weight} onChangeText={(v) => setForm((f) => ({ ...f, weight: v }))} keyboardType="decimal-pad" />
          <LabelInput label="Taille (cm)" value={form.height} onChangeText={(v) => setForm((f) => ({ ...f, height: v }))} keyboardType="numeric" />
          <Button title="Sauvegarder" onPress={save} fullWidth style={{ marginTop: spacing.md }} />
        </View>
      ) : (
        <>
          {/* Body info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations physiques</Text>
            <View style={styles.infoGrid}>
              {profile?.age && <InfoCard icon={<User size={18} color={colors.primary} />} label="Âge" value={`${profile.age} ans`} />}
              {profile?.weight && <InfoCard icon={<Scale size={18} color={colors.accent} />} label="Poids" value={`${profile.weight} kg`} />}
              {profile?.height && <InfoCard icon={<Ruler size={18} color="#a855f7" />} label="Taille" value={`${profile.height} cm`} />}
              {bmi && <InfoCard icon={<Target size={18} color="#f59e0b" />} label="IMC" value={`${bmi} — ${getBMICategory(bmi)}`} />}
            </View>
          </View>

          {/* Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niveau</Text>
            <View style={styles.levelRow}>
              {levels.map((l) => (
                <TouchableOpacity
                  key={l.key}
                  style={[styles.levelBtn, profile?.level === l.key && styles.activeLevelBtn]}
                  onPress={() => updateProfile({ level: l.key })}
                >
                  <Text style={[styles.levelText, profile?.level === l.key && styles.activeLevelText]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Objective */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectif</Text>
            <View style={styles.objGrid}>
              {OBJECTIVES.map((obj) => (
                <TouchableOpacity
                  key={obj.key}
                  style={[styles.objCard, profile?.objective === obj.key && styles.activeObjCard]}
                  onPress={() => updateProfile({ objective: obj.key as never })}
                >
                  <Text style={styles.objEmoji}>{obj.emoji}</Text>
                  <Text style={[styles.objLabel, profile?.objective === obj.key && styles.activeObjLabel]}>
                    {obj.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function LabelInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
        placeholder="—"
      />
    </View>
  );
}

const OBJECTIVES = [
  { key: 'muscle_gain', emoji: '💪', label: 'Prise de masse' },
  { key: 'fat_loss', emoji: '🔥', label: 'Perte de poids' },
  { key: 'strength', emoji: '🏋️', label: 'Force' },
  { key: 'endurance', emoji: '🏃', label: 'Endurance' },
  { key: 'general_fitness', emoji: '⚡', label: 'Forme générale' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: typography.xxl, fontWeight: '800', color: colors.primary },
  name: { fontSize: typography.xl, fontWeight: '800', color: colors.textPrimary },
  level: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  editBtn: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
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

  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoLabel: { fontSize: typography.xs, color: colors.textMuted },
  infoValue: { fontSize: typography.sm, fontWeight: '600', color: colors.textPrimary },

  levelRow: { flexDirection: 'row', gap: spacing.sm },
  levelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activeLevelBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelText: { fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary },
  activeLevelText: { color: '#fff' },

  objGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  objCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeObjCard: { borderColor: colors.primary + '60', backgroundColor: colors.primary + '10' },
  objEmoji: { fontSize: 24 },
  objLabel: { fontSize: typography.xs, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  activeObjLabel: { color: colors.primary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
    gap: spacing.md,
  },
  inputLabel: { fontSize: typography.sm, color: colors.textSecondary, width: 90 },
  input: { flex: 1, color: colors.textPrimary, fontSize: typography.md, fontWeight: '600' },
});
