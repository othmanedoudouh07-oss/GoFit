import { create } from 'zustand';
import type { Exercise, SportCategory, MuscleGroup } from '@/types';
import { getAllExercises, getExerciseById, searchExercises } from '@/db/database';

interface ExerciseState {
  exercises: Exercise[];
  filteredExercises: Exercise[];
  selectedExercise: Exercise | null;
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: SportCategory | 'all';
  selectedMuscle: MuscleGroup | 'all';
  loadExercises: (category?: string) => Promise<void>;
  loadExerciseById: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => Promise<void>;
  setSelectedCategory: (category: SportCategory | 'all') => Promise<void>;
  setSelectedMuscle: (muscle: MuscleGroup | 'all') => void;
  resetFilters: () => void;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  filteredExercises: [],
  selectedExercise: null,
  isLoading: false,
  searchQuery: '',
  selectedCategory: 'all',
  selectedMuscle: 'all',

  loadExercises: async (category) => {
    set({ isLoading: true });
    const exercises = await getAllExercises(category);
    set({ exercises, filteredExercises: exercises, isLoading: false });
  },

  loadExerciseById: async (id) => {
    const exercise = await getExerciseById(id);
    set({ selectedExercise: exercise });
  },

  setSearchQuery: async (query) => {
    set({ searchQuery: query });
    if (query.length >= 2) {
      const results = await searchExercises(query);
      const { selectedCategory, selectedMuscle } = get();
      const filtered = filterLocal(results, selectedCategory, selectedMuscle);
      set({ filteredExercises: filtered });
    } else {
      const { exercises, selectedCategory, selectedMuscle } = get();
      const filtered = filterLocal(exercises, selectedCategory, selectedMuscle);
      set({ filteredExercises: filtered });
    }
  },

  setSelectedCategory: async (category) => {
    set({ selectedCategory: category });
    const exercises = await getAllExercises(category === 'all' ? undefined : category);
    const { selectedMuscle, searchQuery } = get();
    let filtered = filterLocal(exercises, 'all', selectedMuscle);
    if (searchQuery.length >= 2) {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    set({ exercises, filteredExercises: filtered });
  },

  setSelectedMuscle: (muscle) => {
    set({ selectedMuscle: muscle });
    const { exercises, selectedCategory, searchQuery } = get();
    let filtered = filterLocal(exercises, selectedCategory, muscle);
    if (searchQuery.length >= 2) {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    set({ filteredExercises: filtered });
  },

  resetFilters: () => {
    const { exercises } = get();
    set({
      filteredExercises: exercises,
      searchQuery: '',
      selectedCategory: 'all',
      selectedMuscle: 'all',
    });
  },
}));

function filterLocal(
  exercises: Exercise[],
  category: SportCategory | 'all',
  muscle: MuscleGroup | 'all'
): Exercise[] {
  return exercises.filter((e) => {
    const categoryMatch = category === 'all' || e.category === category;
    const muscleMatch =
      muscle === 'all' ||
      e.primaryMuscle === muscle ||
      e.muscleGroups.includes(muscle);
    return categoryMatch && muscleMatch;
  });
}
