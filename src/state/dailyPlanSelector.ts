import { getLessonCategories, LessonCategory } from "@data/index";

export type LessonEngagement = {
  lastPracticedAt?: number;
  lastShownByDate?: string;
};

type PlanCandidate = {
  id: string;
  categories: LessonCategory[];
  lastPracticedAt?: number;
  lastShownByDate?: string;
  recentlyPracticed: boolean;
  neverPracticed: boolean;
};

type PlanSelectionInput = {
  lessonPool: string[];
  todayKey: string;
  engagement: Record<string, LessonEngagement>;
  now?: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const MIN_LESSONS = 3;
const MAX_LESSONS = 5;

const formatDateKey = (date: Date): string => date.toISOString().split("T")[0];

const parseDateKey = (key: string): number => {
  const parsed = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const getYesterdayKey = (key: string): string => {
  const dateMs = parseDateKey(key);
  return formatDateKey(new Date(dateMs - DAY_IN_MS));
};

const determineTargetCount = (available: number): number => {
  if (available <= MIN_LESSONS) {
    return available;
  }
  if (available === 4) {
    return 4;
  }
  return Math.min(MAX_LESSONS, available);
};

const sortCandidates = (candidates: PlanCandidate[], now: number): PlanCandidate[] => {
  return [...candidates].sort((a, b) => {
    if (a.neverPracticed !== b.neverPracticed) {
      return a.neverPracticed ? -1 : 1;
    }

    if (a.recentlyPracticed !== b.recentlyPracticed) {
      return a.recentlyPracticed ? 1 : -1;
    }

    const aDelta = a.lastPracticedAt ? now - a.lastPracticedAt : Number.POSITIVE_INFINITY;
    const bDelta = b.lastPracticedAt ? now - b.lastPracticedAt : Number.POSITIVE_INFINITY;

    if (aDelta !== bDelta) {
      return aDelta > bDelta ? -1 : 1;
    }

    return a.id.localeCompare(b.id);
  });
};

const countFoundations = (selection: PlanCandidate[]): number =>
  selection.reduce(
    (total, candidate) => (candidate.categories.includes("foundation") ? total + 1 : total),
    0
  );

export const selectDailyLessons = ({
  lessonPool,
  todayKey,
  engagement,
  now = Date.now()
}: PlanSelectionInput): string[] => {
  const uniqueLessonIds = Array.from(new Set(lessonPool.filter(Boolean)));
  if (uniqueLessonIds.length === 0) {
    return [];
  }

  if (uniqueLessonIds.length <= MIN_LESSONS) {
    return uniqueLessonIds;
  }

  const targetCount = determineTargetCount(uniqueLessonIds.length);
  const candidates: PlanCandidate[] = uniqueLessonIds.map((lessonId) => {
    const lastPracticedAt = engagement[lessonId]?.lastPracticedAt;
    const neverPracticed = typeof lastPracticedAt !== "number";
    const recentlyPracticed =
      typeof lastPracticedAt === "number" && now - lastPracticedAt < FORTY_EIGHT_HOURS_MS;
    return {
      id: lessonId,
      categories: getLessonCategories(lessonId),
      lastPracticedAt,
      lastShownByDate: engagement[lessonId]?.lastShownByDate,
      recentlyPracticed,
      neverPracticed
    };
  });

  const orderedCandidates = sortCandidates(candidates, now);
  const preferredCandidates = orderedCandidates.filter((candidate) => !candidate.recentlyPracticed);
  const cooldownCandidates = orderedCandidates.filter((candidate) => candidate.recentlyPracticed);
  const orderedByPreference = [...preferredCandidates, ...cooldownCandidates];
  const yesterdayKey = getYesterdayKey(todayKey);
  const selection: PlanCandidate[] = [];
  const selectedIds = new Set<string>();
  let repeatsUsed = 0;

  const isRepeat = (candidate: PlanCandidate) => candidate.lastShownByDate === yesterdayKey;

  const addCandidate = (candidate: PlanCandidate, allowRepeatOverflow = false): boolean => {
    if (selectedIds.has(candidate.id)) {
      return false;
    }
    const repeat = isRepeat(candidate);
    if (repeat && repeatsUsed >= 2 && !allowRepeatOverflow) {
      return false;
    }
    selection.push(candidate);
    selectedIds.add(candidate.id);
    if (repeat) {
      repeatsUsed += 1;
    }
    return true;
  };

  const removeCandidateAt = (index: number): PlanCandidate | null => {
    if (index < 0 || index >= selection.length) {
      return null;
    }

    const [removed] = selection.splice(index, 1);
    selectedIds.delete(removed.id);
    if (isRepeat(removed)) {
      repeatsUsed = Math.max(0, repeatsUsed - 1);
    }
    return removed;
  };

  const fillFromPool = (pool: PlanCandidate[], allowRepeatOverflow: boolean) => {
    for (const candidate of pool) {
      if (selection.length >= targetCount) {
        break;
      }
      addCandidate(candidate, allowRepeatOverflow);
    }
  };

  fillFromPool(preferredCandidates, false);
  if (selection.length < targetCount) {
    fillFromPool(preferredCandidates, true);
  }
  if (selection.length < targetCount) {
    fillFromPool(cooldownCandidates, false);
  }
  if (selection.length < targetCount) {
    fillFromPool(cooldownCandidates, true);
  }

  const tryEnsureCategory = (category: LessonCategory, required: boolean) => {
    if (selection.some((candidate) => candidate.categories.includes(category))) {
      return;
    }

    const pool = orderedByPreference.filter(
      (candidate) => candidate.categories.includes(category) && !selectedIds.has(candidate.id)
    );

    if (pool.length === 0) {
      return;
    }

    const preferredCandidate =
      pool.find((candidate) => !isRepeat(candidate)) ?? pool[0];

    if (selection.length < targetCount) {
      if (addCandidate(preferredCandidate, required)) {
        return;
      }
    }

    const foundationTotal = countFoundations(selection);
    const candidateIndex = selection.findIndex((entry) => {
      if (entry.categories.includes(category)) {
        return false;
      }
      if (
        (category === "lifeManners" || category === "socialization") &&
        entry.categories.includes("foundation") &&
        foundationTotal <= 1
      ) {
        return false;
      }
      return true;
    });

    if (candidateIndex === -1) {
      if (required && selection.length > 0) {
        const removed = removeCandidateAt(selection.length - 1);
        if (!addCandidate(preferredCandidate, true) && removed) {
          addCandidate(removed, true);
        }
      }
      return;
    }

    const removed = removeCandidateAt(candidateIndex);
    if (!addCandidate(preferredCandidate, required) && removed) {
      addCandidate(removed, true);
    }
  };

  tryEnsureCategory("foundation", true);
  tryEnsureCategory("lifeManners", false);
  tryEnsureCategory("socialization", false);

  return selection.slice(0, targetCount).map((candidate) => candidate.id);
};
