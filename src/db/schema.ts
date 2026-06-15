import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'gofit.db';

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      muscle_groups TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      equipment TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT NOT NULL,
      coach_tips TEXT NOT NULL,
      common_mistakes TEXT NOT NULL,
      image_url TEXT,
      video_url TEXT,
      default_sets INTEGER DEFAULT 3,
      default_reps INTEGER DEFAULT 10,
      default_duration INTEGER,
      default_rest INTEGER DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      body_target TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_duration INTEGER NOT NULL,
      exercises TEXT NOT NULL,
      equipment TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      program_id TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workout_template_id TEXT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      duration INTEGER,
      status TEXT NOT NULL DEFAULT 'planned',
      exercise_logs TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      calories_burned INTEGER,
      rating INTEGER,
      coach_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      objective TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_weeks INTEGER NOT NULL,
      sessions_per_week INTEGER NOT NULL,
      weeks TEXT NOT NULL,
      equipment TEXT NOT NULL,
      image_url TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_programs (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      current_week INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      completed_sessions TEXT DEFAULT '[]',
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      name TEXT NOT NULL DEFAULT 'Athlete',
      age INTEGER,
      weight REAL,
      height REAL,
      gender TEXT,
      objective TEXT,
      level TEXT NOT NULL DEFAULT 'beginner',
      sports TEXT NOT NULL DEFAULT '[]',
      preferred_equipment TEXT NOT NULL DEFAULT '[]',
      onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (exercise_id, date)
    );

    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    );
  `);
}
