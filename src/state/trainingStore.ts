import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";

export type TrainingWeekProgress = {
  id: string;
  completedLessons: string[];
  notes: string;
};

type TrainingState = {
  activeWeekId: string | null;
  weeks: Record<string, TrainingWeekProgress>;
  setActiveWeek: (weekId: string) => void;
  toggleLesson: (weekId: string, lessonId: string) => void;
  updateNotes: (weekId: string, notes: string) => void;
};

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      activeWeekId: null,
      weeks: {},
      setActiveWeek: (weekId) =>
        set({
          activeWeekId: weekId
        }),
      toggleLesson: (weekId, lessonId) => {
        const weeks = { ...get().weeks };
        const target = weeks[weekId] ?? {
          id: weekId,
          completedLessons: [],
          notes: ""
        };

        const completedLessons = new Set(target.completedLessons);
        if (completedLessons.has(lessonId)) {
          completedLessons.delete(lessonId);
        } else {
          completedLessons.add(lessonId);
        }

        weeks[weekId] = {
          ...target,
          completedLessons: Array.from(completedLessons)
        };

        set({ weeks });
      },
      updateNotes: (weekId, notes) => {
        const weeks = { ...get().weeks };
        const target = weeks[weekId] ?? {
          id: weekId,
          completedLessons: [],
          notes: ""
        };

        weeks[weekId] = {
          ...target,
          notes
        };

        set({ weeks });
      }
    }),
    {
      name: "grp-training-store",
      storage: createJSONStorage(() => mmkvStorage)
    }
  )
);
