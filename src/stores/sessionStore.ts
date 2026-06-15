import { create } from 'zustand';
import type { Session, ExerciseLog, SetLog, WorkoutTemplate } from '@/types';
import {
  getAllSessions,
  saveSession,
  deleteSession as dbDeleteSession,
  updatePersonalRecord,
} from '@/db/database';
import { generateId } from '@/utils/helpers';

interface ActiveSession {
  session: Session;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restTimeRemaining: number;
  elapsedSeconds: number;
}

interface SessionState {
  sessions: Session[];
  activeSession: ActiveSession | null;
  isLoading: boolean;
  loadSessions: () => Promise<void>;
  startSession: (template: WorkoutTemplate) => Promise<Session>;
  updateActiveSession: (updates: Partial<ActiveSession>) => void;
  logSet: (exerciseIndex: number, setIndex: number, setLog: SetLog) => Promise<void>;
  nextExercise: () => void;
  finishSession: (rating?: number, notes?: string) => Promise<void>;
  abandonSession: () => void;
  deleteSession: (id: string) => Promise<void>;
  getSessionsByDate: (date: string) => Session[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,

  loadSessions: async () => {
    set({ isLoading: true });
    const sessions = await getAllSessions();
    set({ sessions, isLoading: false });
  },

  startSession: async (template) => {
    const now = new Date();
    const session: Session = {
      id: generateId(),
      workoutTemplateId: template.id,
      workoutTemplate: template,
      name: template.name,
      date: now.toISOString().split('T')[0],
      startTime: now.toISOString(),
      status: 'in_progress',
      exerciseLogs: template.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        sets: Array.from({ length: we.sets }, (_, i) => ({
          setNumber: i + 1,
          reps: we.reps,
          duration: we.duration,
          weight: we.weight,
          completed: false,
        })),
        skipped: false,
      })),
    };

    await saveSession(session);

    const activeSession: ActiveSession = {
      session,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
      elapsedSeconds: 0,
    };

    set({ activeSession });
    return session;
  },

  updateActiveSession: (updates) => {
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...updates }
        : null,
    }));
  },

  logSet: async (exerciseIndex, setIndex, setLog) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const updatedLogs = [...activeSession.session.exerciseLogs];
    updatedLogs[exerciseIndex] = {
      ...updatedLogs[exerciseIndex],
      sets: updatedLogs[exerciseIndex].sets.map((s, i) =>
        i === setIndex ? { ...s, ...setLog, completed: true } : s
      ),
    };

    const updatedSession: Session = {
      ...activeSession.session,
      exerciseLogs: updatedLogs,
    };

    await saveSession(updatedSession);

    if (setLog.weight && setLog.reps) {
      const exerciseLog = updatedLogs[exerciseIndex];
      await updatePersonalRecord({
        exerciseId: exerciseLog.exerciseId,
        exerciseName: exerciseLog.exercise?.name ?? exerciseLog.exerciseId,
        weight: setLog.weight,
        reps: setLog.reps,
        date: activeSession.session.date,
      });
    }

    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, session: updatedSession }
        : null,
    }));
  },

  nextExercise: () => {
    const { activeSession } = get();
    if (!activeSession) return;

    const totalExercises = activeSession.session.exerciseLogs.length;
    const nextIndex = activeSession.currentExerciseIndex + 1;

    if (nextIndex < totalExercises) {
      set((state) => ({
        activeSession: state.activeSession
          ? {
              ...state.activeSession,
              currentExerciseIndex: nextIndex,
              currentSetIndex: 0,
              isResting: false,
            }
          : null,
      }));
    }
  },

  finishSession: async (rating, notes) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const now = new Date();
    const startTime = new Date(activeSession.session.startTime!);
    const duration = Math.round((now.getTime() - startTime.getTime()) / 60000);

    const finishedSession: Session = {
      ...activeSession.session,
      endTime: now.toISOString(),
      duration,
      status: 'completed',
      rating,
      notes,
      caloriesBurned: Math.round(duration * 7),
    };

    await saveSession(finishedSession);

    set((state) => ({
      activeSession: null,
      sessions: [
        finishedSession,
        ...state.sessions.filter((s) => s.id !== finishedSession.id),
      ],
    }));
  },

  abandonSession: () => {
    set({ activeSession: null });
  },

  deleteSession: async (id) => {
    await dbDeleteSession(id);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    }));
  },

  getSessionsByDate: (date) => {
    return get().sessions.filter((s) => s.date === date);
  },
}));
