import { create } from "zustand";

import { useDailyPlanStore } from "@state/dailyPlanStore";

type WeeksState = {
  lastPlanResetAt?: number;
  practicedOverrides: Record<string, boolean>;
  resetPlan: () => void;
  setLessonPracticeStatus: (lessonId: string, practiced: boolean) => void;
};

export const useWeeksStore = create<WeeksState>()((set) => ({
  lastPlanResetAt: undefined,
  practicedOverrides: {},
  resetPlan: () => {
    useDailyPlanStore.getState().reset();
    set({ lastPlanResetAt: Date.now(), practicedOverrides: {} });
  },
  setLessonPracticeStatus: (lessonId, practiced) => {
    if (!lessonId) {
      return;
    }
    set((state) => {
      const next = { ...state.practicedOverrides };
      if (practiced) {
        next[lessonId] = true;
      } else {
        delete next[lessonId];
      }
      return { practicedOverrides: next };
    });
  }
}));
