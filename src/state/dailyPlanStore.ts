import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  getDefaultWeek,
  getLessonSummariesFromIds,
  getWeekByNumber,
  WeekSummary
} from "@data/index";
import { mmkvStorage } from "@lib/index";
import { LessonEngagement, selectDailyLessons } from "./dailyPlanSelector";

type DailyPlanKey = string;

export type DailyPlan = {
  id: DailyPlanKey;
  weekId: string;
  date: string;
  lessonIds: string[];
  practicedLessonIds: string[];
  generatedAt: number;
};

export type DailyPlanView = DailyPlan & {
  lessons: ReturnType<typeof getLessonSummariesFromIds>;
};

type DailyPlanState = {
  plans: Record<DailyPlanKey, DailyPlan>;
  lessonEngagement: Record<string, LessonEngagement>;
  lastShownByWeek: Record<string, string>;
  ensurePlan: (weekId: string, date: string, lessonPool: string[]) => DailyPlan;
  toggleLesson: (weekId: string, date: string, lessonId: string) => void;
  reorderLessons: (weekId: string, date: string, orderedLessonIds: string[]) => void;
  reset: () => void;
};

const dailyPlanKey = (weekId: string, date: string): DailyPlanKey => `${weekId}:${date}`;
const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

const getOrDefaultWeek = (weekNumber: number | null | undefined): WeekSummary | undefined => {
  if (weekNumber) {
    return getWeekByNumber(weekNumber) ?? getDefaultWeek();
  }
  return getDefaultWeek();
};

export const useDailyPlanStore = create<DailyPlanState>()(
  persist(
    (set, get) => ({
      plans: {},
      lessonEngagement: {},
      lastShownByWeek: {},
      ensurePlan: (weekId, date, lessonPool) => {
        const key = dailyPlanKey(weekId, date);
        const state = get();
        const existingPlan = state.plans[key];
        const normalizedPool = Array.from(new Set(lessonPool.filter(Boolean)));

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
          state.lastShownByWeek[weekId] !== date ||
          existingPlan.lessonIds.some((lessonId) => !normalizedPool.includes(lessonId));

        if (!shouldRegenerate) {
          return existingPlan;
        }

        const lessonIds = selectDailyLessons({
          lessonPool: normalizedPool,
          todayKey: date,
          engagement: state.lessonEngagement
        });

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

        const nextEngagement = { ...state.lessonEngagement };
        lessonIds.forEach((lessonId) => {
          nextEngagement[lessonId] = {
            ...(nextEngagement[lessonId] ?? {}),
            lastShownByDate: date
          };
        });

        set((draft) => ({
          plans: {
            ...draft.plans,
            [key]: nextPlan
          },
          lessonEngagement: nextEngagement,
          lastShownByWeek: {
            ...draft.lastShownByWeek,
            [weekId]: date
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
        const wasPracticed = practiced.has(lessonId);
        if (wasPracticed) {
          practiced.delete(lessonId);
        } else {
          practiced.add(lessonId);
        }

        const nextEngagement = { ...get().lessonEngagement };
        const existingMeta = nextEngagement[lessonId] ?? {};
        if (wasPracticed) {
          if (existingMeta.lastShownByDate) {
            nextEngagement[lessonId] = {
              lastShownByDate: existingMeta.lastShownByDate
            };
          } else {
            delete nextEngagement[lessonId];
          }
        } else {
          nextEngagement[lessonId] = {
            ...existingMeta,
            lastPracticedAt: Date.now()
          };
        }

        set((state) => ({
          plans: {
            ...state.plans,
            [key]: {
              ...plan,
              practicedLessonIds: Array.from(practiced)
            }
          },
          lessonEngagement: nextEngagement
        }));
      },
      reorderLessons: (weekId, date, orderedLessonIds) => {
        const key = dailyPlanKey(weekId, date);
        const plan = get().plans[key];
        if (!plan) {
          return;
        }

        const normalized = orderedLessonIds.filter((lessonId, index, list) => {
          return plan.lessonIds.includes(lessonId) && list.indexOf(lessonId) === index;
        });

        if (normalized.length !== plan.lessonIds.length) {
          return;
        }

        set((state) => ({
          plans: {
            ...state.plans,
            [key]: {
              ...plan,
              lessonIds: normalized
            }
          }
        }));
      },
      reset: () =>
        set({
          plans: {},
          lessonEngagement: {},
          lastShownByWeek: {}
        })
    }),
    {
      name: "grp-daily-plan-store",
      storage: createJSONStorage(() => mmkvStorage)
    }
  )
);

export const getDailyPlanKey = dailyPlanKey;

export const generateDailyPlan =
  (weekNumber: number | null | undefined) => (state: DailyPlanState): DailyPlanView | undefined => {
    const week = getOrDefaultWeek(weekNumber);
    if (!week) {
      return undefined;
    }

    const todayKey = formatDateKey(new Date());
    const lessonPool = week.lessonIds ?? [];
    if (lessonPool.length === 0) {
      return undefined;
    }

    const plan = state.ensurePlan(week.id, todayKey, lessonPool);
    if (!plan || plan.lessonIds.length === 0) {
      return undefined;
    }

    const lessons = getLessonSummariesFromIds(week.id, plan.lessonIds);
    return {
      ...plan,
      lessons
    };
  };
