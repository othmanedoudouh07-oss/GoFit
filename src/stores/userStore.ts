import { create } from 'zustand';
import type { UserProfile } from '@/types';
import { getUserProfile, saveUserProfile } from '@/db/database';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'onboardingCompleted'>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true });
    const profile = await getUserProfile();
    set({ profile, isLoading: false });
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...updates };
    await saveUserProfile(updated);
    set({ profile: updated });
  },

  completeOnboarding: async (profileData) => {
    const profile: UserProfile = {
      ...profileData,
      id: 'default',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
    set({ profile });
  },
}));
