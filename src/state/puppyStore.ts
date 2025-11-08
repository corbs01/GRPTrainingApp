import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";
import { getWeekNumberFromDob } from "@lib/weekProgress";

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
  updateDob: (dobIso: string) => void;
  clearPuppy: () => void;
  getCurrentWeekNumber: () => number | null;
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
      updateDob: (dobIso) =>
        set((state) =>
          state.puppy
            ? {
                puppy: {
                  ...state.puppy,
                  dob: dobIso
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
        return dob ? getWeekNumberFromDob(dob) : null;
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
