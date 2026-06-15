// ─── Enums ───────────────────────────────────────────────────────────────────

export type SportCategory =
  | 'strength'
  | 'football'
  | 'rugby'
  | 'cardio'
  | 'stretching';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'full_body'
  | 'cardio'
  | 'flexibility';

export type Equipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'machine'
  | 'resistance_band'
  | 'kettlebell'
  | 'cable'
  | 'pull_up_bar'
  | 'bench'
  | 'none';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutType =
  | 'strength'
  | 'cardio'
  | 'mixed'
  | 'recovery'
  | 'sport_specific';

export type BodyTarget =
  | 'upper_body'
  | 'lower_body'
  | 'core'
  | 'full_body'
  | 'specific';

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

// ─── Exercise ────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  category: SportCategory;
  muscleGroups: MuscleGroup[];
  primaryMuscle: MuscleGroup;
  equipment: Equipment[];
  difficulty: DifficultyLevel;
  description: string;
  instructions: string[];
  coachTips: string[];
  commonMistakes: string[];
  imageUrl?: string;
  videoUrl?: string;
  defaultSets?: number;
  defaultReps?: number;
  defaultDuration?: number; // seconds, for timed exercises
  defaultRest?: number; // seconds
}

// ─── Workout Building ─────────────────────────────────────────────────────────

export interface WorkoutExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets: number;
  reps?: number;
  duration?: number; // seconds
  rest: number; // seconds
  weight?: number; // kg
  notes?: string;
  order: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: SportCategory;
  type: WorkoutType;
  bodyTarget: BodyTarget;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // minutes
  exercises: WorkoutExercise[];
  equipment: Equipment[];
  createdAt: string;
  isCustom: boolean;
  programId?: string;
}

// ─── Session (executed workout) ───────────────────────────────────────────────

export interface SetLog {
  setNumber: number;
  reps?: number;
  duration?: number;
  weight?: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion 1-10
}

export interface ExerciseLog {
  exerciseId: string;
  exercise?: Exercise;
  sets: SetLog[];
  notes?: string;
  skipped: boolean;
}

export interface Session {
  id: string;
  workoutTemplateId?: string;
  workoutTemplate?: WorkoutTemplate;
  name: string;
  date: string; // ISO date string
  startTime?: string;
  endTime?: string;
  duration?: number; // minutes
  status: SessionStatus;
  exerciseLogs: ExerciseLog[];
  notes?: string;
  caloriesBurned?: number;
  rating?: number; // 1-5
  coachNotes?: string;
}

// ─── Program ──────────────────────────────────────────────────────────────────

export interface ProgramWeek {
  weekNumber: number;
  workouts: {
    dayOfWeek: number; // 0=Monday, 6=Sunday
    workoutTemplateId: string;
    workoutTemplate?: WorkoutTemplate;
  }[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  category: SportCategory;
  objective: string;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  sessionsPerWeek: number;
  weeks: ProgramWeek[];
  equipment: Equipment[];
  imageUrl?: string;
  isCustom: boolean;
  createdAt: string;
}

export interface UserProgram {
  id: string;
  programId: string;
  program?: Program;
  startDate: string;
  currentWeek: number;
  isActive: boolean;
  completedSessions: string[]; // session IDs
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  gender?: 'male' | 'female' | 'other';
  objective?: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'general_fitness';
  level: DifficultyLevel;
  sports: SportCategory[];
  preferredEquipment: Equipment[];
  onboardingCompleted: boolean;
  createdAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface WeeklyStats {
  week: string; // ISO week
  sessionCount: number;
  totalDuration: number; // minutes
  totalVolume: number; // kg x reps
}

// ─── Coach ────────────────────────────────────────────────────────────────────

export interface CoachTip {
  id: string;
  message: string;
  type: 'motivation' | 'technique' | 'recovery' | 'nutrition' | 'progression';
  context?: string;
}

export interface CoachRecommendation {
  type: 'increase_weight' | 'add_session' | 'rest_day' | 'deload' | 'new_exercise';
  exerciseId?: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}
