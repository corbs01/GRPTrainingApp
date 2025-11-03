import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mmkvStorage } from "@lib/index";

type DailyPlanKey = string;

export type DailyPlan = {
  id: DailyPlanKey;
  weekId: string;
  date: string;
  lessonIds: string[];
  practicedLessonIds: string[];
  generatedAt: number;
};

type DailyPlanState = {
  plans: Record<DailyPlanKey, DailyPlan>;
  ensurePlan: (weekId: string, date: string, lessonPool: string[]) => DailyPlan;
  toggleLesson: (weekId: string, date: string, lessonId: string) => void;
};

const dailyPlanKey = (weekId: string, date: string): DailyPlanKey => `${weekId}:${date}`;

const pickLessonSubset = (lessonPool: string[]): string[] => {
  const uniqueLessons = Array.from(new Set(lessonPool));
  if (uniqueLessons.length <= 3) {
    return uniqueLessons;
  }

  const maxCount = Math.min(5, uniqueLessons.length);
  const minCount = 3;
  const targetCount = Math.max(minCount, maxCount === minCount ? minCount : Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount);

  const selection: string[] = [];
  const available = [...uniqueLessons];
  while (selection.length < targetCount && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    const [lessonId] = available.splice(index, 1);
    selection.push(lessonId);
  }

  return selection;
};

export const useDailyPlanStore = create<DailyPlanState>()(
  persist(
    (set, get) => ({
      plans: {},
      ensurePlan: (weekId, date, lessonPool) => {
        const key = dailyPlanKey(weekId, date);
        const existingPlan = get().plans[key];
        const normalizedPool = lessonPool.filter(Boolean);

        if (normalizedPool.length === 0) {
          return (
            existingPlan ?? {
              id: key,
              weekId,
              date,
              lessonIds: [],
              practicedLessonIds: [],
              generatedAt: Date.now()
            }
          );
        }

        const shouldRegenerate =
          !existingPlan ||
          existingPlan.lessonIds.length === 0 ||
          existingPlan.lessonIds.some((lessonId) => !normalizedPool.includes(lessonId));

        if (!shouldRegenerate) {
          return existingPlan;
        }

        const lessonIds = pickLessonSubset(normalizedPool);
        const nextPlan: DailyPlan = {
          id: key,
          weekId,
          date,
          lessonIds,
          practicedLessonIds: existingPlan?.practicedLessonIds.filter((lessonId) =>
            lessonIds.includes(lessonId)
          ) ?? [],
          generatedAt: Date.now()
        };

        set((state) => ({
          plans: {
            ...state.plans,
            [key]: nextPlan
          }
        }));

        return nextPlan;
      },
      toggleLesson: (weekId, date, lessonId) => {
        const key = dailyPlanKey(weekId, date);
        const plan = get().plans[key];
        if (!plan || !plan.lessonIds.includes(lessonId)) {
          return;
        }

        const practiced = new Set(plan.practicedLessonIds);
        if (practiced.has(lessonId)) {
          practiced.delete(lessonId);
        } else {
          practiced.add(lessonId);
        }

        set((state) => ({
          plans: {
            ...state.plans,
            [key]: {
              ...plan,
              practicedLessonIds: Array.from(practiced)
            }
          }
        }));
      }
    }),
    {
      name: "grp-daily-plan-store",
      storage: createJSONStorage(() => mmkvStorage)
    }
  )
);

export const getDailyPlanKey = dailyPlanKey;
