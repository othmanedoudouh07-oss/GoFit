import type { SportCategory, MuscleGroup, Equipment, DifficultyLevel } from '@/types';

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function getWeekDates(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

export function getCategoryLabel(category: SportCategory): string {
  const labels: Record<SportCategory, string> = {
    strength: 'Musculation',
    football: 'Football',
    rugby: 'Rugby',
    cardio: 'Cardio',
    stretching: 'Étirements',
  };
  return labels[category];
}

export function getCategoryEmoji(category: SportCategory): string {
  const emojis: Record<SportCategory, string> = {
    strength: '💪',
    football: '⚽',
    rugby: '🏉',
    cardio: '🏃',
    stretching: '🧘',
  };
  return emojis[category];
}

export function getMuscleLabel(muscle: MuscleGroup): string {
  const labels: Record<MuscleGroup, string> = {
    chest: 'Pectoraux',
    back: 'Dos',
    shoulders: 'Épaules',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Avant-bras',
    abs: 'Abdominaux',
    lower_back: 'Lombaires',
    glutes: 'Fessiers',
    quads: 'Quadriceps',
    hamstrings: 'Ischio-jambiers',
    calves: 'Mollets',
    full_body: 'Corps Entier',
    cardio: 'Cardio',
    flexibility: 'Flexibilité',
  };
  return labels[muscle];
}

export function getEquipmentLabel(equipment: Equipment): string {
  const labels: Record<Equipment, string> = {
    bodyweight: 'Poids du corps',
    dumbbells: 'Haltères',
    barbell: 'Barre',
    machine: 'Machine',
    resistance_band: 'Élastiques',
    kettlebell: 'Kettlebell',
    cable: 'Poulie',
    pull_up_bar: 'Barre de traction',
    bench: 'Banc',
    none: 'Aucun',
  };
  return labels[equipment];
}

export function getDifficultyLabel(level: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };
  return labels[level];
}

export function getDifficultyColor(level: DifficultyLevel): string {
  const colors: Record<DifficultyLevel, string> = {
    beginner: '#22c55e',
    intermediate: '#f59e0b',
    advanced: '#ef4444',
  };
  return colors[level];
}

export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Insuffisance pondérale';
  if (bmi < 25) return 'Poids normal';
  if (bmi < 30) return 'Surpoids';
  return 'Obésité';
}

export function estimateCalories(durationMin: number, weightKg: number = 70): number {
  return Math.round((durationMin * weightKg * 0.0862));
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}
