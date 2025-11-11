import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";
import { useDailyPlanStore } from "@state/dailyPlanStore";

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
const getTodayKey = () => formatDateKey(new Date());

const MAX_SAVED_DAYS = 14;

type PlanDayOverrides = {
  practiced: Record<string, boolean>;
  ordered: string[];
};

const createEmptyOverrides = (): PlanDayOverrides => ({
  practiced: {},
  ordered: []
});

const cloneOverrides = (overrides: PlanDayOverrides): PlanDayOverrides => ({
  practiced: { ...overrides.practiced },
  ordered: [...overrides.ordered]
});

const pruneOverrides = (overrides: Record<string, PlanDayOverrides>) => {
  const entries = Object.entries(overrides);
  if (entries.length <= MAX_SAVED_DAYS) {
    return overrides;
  }

  entries.sort(([a], [b]) => (a < b ? -1 : 1));
  const trimmed = entries.slice(entries.length - MAX_SAVED_DAYS);
  return Object.fromEntries(trimmed);
};

type WeeksState = {
  currentDateKey: string;
  lastPlanResetAt?: number;
  practicedOverrides: Record<string, boolean>;
  orderedLessonIds: string[];
  overridesByDate: Record<string, PlanDayOverrides>;
  resetDailyPlan: () => void;
  togglePractice: (lessonId: string) => boolean;
  setLessonPracticeStatus: (lessonId: string, practiced: boolean) => void;
  setLessonOrdering: (orderedLessonIds: string[]) => void;
  setActiveDate: (dateKey: string, options?: { reset?: boolean }) => void;
};

const persistCurrentOverrides = (
  state: WeeksState,
  practiced: Record<string, boolean>,
  ordered: string[]
) =>
  pruneOverrides({
    ...state.overridesByDate,
    [state.currentDateKey]: {
      practiced,
      ordered
    }
  });

export const useWeeksStore = create<WeeksState>()(
  persist(
    (set, get) => {
      const todayKey = getTodayKey();
      return {
        currentDateKey: todayKey,
        lastPlanResetAt: undefined,
        practicedOverrides: {},
        orderedLessonIds: [],
        overridesByDate: {},
        setActiveDate: (dateKey, options) => {
          const targetKey = dateKey || getTodayKey();
          set((state) => {
            const baseOverrides = options?.reset
              ? createEmptyOverrides()
              : cloneOverrides(state.overridesByDate[targetKey] ?? createEmptyOverrides());

            const nextOverridesByDate = pruneOverrides({
              ...state.overridesByDate,
              [targetKey]: baseOverrides
            });

            return {
              currentDateKey: targetKey,
              practicedOverrides: { ...baseOverrides.practiced },
              orderedLessonIds: [...baseOverrides.ordered],
              overridesByDate: nextOverridesByDate
            };
          });
        },
        togglePractice: (lessonId) => {
          if (!lessonId) {
            return false;
          }
          let nextValue = false;
          set((state) => {
            const practiced = { ...state.practicedOverrides };
            const ordered = [...state.orderedLessonIds];
            if (practiced[lessonId]) {
              delete practiced[lessonId];
              nextValue = false;
            } else {
              practiced[lessonId] = true;
              nextValue = true;
            }
            return {
              practicedOverrides: practiced,
              overridesByDate: persistCurrentOverrides(state, practiced, ordered)
            };
          });
          return nextValue;
        },
        setLessonPracticeStatus: (lessonId, practiced) => {
          if (!lessonId) {
            return;
          }
          set((state) => {
            const nextPracticed = { ...state.practicedOverrides };
            const ordered = [...state.orderedLessonIds];
            if (practiced) {
              nextPracticed[lessonId] = true;
            } else {
              delete nextPracticed[lessonId];
            }
            return {
              practicedOverrides: nextPracticed,
              overridesByDate: persistCurrentOverrides(state, nextPracticed, ordered)
            };
          });
        },
        setLessonOrdering: (orderedLessonIds) => {
          set((state) => {
            const normalized = Array.from(
              new Set(orderedLessonIds.filter((lessonId) => Boolean(lessonId)))
            );
            const practiced = { ...state.practicedOverrides };
            return {
              orderedLessonIds: normalized,
              overridesByDate: persistCurrentOverrides(state, practiced, normalized)
            };
          });
        },
        resetDailyPlan: () => {
          useDailyPlanStore.getState().reset();
          get().setActiveDate(getTodayKey(), { reset: true });
          set({ lastPlanResetAt: Date.now() });
        }
      };
    },
    {
      name: "grp-weeks-store",
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setActiveDate(state.currentDateKey ?? getTodayKey());
      }
    }
  )
);
