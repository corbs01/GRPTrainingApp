import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";

export type PuppySex = "female" | "male" | "unsure";

export type PuppyProfile = {
  name: string;
  dob: string;
  sex: PuppySex;
  photoUri?: string;
};

type PuppyState = {
  puppy: PuppyProfile | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setPuppy: (profile: PuppyProfile) => void;
  updatePhoto: (photoUri: string | undefined) => void;
  clearPuppy: () => void;
  getCurrentWeekNumber: () => number | null;
};

const calculateWeekNumber = (dobIso: string) => {
  const dob = new Date(dobIso);
  const now = new Date();

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const diff = now.getTime() - dob.getTime();
  if (diff < 0) {
    return 0;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
};

export const usePuppyStore = create<PuppyState>()(
  persist(
    (set, get) => ({
      puppy: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setPuppy: (profile) =>
        set({
          puppy: {
            ...profile,
            name: profile.name.trim()
          }
        }),
      updatePhoto: (photoUri) =>
        set((state) =>
          state.puppy
            ? {
                puppy: {
                  ...state.puppy,
                  photoUri
                }
              }
            : state
        ),
      clearPuppy: () =>
        set({
          puppy: null
        }),
      getCurrentWeekNumber: () => {
        const dob = get().puppy?.dob;
        return dob ? calculateWeekNumber(dob) : null;
      }
    }),
    {
      name: "grp-puppy-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        puppy: state.puppy
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);

export { calculateWeekNumber };
