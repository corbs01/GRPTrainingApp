import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";

export type TrainingWeekProgress = {
  id: string;
  completedLessons: string[];
  notes?: string;
  lessonNotes: Record<string, string>;
};

type TrainingState = {
  activeWeekId: string | null;
  weeks: Record<string, TrainingWeekProgress>;
  setActiveWeek: (weekId: string) => void;
  toggleLesson: (weekId: string, lessonId: string) => void;
  updateLessonNotes: (weekId: string, lessonId: string, notes: string) => void;
  reset: () => void;
};

const ensureWeekProgress = (
  weeks: Record<string, TrainingWeekProgress>,
  weekId: string
): TrainingWeekProgress => {
  const target = weeks[weekId];
  if (target) {
    return {
      notes: target.notes,
      ...target,
      lessonNotes: target.lessonNotes ?? {}
    };
  }

  return {
    id: weekId,
    completedLessons: [],
    notes: "",
    lessonNotes: {}
  };
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
        const target = ensureWeekProgress(weeks, weekId);

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
      updateLessonNotes: (weekId, lessonId, notes) => {
        const weeks = { ...get().weeks };
        const target = ensureWeekProgress(weeks, weekId);

        weeks[weekId] = {
          ...target,
          lessonNotes: {
            ...target.lessonNotes,
            [lessonId]: notes
          }
        };

        set({ weeks });
      },
      reset: () =>
        set({
          activeWeekId: null,
          weeks: {}
        })
    }),
    {
      name: "grp-training-store",
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
      migrate: (persistedState: any, version) => {
        if (!persistedState || version >= 1) {
          return persistedState;
        }

        const nextWeeks: Record<string, TrainingWeekProgress> = {};

        Object.entries(persistedState.weeks ?? {}).forEach(([weekId, value]: [string, any]) => {
          nextWeeks[weekId] = {
            id: value.id ?? weekId,
            completedLessons: value.completedLessons ?? [],
            notes: value.notes,
            lessonNotes: value.lessonNotes ?? {}
          };
        });

        return {
          ...persistedState,
          weeks: nextWeeks
        };
      }
    }
  )
);
