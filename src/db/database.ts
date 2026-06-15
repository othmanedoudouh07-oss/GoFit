import * as SQLite from 'expo-sqlite';
import { initDatabase } from './schema';
import { seedDatabase } from './seed';
import type {
  Exercise,
  WorkoutTemplate,
  Session,
  Program,
  UserProgram,
  UserProfile,
  PersonalRecord,
  WorkoutExercise,
} from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('gofit.db');
    await initDatabase(db);
    await seedDatabase(db);
  }
  return db;
}

// ─── Exercises ────────────────────────────────────────────────────────────────

function parseExerciseRow(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Exercise['category'],
    muscleGroups: JSON.parse(row.muscle_groups as string),
    primaryMuscle: row.primary_muscle as Exercise['primaryMuscle'],
    equipment: JSON.parse(row.equipment as string),
    difficulty: row.difficulty as Exercise['difficulty'],
    description: row.description as string,
    instructions: JSON.parse(row.instructions as string),
    coachTips: JSON.parse(row.coach_tips as string),
    commonMistakes: JSON.parse(row.common_mistakes as string),
    imageUrl: (row.image_url as string) ?? undefined,
    videoUrl: (row.video_url as string) ?? undefined,
    defaultSets: (row.default_sets as number) ?? undefined,
    defaultReps: (row.default_reps as number) ?? undefined,
    defaultDuration: (row.default_duration as number) ?? undefined,
    defaultRest: (row.default_rest as number) ?? undefined,
  };
}

export async function getAllExercises(category?: string): Promise<Exercise[]> {
  const db = await getDatabase();
  const query = category
    ? `SELECT * FROM exercises WHERE category = ? ORDER BY name`
    : `SELECT * FROM exercises ORDER BY name`;
  const rows = category
    ? await db.getAllAsync<Record<string, unknown>>(query, [category])
    : await db.getAllAsync<Record<string, unknown>>(query);
  return rows.map(parseExerciseRow);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM exercises WHERE id = ?',
    [id]
  );
  return row ? parseExerciseRow(row) : null;
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM exercises WHERE name LIKE ? OR description LIKE ? ORDER BY name`,
    [`%${query}%`, `%${query}%`]
  );
  return rows.map(parseExerciseRow);
}

export async function getExercisesByMuscle(muscle: string): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM exercises WHERE primary_muscle = ? OR muscle_groups LIKE ? ORDER BY name`,
    [muscle, `%${muscle}%`]
  );
  return rows.map(parseExerciseRow);
}

// ─── Workout Templates ────────────────────────────────────────────────────────

function parseTemplateRow(row: Record<string, unknown>): WorkoutTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    category: row.category as WorkoutTemplate['category'],
    type: row.type as WorkoutTemplate['type'],
    bodyTarget: row.body_target as WorkoutTemplate['bodyTarget'],
    difficulty: row.difficulty as WorkoutTemplate['difficulty'],
    estimatedDuration: row.estimated_duration as number,
    exercises: JSON.parse(row.exercises as string),
    equipment: JSON.parse(row.equipment as string),
    createdAt: row.created_at as string,
    isCustom: Boolean(row.is_custom),
    programId: (row.program_id as string) ?? undefined,
  };
}

export async function getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM workout_templates ORDER BY created_at DESC'
  );
  return rows.map(parseTemplateRow);
}

export async function getWorkoutTemplateById(id: string): Promise<WorkoutTemplate | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM workout_templates WHERE id = ?',
    [id]
  );
  return row ? parseTemplateRow(row) : null;
}

export async function saveWorkoutTemplate(template: WorkoutTemplate): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_templates
      (id, name, description, category, type, body_target, difficulty,
       estimated_duration, exercises, equipment, created_at, is_custom, program_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      template.id,
      template.name,
      template.description ?? null,
      template.category,
      template.type,
      template.bodyTarget,
      template.difficulty,
      template.estimatedDuration,
      JSON.stringify(template.exercises),
      JSON.stringify(template.equipment),
      template.createdAt,
      template.isCustom ? 1 : 0,
      template.programId ?? null,
    ]
  );
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function parseSessionRow(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    workoutTemplateId: (row.workout_template_id as string) ?? undefined,
    name: row.name as string,
    date: row.date as string,
    startTime: (row.start_time as string) ?? undefined,
    endTime: (row.end_time as string) ?? undefined,
    duration: (row.duration as number) ?? undefined,
    status: row.status as Session['status'],
    exerciseLogs: JSON.parse(row.exercise_logs as string),
    notes: (row.notes as string) ?? undefined,
    caloriesBurned: (row.calories_burned as number) ?? undefined,
    rating: (row.rating as number) ?? undefined,
    coachNotes: (row.coach_notes as string) ?? undefined,
  };
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sessions ORDER BY date DESC'
  );
  return rows.map(parseSessionRow);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM sessions WHERE id = ?',
    [id]
  );
  return row ? parseSessionRow(row) : null;
}

export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sessions WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
  return rows.map(parseSessionRow);
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO sessions
      (id, workout_template_id, name, date, start_time, end_time, duration,
       status, exercise_logs, notes, calories_burned, rating, coach_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.workoutTemplateId ?? null,
      session.name,
      session.date,
      session.startTime ?? null,
      session.endTime ?? null,
      session.duration ?? null,
      session.status,
      JSON.stringify(session.exerciseLogs),
      session.notes ?? null,
      session.caloriesBurned ?? null,
      session.rating ?? null,
      session.coachNotes ?? null,
    ]
  );
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

// ─── Programs ─────────────────────────────────────────────────────────────────

function parseProgramRow(row: Record<string, unknown>): Program {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    category: row.category as Program['category'],
    objective: row.objective as string,
    difficulty: row.difficulty as Program['difficulty'],
    durationWeeks: row.duration_weeks as number,
    sessionsPerWeek: row.sessions_per_week as number,
    weeks: JSON.parse(row.weeks as string),
    equipment: JSON.parse(row.equipment as string),
    imageUrl: (row.image_url as string) ?? undefined,
    isCustom: Boolean(row.is_custom),
    createdAt: row.created_at as string,
  };
}

export async function getAllPrograms(): Promise<Program[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM programs ORDER BY name'
  );
  return rows.map(parseProgramRow);
}

export async function getProgramById(id: string): Promise<Program | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM programs WHERE id = ?',
    [id]
  );
  return row ? parseProgramRow(row) : null;
}

// ─── User Programs ────────────────────────────────────────────────────────────

function parseUserProgramRow(row: Record<string, unknown>): UserProgram {
  return {
    id: row.id as string,
    programId: row.program_id as string,
    startDate: row.start_date as string,
    currentWeek: row.current_week as number,
    isActive: Boolean(row.is_active),
    completedSessions: JSON.parse(row.completed_sessions as string),
  };
}

export async function getActiveUserProgram(): Promise<UserProgram | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM user_programs WHERE is_active = 1 LIMIT 1'
  );
  return row ? parseUserProgramRow(row) : null;
}

export async function saveUserProgram(userProgram: UserProgram): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_programs
      (id, program_id, start_date, current_week, is_active, completed_sessions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userProgram.id,
      userProgram.programId,
      userProgram.startDate,
      userProgram.currentWeek,
      userProgram.isActive ? 1 : 0,
      JSON.stringify(userProgram.completedSessions),
    ]
  );
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM user_profile WHERE id = ?',
    ['default']
  );
  if (!row) return null;
  return {
    id: row.id as string,
    name: row.name as string,
    age: (row.age as number) ?? undefined,
    weight: (row.weight as number) ?? undefined,
    height: (row.height as number) ?? undefined,
    gender: (row.gender as UserProfile['gender']) ?? undefined,
    objective: (row.objective as UserProfile['objective']) ?? undefined,
    level: row.level as UserProfile['level'],
    sports: JSON.parse(row.sports as string),
    preferredEquipment: JSON.parse(row.preferred_equipment as string),
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: row.created_at as string,
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile
      (id, name, age, weight, height, gender, objective, level, sports,
       preferred_equipment, onboarding_completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.name,
      profile.age ?? null,
      profile.weight ?? null,
      profile.height ?? null,
      profile.gender ?? null,
      profile.objective ?? null,
      profile.level,
      JSON.stringify(profile.sports),
      JSON.stringify(profile.preferredEquipment),
      profile.onboardingCompleted ? 1 : 0,
      profile.createdAt,
    ]
  );
}

// ─── Personal Records ─────────────────────────────────────────────────────────

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM personal_records ORDER BY date DESC'
  );
  return rows.map((row) => ({
    exerciseId: row.exercise_id as string,
    exerciseName: row.exercise_name as string,
    weight: row.weight as number,
    reps: row.reps as number,
    date: row.date as string,
  }));
}

export async function updatePersonalRecord(record: PersonalRecord): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM personal_records WHERE exercise_id = ?',
    [record.exerciseId]
  );

  if (!existing || record.weight > (existing.weight as number)) {
    await db.runAsync(
      `INSERT OR REPLACE INTO personal_records
        (exercise_id, exercise_name, weight, reps, date)
       VALUES (?, ?, ?, ?, ?)`,
      [record.exerciseId, record.exerciseName, record.weight, record.reps, record.date]
    );
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getWeeklySessionCount(weekStart: string, weekEnd: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions
     WHERE date >= ? AND date <= ? AND status = 'completed'`,
    [weekStart, weekEnd]
  );
  return result?.count ?? 0;
}

export async function getTotalSessionsCompleted(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'`
  );
  return result?.count ?? 0;
}
