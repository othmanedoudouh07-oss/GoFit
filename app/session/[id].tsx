import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Timer,
  CheckCircle,
  SkipForward,
  Star,
  Dumbbell,
} from 'lucide-react-native';
import { useSessionStore } from '@/stores/sessionStore';
import { getExerciseById, getSessionById } from '@/db/database';
import type { Exercise, Session, SetLog } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { formatDuration } from '@/utils/helpers';
import { Button } from '@/components/common/Button';

const COACH_MOTIVATIONS = [
  'Allez, tu peux le faire ! 💪',
  'Dernière série, donne tout ! 🔥',
  'Belle technique, continue ! ✅',
  'Tu es plus fort(e) que tu ne le crois ! ⚡',
  'Chaque répétition compte ! 🎯',
  'Garde le rythme, tu gères ! 🏆',
];

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeSession, updateActiveSession, logSet, nextExercise, finishSession, abandonSession } =
    useSessionStore();

  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [showFinish, setShowFinish] = useState(false);
  const [rating, setRating] = useState(4);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Load session data
  useEffect(() => {
    if (activeSession) {
      setSession(activeSession.session);
      loadExercises(activeSession.session);
    } else if (id) {
      getSessionById(id).then((s) => {
        if (s) {
          setSession(s);
          loadExercises(s);
        }
      });
    }
  }, [id, activeSession?.session]);

  async function loadExercises(s: Session) {
    const map: Record<string, Exercise> = {};
    for (const log of s.exerciseLogs) {
      const ex = await getExerciseById(log.exerciseId);
      if (ex) map[log.exerciseId] = ex;
    }
    setExercises(map);
  }

  // Elapsed timer
  useEffect(() => {
    if (!activeSession) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  // Rest timer
  function startRest(seconds: number) {
    setRestTimer(seconds);
    setIsResting(true);
    restRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(restRef.current!);
          setIsResting(false);
          Vibration.vibrate([0, 200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (restRef.current) clearInterval(restRef.current);
    setIsResting(false);
    setRestTimer(0);
  }

  async function handleLogSet() {
    if (!activeSession) return;
    const { currentExerciseIndex, currentSetIndex } = activeSession;
    const currentLog = activeSession.session.exerciseLogs[currentExerciseIndex];
    const currentSet = currentLog.sets[currentSetIndex];

    const setLog: SetLog = {
      setNumber: currentSet.setNumber,
      reps: repsInput ? parseInt(repsInput, 10) : currentSet.reps,
      duration: currentSet.duration,
      weight: weightInput ? parseFloat(weightInput) : undefined,
      completed: true,
    };

    await logSet(currentExerciseIndex, currentSetIndex, setLog);

    const totalSets = currentLog.sets.length;
    const isLastSet = currentSetIndex >= totalSets - 1;

    const currentEx = exercises[currentLog.exerciseId];
    const restTime = currentEx?.defaultRest ?? 60;
    startRest(restTime);

    if (isLastSet) {
      const totalExercises = activeSession.session.exerciseLogs.length;
      if (currentExerciseIndex >= totalExercises - 1) {
        skipRest();
        setShowFinish(true);
      } else {
        setTimeout(() => nextExercise(), 500);
      }
    } else {
      updateActiveSession({ currentSetIndex: currentSetIndex + 1 });
    }
    setWeightInput('');
    setRepsInput('');
  }

  async function handleFinish() {
    await finishSession(rating);
    router.replace('/(tabs)/history');
  }

  function handleAbandon() {
    Alert.alert(
      'Abandonner la séance ?',
      'Ta progression sera perdue.',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: () => {
            abandonSession();
            router.back();
          },
        },
      ]
    );
  }

  if (!activeSession || !session) {
    // Show completed session summary
    if (session?.status === 'completed') {
      return <CompletedSession session={session} exercises={exercises} insets={insets} />;
    }
    return null;
  }

  const { currentExerciseIndex, currentSetIndex } = activeSession;
  const currentLog = session.exerciseLogs[currentExerciseIndex];
  const currentExercise = exercises[currentLog?.exerciseId ?? ''];
  const currentSet = currentLog?.sets[currentSetIndex];
  const totalSets = currentLog?.sets.length ?? 0;
  const coachMsg = COACH_MOTIVATIONS[currentSetIndex % COACH_MOTIVATIONS.length];

  if (showFinish) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.finishScreen}>
          <Text style={styles.finishEmoji}>🎉</Text>
          <Text style={styles.finishTitle}>Séance terminée !</Text>
          <Text style={styles.finishTime}>{formatDuration(elapsedSeconds)}</Text>
          <Text style={styles.finishSub}>Durée totale</Text>

          <Text style={styles.ratingLabel}>Note cette séance</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Star
                  size={36}
                  color={s <= rating ? '#f59e0b' : colors.textMuted}
                  fill={s <= rating ? '#f59e0b' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Voir le résumé" onPress={handleFinish} fullWidth size="lg" style={styles.finishBtn} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleAbandon}>
          <X size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.elapsed}>{formatDuration(elapsedSeconds)}</Text>
        <Text style={styles.progress}>
          {currentExerciseIndex + 1}/{session.exerciseLogs.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentExerciseIndex * totalSets + currentSetIndex) /
                (session.exerciseLogs.length * (totalSets || 1))) *
                100}%`,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise name */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{currentExercise?.name ?? currentLog?.exerciseId}</Text>
          <Text style={styles.setInfo}>
            Série {currentSetIndex + 1} sur {totalSets}
          </Text>
        </View>

        {/* Rest timer */}
        {isResting && (
          <View style={styles.restCard}>
            <Timer size={24} color={colors.accent} />
            <Text style={styles.restTime}>{restTimer}s</Text>
            <Text style={styles.restLabel}>Temps de repos</Text>
            <TouchableOpacity onPress={skipRest} style={styles.skipBtn}>
              <SkipForward size={16} color={colors.textSecondary} />
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coach tip */}
        {currentExercise?.coachTips[currentSetIndex % (currentExercise.coachTips.length || 1)] && (
          <View style={styles.coachCard}>
            <Text style={styles.coachMsg}>
              💬 {currentExercise.coachTips[currentSetIndex % currentExercise.coachTips.length]}
            </Text>
          </View>
        )}

        {/* Motivation */}
        <Text style={styles.motivation}>{coachMsg}</Text>

        {/* Set log inputs */}
        {!isResting && (
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Poids (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  placeholder={currentSet?.weight?.toString() ?? '0'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {currentSet?.duration ? 'Durée (s)' : 'Répétitions'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={repsInput}
                  onChangeText={setRepsInput}
                  keyboardType="numeric"
                  placeholder={
                    (currentSet?.reps ?? currentSet?.duration ?? 0).toString()
                  }
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Button
              title="Valider la série"
              onPress={handleLogSet}
              fullWidth
              size="lg"
              icon={<CheckCircle size={20} color="#fff" />}
            />
          </View>
        )}

        {/* Previous sets */}
        {currentSetIndex > 0 && (
          <View style={styles.prevSets}>
            <Text style={styles.prevTitle}>Séries précédentes</Text>
            {currentLog.sets.slice(0, currentSetIndex).map((s, i) => (
              <View key={i} style={styles.prevRow}>
                <Text style={styles.prevSet}>Série {i + 1}</Text>
                <Text style={styles.prevValue}>
                  {s.weight ? `${s.weight}kg × ` : ''}{s.reps ?? s.duration ?? 0}
                  {s.duration ? 's' : ' reps'}
                </Text>
                <CheckCircle size={14} color={colors.success} />
              </View>
            ))}
          </View>
        )}

        {/* Exercise navigation */}
        <View style={styles.navRow}>
          {currentExerciseIndex > 0 && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() =>
                updateActiveSession({ currentExerciseIndex: currentExerciseIndex - 1, currentSetIndex: 0 })
              }
            >
              <ChevronLeft size={18} color={colors.textSecondary} />
              <Text style={styles.navText}>Précédent</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navBtn, styles.skipExBtn]}
            onPress={() => {
              if (currentExerciseIndex < session.exerciseLogs.length - 1) {
                nextExercise();
              } else {
                setShowFinish(true);
              }
            }}
          >
            <Text style={styles.navText}>Passer l'exercice</Text>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function CompletedSession({
  session,
  exercises,
  insets,
}: {
  session: Session;
  exercises: Record<string, Exercise>;
  insets: { top: number; bottom: number };
}) {
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.elapsed}>Résumé séance</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + 40 }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={styles.finishTitle}>{session.name}</Text>
          <Text style={styles.finishTime}>{session.duration ? formatDuration(session.duration * 60) : '—'}</Text>
          {session.caloriesBurned && (
            <Text style={{ color: colors.textSecondary }}>{session.caloriesBurned} kcal dépensées</Text>
          )}
        </View>
        {session.exerciseLogs.map((log) => {
          const ex = exercises[log.exerciseId];
          return (
            <View key={log.exerciseId} style={styles.prevSets}>
              <Text style={styles.prevTitle}>{ex?.name ?? log.exerciseId}</Text>
              {log.sets.filter((s) => s.completed).map((s, i) => (
                <View key={i} style={styles.prevRow}>
                  <Text style={styles.prevSet}>Série {i + 1}</Text>
                  <Text style={styles.prevValue}>
                    {s.weight ? `${s.weight}kg × ` : ''}{s.reps ?? s.duration ?? 0}
                    {s.duration ? 's' : ' reps'}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  elapsed: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary },
  progress: { fontSize: typography.sm, color: colors.textSecondary },

  progressBar: {
    height: 3,
    backgroundColor: colors.bgElevated,
    marginHorizontal: spacing.lg,
    borderRadius: 2,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },

  exerciseHeader: { alignItems: 'center', gap: spacing.sm },
  exerciseName: {
    fontSize: typography.xxxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  setInfo: { fontSize: typography.lg, color: colors.textSecondary },

  restCard: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  restTime: { fontSize: 56, fontWeight: '800', color: colors.accent },
  restLabel: { fontSize: typography.sm, color: colors.textSecondary },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  skipText: { fontSize: typography.sm, color: colors.textSecondary },

  coachCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  coachMsg: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: 20 },

  motivation: {
    fontSize: typography.md,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  inputCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  inputRow: { flexDirection: 'row', gap: spacing.lg },
  inputGroup: { flex: 1, gap: spacing.sm },
  inputLabel: { fontSize: typography.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  divider: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch' },

  prevSets: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  prevTitle: { fontSize: typography.sm, fontWeight: '700', color: colors.textSecondary },
  prevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  prevSet: { fontSize: typography.sm, color: colors.textMuted, width: 60 },
  prevValue: { flex: 1, fontSize: typography.sm, color: colors.textPrimary, fontWeight: '600' },

  navRow: { flexDirection: 'row', gap: spacing.md },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipExBtn: { borderColor: colors.border },
  navText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '600' },

  // Finish screen
  finishScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  finishEmoji: { fontSize: 80 },
  finishTitle: { fontSize: typography.xxxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  finishTime: { fontSize: 60, fontWeight: '800', color: colors.primary },
  finishSub: { fontSize: typography.md, color: colors.textSecondary },
  ratingLabel: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xl },
  stars: { flexDirection: 'row', gap: spacing.md },
  finishBtn: { marginTop: spacing.xl, width: '100%' },
});
