import React from "react";
import { AppState } from "react-native";

import { useWeeksStore } from "@state/weeksStore";

const getTodayKey = () => new Date().toISOString().split("T")[0];

const getMsUntilNextMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = next.getTime() - now.getTime();
  return Math.max(diff, 1000);
};

export const useMidnightPlanReset = () => {
  const resetPlan = useWeeksStore((state) => state.resetPlan);
  const lastResetKeyRef = React.useRef<string>(getTodayKey());

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const maybeReset = () => {
      const todayKey = getTodayKey();
      if (lastResetKeyRef.current === todayKey) {
        return;
      }
      lastResetKeyRef.current = todayKey;
      resetPlan();
    };

    const scheduleNext = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        maybeReset();
        scheduleNext();
      }, getMsUntilNextMidnight());
    };

    scheduleNext();

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        maybeReset();
        scheduleNext();
      }
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      appStateSub.remove();
    };
  }, [resetPlan]);
};

