import { useCallback, useSyncExternalStore } from "react";
import { MMKV } from "react-native-mmkv";

const STORAGE_ID = "grp-daily-steps";
const STORAGE_KEY = "daily-steps/v1";
const FLUSH_DELAY_MS = 150;

type LessonStepMap = Record<string, string>;
type DailyStepsState = Record<string, LessonStepMap>;

type PendingToggle = {
  lessonId: string;
  stepKey: string | number;
};

const storage = new MMKV({ id: STORAGE_ID });
const listeners = new Set<() => void>();
let flushHandle: ReturnType<typeof setTimeout> | null = null;
let cachedState: DailyStepsState = loadInitialState();

const defaultLessonSnapshot: LessonStepMap = {};

function loadInitialState(): DailyStepsState {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

const scheduleFlush = () => {
  if (flushHandle) {
    clearTimeout(flushHandle);
  }
  flushHandle = setTimeout(() => {
    storage.set(STORAGE_KEY, JSON.stringify(cachedState));
    flushHandle = null;
  }, FLUSH_DELAY_MS);
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const setState = (updater: (prev: DailyStepsState) => DailyStepsState) => {
  const nextState = updater(cachedState);
  if (nextState === cachedState) {
    return;
  }
  cachedState = nextState;
  notify();
  scheduleFlush();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
const getTodayKey = () => formatDateKey(new Date());

const sanitizeStepKey = (index: number | string) => `${index}`;

const toggleStepInternal = ({ lessonId, stepKey }: PendingToggle) => {
  const normalizedKey = sanitizeStepKey(stepKey);
  const todayKey = getTodayKey();
  setState((prev) => {
    const nextState: DailyStepsState = { ...prev };
    const existingLesson = nextState[lessonId] ?? {};
    const nextLesson: LessonStepMap = { ...existingLesson };

    if (existingLesson[normalizedKey] === todayKey) {
      delete nextLesson[normalizedKey];
    } else {
      nextLesson[normalizedKey] = todayKey;
    }

    if (Object.keys(nextLesson).length === 0) {
      delete nextState[lessonId];
    } else {
      nextState[lessonId] = nextLesson;
    }

    return nextState;
  });
};

const clearLessonInternal = (lessonId: string) => {
  setState((prev) => {
    if (!prev[lessonId]) {
      return prev;
    }
    const nextState = { ...prev };
    delete nextState[lessonId];
    return nextState;
  });
};

const getLessonSnapshot = (lessonId: string) => cachedState[lessonId] ?? defaultLessonSnapshot;

export const useLessonStepChecklist = (lessonId: string, stepCount: number) => {
  const lessonSnapshot = useSyncExternalStore(
    subscribe,
    () => getLessonSnapshot(lessonId),
    () => defaultLessonSnapshot
  );

  const todayKey = getTodayKey();
  const completed = Array.from({ length: stepCount }, (_, index) => {
    const key = sanitizeStepKey(index);
    return lessonSnapshot[key] === todayKey;
  });

  const toggleStep = useCallback(
    (stepIndex: number) => {
      toggleStepInternal({ lessonId, stepKey: stepIndex });
    },
    [lessonId]
  );

  const resetSteps = useCallback(() => {
    clearLessonInternal(lessonId);
  }, [lessonId]);

  return {
    completed,
    toggleStep,
    resetSteps
  };
};

export const getLessonStepSnapshot = (lessonId: string) => ({
  lessonId,
  steps: getLessonSnapshot(lessonId)
});

export const resetDailyStepsForTests = () => {
  cachedState = {};
  storage.delete(STORAGE_KEY);
  if (flushHandle) {
    clearTimeout(flushHandle);
    flushHandle = null;
  }
  notify();
};
