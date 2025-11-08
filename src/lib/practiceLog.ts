import { useCallback, useSyncExternalStore } from "react";
import { MMKV } from "react-native-mmkv";

import { getAllWeeks, getWeek, WeekSummary } from "@data/index";

const STORAGE_ID = "grp-practice-log";
const STORAGE_KEY = "practice-log/v1";
const FLUSH_DELAY_MS = 150;

export type PracticeLogEntry = {
  id: string;
  lessonId: string;
  weekId?: string;
  practicedAt: number;
  dateKey: string;
  note?: string;
  mediaId?: string;
};

export type PracticeLogState = {
  entries: PracticeLogEntry[];
};

const storage = new MMKV({ id: STORAGE_ID });
const listeners = new Set<() => void>();
const defaultState: PracticeLogState = { entries: [] };
let flushHandle: ReturnType<typeof setTimeout> | null = null;
let cachedState: PracticeLogState = loadInitialState();
const getState = () => cachedState;
let lessonWeekMap: Map<string, string> | null = null;

type WeekLike = WeekSummary | string | number;

function loadInitialState(): PracticeLogState {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as PracticeLogState;
    if (!parsed || !Array.isArray(parsed.entries)) {
      return defaultState;
    }

    return {
      entries: parsed.entries
        .map(sanitizeEntry)
        .filter((entry): entry is PracticeLogEntry => Boolean(entry))
    };
  } catch {
    return defaultState;
  }
}

function sanitizeEntry(candidate: any): PracticeLogEntry | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  if (typeof candidate.lessonId !== "string" || typeof candidate.dateKey !== "string") {
    return null;
  }

  if (typeof candidate.practicedAt !== "number" || !Number.isFinite(candidate.practicedAt)) {
    return null;
  }

  const entry: PracticeLogEntry = {
    id: typeof candidate.id === "string" ? candidate.id : createEntryId(),
    lessonId: candidate.lessonId,
    weekId: typeof candidate.weekId === "string" ? candidate.weekId : undefined,
    practicedAt: candidate.practicedAt,
    dateKey: candidate.dateKey
  };

  if (typeof candidate.note === "string" && candidate.note.trim().length > 0) {
    entry.note = candidate.note.trim();
  }

  if (typeof candidate.mediaId === "string" && candidate.mediaId.trim().length > 0) {
    entry.mediaId = candidate.mediaId.trim();
  }

  return entry;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const scheduleFlush = () => {
  if (flushHandle) {
    clearTimeout(flushHandle);
  }
  flushHandle = setTimeout(() => {
    storage.set(STORAGE_KEY, JSON.stringify(cachedState));
    flushHandle = null;
  }, FLUSH_DELAY_MS);
};

const setState = (updater: (previous: PracticeLogState) => PracticeLogState) => {
  const nextState = updater(cachedState);
  if (nextState === cachedState) {
    return;
  }
  cachedState = nextState;
  notify();
  scheduleFlush();
};

const createEntryId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
export const getPracticeDateKey = (date: Date) => formatDateKey(date);
const getTodayKey = () => formatDateKey(new Date());
export const getPracticeEntries = (): PracticeLogEntry[] => [...getState().entries];

export const usePracticeEntries = () =>
  useSyncExternalStore(subscribe, () => getState().entries, () => defaultState.entries);

export const resetPracticeLogForTests = () => {
  cachedState = { ...defaultState, entries: [] };
  storage.delete(STORAGE_KEY);
  if (flushHandle) {
    clearTimeout(flushHandle);
    flushHandle = null;
  }
  notify();
};

const ensureLessonWeekMap = () => {
  if (lessonWeekMap) {
    return lessonWeekMap;
  }

  const nextMap = new Map<string, string>();
  getAllWeeks().forEach((week) => {
    week.lessonIds?.forEach((lessonId) => {
      if (lessonId) {
        nextMap.set(lessonId, week.id);
      }
    });
  });

  lessonWeekMap = nextMap;
  return lessonWeekMap;
};

const resolveWeekIdFromLesson = (lessonId: string): string | undefined => {
  return ensureLessonWeekMap().get(lessonId);
};

const resolveWeekId = (week: WeekLike): string | undefined => {
  if (typeof week === "string") {
    return week;
  }

  if (typeof week === "number") {
    return getWeek(week)?.id;
  }

  return week?.id;
};

const isPracticedOnDate = (lessonId: string, dateKey: string) =>
  cachedState.entries.some(
    (entry) => entry.lessonId === lessonId && entry.dateKey === dateKey
  );

const removePracticeForDate = (lessonId: string, dateKey: string) => {
  let removed = false;
  setState((prev) => {
    const nextEntries = prev.entries.filter((entry) => {
      if (!removed && entry.lessonId === lessonId && entry.dateKey === dateKey) {
        removed = true;
        return false;
      }
      return true;
    });

    if (!removed) {
      return prev;
    }

    return {
      ...prev,
      entries: nextEntries
    };
  });
};

const attachNoteToDate = (lessonId: string, dateKey: string, note: string, mediaId?: string) => {
  const trimmed = note.trim();
  if (!trimmed) {
    return false;
  }

  let updated = false;
  setState((prev) => {
    const nextEntries = prev.entries.map((entry) => {
      if (!updated && entry.lessonId === lessonId && entry.dateKey === dateKey) {
        updated = true;
        return {
          ...entry,
          note: trimmed,
          mediaId: mediaId ?? entry.mediaId
        };
      }
      return entry;
    });

    if (!updated) {
      return prev;
    }

    return {
      ...prev,
      entries: nextEntries
    };
  });

  return updated;
};

export const logPractice = (lessonId: string, note?: string, mediaId?: string): PracticeLogEntry => {
  const entry: PracticeLogEntry = {
    id: createEntryId(),
    lessonId,
    weekId: resolveWeekIdFromLesson(lessonId),
    practicedAt: Date.now(),
    dateKey: getTodayKey()
  };

  const normalizedNote = note?.trim();
  if (normalizedNote) {
    entry.note = normalizedNote;
  }

  if (mediaId) {
    entry.mediaId = mediaId;
  }

  setState((prev) => {
    let nextEntries = prev.entries;
    const existingIndex = prev.entries.findIndex(
      (candidate) => candidate.lessonId === lessonId && candidate.dateKey === entry.dateKey
    );

    if (existingIndex >= 0) {
      const existing = prev.entries[existingIndex];
      entry.note = entry.note ?? existing.note;
      entry.mediaId = entry.mediaId ?? existing.mediaId;
      nextEntries = [
        ...prev.entries.slice(0, existingIndex),
        ...prev.entries.slice(existingIndex + 1)
      ];
    }

    return {
      ...prev,
      entries: [entry, ...nextEntries]
    };
  });

  return entry;
};

export const getPracticesByWeek = (week: WeekLike): PracticeLogEntry[] => {
  const weekId = resolveWeekId(week);
  if (!weekId) {
    return [];
  }

  return cachedState.entries
    .filter((entry) => entry.weekId === weekId)
    .sort((a, b) => b.practicedAt - a.practicedAt);
};

export const getNotesForLesson = (lessonId: string): PracticeLogEntry[] =>
  cachedState.entries.filter((entry) => entry.lessonId === lessonId && entry.note);

export const usePractice = (lessonId: string) => {
  const practicedToday = useSyncExternalStore(
    subscribe,
    () => isPracticedOnDate(lessonId, getTodayKey()),
    () => false
  );

  const toggle = useCallback(() => {
    if (practicedToday) {
      removePracticeForDate(lessonId, getTodayKey());
    } else {
      logPractice(lessonId);
    }
  }, [lessonId, practicedToday]);

  const addQuickNote = useCallback(
    (note: string, mediaId?: string) => {
      const trimmed = note.trim();
      if (!trimmed && !mediaId) {
        return;
      }

      if (!attachNoteToDate(lessonId, getTodayKey(), trimmed, mediaId)) {
        logPractice(lessonId, trimmed, mediaId);
      }
    },
    [lessonId]
  );

  return {
    practicedToday,
    toggle,
    addQuickNote
  };
};
