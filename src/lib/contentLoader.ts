import weeksSource from "@data/weeks.json";
import week08Lessons from "@data/lessons/week08.json";
import week09Lessons from "@data/lessons/week09.json";
import week10Lessons from "@data/lessons/week10.json";
import week11Lessons from "@data/lessons/week11.json";
import week12Lessons from "@data/lessons/week12.json";
import supportSource from "@data/support.json";

export type LessonPlan = {
  id: string;
  title: string;
  objective?: string;
  duration?: string;
  materials?: string[];
  steps?: string[];
  supportGuidelines?: string[];
  safetyNotes?: string;
};

export type WeekLessonsSource = {
  id: string;
  title: string;
  summary?: string;
  lessons: LessonPlan[];
};

export type WeekContent = {
  id: string;
  number: number;
  title: string;
  focus: string;
  lessonIds: string[];
};

export type SupportTip = {
  id: string;
  title: string;
  summary: string;
  tips: string[];
};

export type SupportCategory = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  items: SupportTip[];
};

export type ContentStatus = {
  initialized: boolean;
  valid: boolean;
  errors: string[];
};

type ContentStore = {
  weeks: WeekContent[];
  lessonsByWeekId: Map<string, WeekLessonsSource>;
  supportCategories: SupportCategory[];
  supportBySlug: Map<string, SupportCategory>;
};

type WeeksFile = {
  weeks?: unknown;
};

type SupportFile = {
  categories?: unknown;
};

type LessonSources = Record<string, unknown>;

type Validator<T> = (value: unknown, errors: string[], context: string) => T | null;

const defaultStatus: ContentStatus = {
  initialized: false,
  valid: false,
  errors: []
};

const createEmptyStore = (): ContentStore => ({
  weeks: [],
  lessonsByWeekId: new Map(),
  supportCategories: [],
  supportBySlug: new Map()
});

const rawLessonSources: LessonSources = {
  week08: week08Lessons,
  week09: week09Lessons,
  week10: week10Lessons,
  week11: week11Lessons,
  week12: week12Lessons
};

let store: ContentStore = createEmptyStore();
let status: ContentStatus = { ...defaultStatus };
let bootstrapped = false;
const listeners = new Set<(next: ContentStatus) => void>();

const notifyStatus = () => {
  const snapshot = getContentStatus();
  listeners.forEach((listener) => listener(snapshot));
};

const isString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const asStringArray = (value: unknown, errors: string[], context: string): string[] | null => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    errors.push(`${context} must be an array of strings.`);
    return null;
  }

  const invalid = value.some((entry) => !isString(entry));
  if (invalid) {
    errors.push(`${context} must include only non-empty strings.`);
    return null;
  }

  return value as string[];
};

const validateLesson: Validator<LessonPlan> = (value, errors, context) => {
  if (typeof value !== "object" || value === null) {
    errors.push(`${context} must be an object.`);
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isString(candidate.id)) {
    errors.push(`${context} is missing a valid id.`);
    return null;
  }

  if (!isString(candidate.title)) {
    errors.push(`${context} is missing a valid title.`);
    return null;
  }

  const lesson: LessonPlan = {
    id: candidate.id.trim(),
    title: candidate.title.trim()
  };

  if (candidate.objective !== undefined) {
    if (!isString(candidate.objective)) {
      errors.push(`${context} objective must be a string.`);
    } else {
      lesson.objective = candidate.objective.trim();
    }
  }

  if (candidate.duration !== undefined) {
    if (!isString(candidate.duration)) {
      errors.push(`${context} duration must be a string.`);
    } else {
      lesson.duration = candidate.duration.trim();
    }
  }

  const materials = asStringArray(candidate.materials, errors, `${context} materials`);
  if (materials) {
    lesson.materials = materials;
  }

  const steps = asStringArray(candidate.steps, errors, `${context} steps`);
  if (steps) {
    lesson.steps = steps;
  }

  const guidelines = asStringArray(candidate.supportGuidelines, errors, `${context} supportGuidelines`);
  if (guidelines) {
    lesson.supportGuidelines = guidelines;
  }

  if (candidate.safetyNotes !== undefined) {
    if (!isString(candidate.safetyNotes)) {
      errors.push(`${context} safetyNotes must be a string.`);
    } else {
      lesson.safetyNotes = candidate.safetyNotes.trim();
    }
  }

  return lesson;
};

const validateLessonFile = (
  weekId: string,
  value: unknown,
  errors: string[]
): WeekLessonsSource | null => {
  if (typeof value !== "object" || value === null) {
    errors.push(`Lessons file for ${weekId} must be an object.`);
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isString(candidate.id)) {
    errors.push(`Lessons file for ${weekId} needs an id.`);
    return null;
  }

  if (candidate.id !== weekId) {
    errors.push(`Lessons file id ${candidate.id} does not match week id ${weekId}.`);
  }

  if (!isString(candidate.title)) {
    errors.push(`Lessons file for ${weekId} must include a title.`);
    return null;
  }

  const lessonsValue = candidate.lessons;
  if (!Array.isArray(lessonsValue)) {
    errors.push(`Lessons list for ${weekId} must be an array.`);
    return null;
  }

  const lessons: LessonPlan[] = [];

  lessonsValue.forEach((entry, index) => {
    const lesson = validateLesson(entry, errors, `Lesson ${index + 1} in ${weekId}`);
    if (lesson) {
      lessons.push(lesson);
    }
  });

  const bundle: WeekLessonsSource = {
    id: weekId,
    title: candidate.title.trim(),
    summary: isString(candidate.summary) ? candidate.summary.trim() : undefined,
    lessons
  };

  return bundle;
};

const validateWeekEntry: Validator<WeekContent> = (value, errors, context) => {
  if (typeof value !== "object" || value === null) {
    errors.push(`${context} must be an object.`);
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isString(candidate.id)) {
    errors.push(`${context} is missing an id.`);
    return null;
  }

  if (typeof candidate.number !== "number" || !Number.isInteger(candidate.number)) {
    errors.push(`${context} number must be an integer.`);
    return null;
  }

  if (!isString(candidate.title)) {
    errors.push(`${context} is missing a title.`);
    return null;
  }

  if (!isString(candidate.focus)) {
    errors.push(`${context} is missing a focus string.`);
    return null;
  }

  if (!Array.isArray(candidate.lessonIds)) {
    errors.push(`${context} lessonIds must be an array.`);
    return null;
  }

  const rawLessonIds = candidate.lessonIds;
  const invalidLessonId = rawLessonIds.some((id) => !isString(id));
  if (invalidLessonId) {
    errors.push(`${context} lessonIds must contain only strings.`);
    return null;
  }

  const lessonIds = rawLessonIds as string[];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  lessonIds.forEach((id) => {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  });
  if (duplicates.length > 0) {
    errors.push(`${context} has duplicate lessonIds: ${duplicates.join(", ")}.`);
  }

  return {
    id: candidate.id.trim(),
    number: candidate.number,
    title: candidate.title.trim(),
    focus: candidate.focus.trim(),
    lessonIds
  };
};

const validateSupportCategory: Validator<SupportCategory> = (value, errors, context) => {
  if (typeof value !== "object" || value === null) {
    errors.push(`${context} must be an object.`);
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isString(candidate.id)) {
    errors.push(`${context} is missing an id.`);
    return null;
  }

  if (!isString(candidate.title)) {
    errors.push(`${context} is missing a title.`);
    return null;
  }

  if (!isString(candidate.description)) {
    errors.push(`${context} is missing a description.`);
    return null;
  }

  const keywords = asStringArray(candidate.keywords, errors, `${context} keywords`);
  if (!keywords) {
    return null;
  }

  if (!Array.isArray(candidate.items)) {
    errors.push(`${context} items must be an array.`);
    return null;
  }

  const items: SupportTip[] = [];
  (candidate.items as unknown[]).forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      errors.push(`${context} item ${index + 1} must be an object.`);
      return;
    }

    const tip = item as Record<string, unknown>;

    if (!isString(tip.id) || !isString(tip.title) || !isString(tip.summary)) {
      errors.push(`${context} item ${index + 1} is missing required fields.`);
      return;
    }

    const tips = asStringArray(tip.tips, errors, `${context} item ${index + 1} tips`);
    if (!tips) {
      return;
    }

    items.push({
      id: tip.id.trim(),
      title: tip.title.trim(),
      summary: tip.summary.trim(),
      tips
    });
  });

  return {
    id: candidate.id.trim(),
    title: candidate.title.trim(),
    description: candidate.description.trim(),
    keywords,
    items
  };
};

const buildStore = (): { store: ContentStore; errors: string[] } => {
  const errors: string[] = [];
  const nextStore = createEmptyStore();

  const weeksValue = (weeksSource as WeeksFile).weeks;
  if (!Array.isArray(weeksValue)) {
    return {
      store: nextStore,
      errors: ["weeks.json must export an array of weeks under the weeks key."]
    };
  }

  const weekEntries: WeekContent[] = [];
  weeksValue.forEach((week, index) => {
    const parsed = validateWeekEntry(week, errors, `Week entry ${index + 1}`);
    if (parsed) {
      weekEntries.push(parsed);
    }
  });

  weekEntries.sort((a, b) => a.number - b.number);
  nextStore.weeks = weekEntries;

  weekEntries.forEach((week) => {
    const lessonSource = rawLessonSources[week.id];
    if (!lessonSource) {
      errors.push(`No lessons file found for ${week.id}.`);
      return;
    }

    const bundle = validateLessonFile(week.id, lessonSource, errors);
    if (!bundle) {
      return;
    }

    nextStore.lessonsByWeekId.set(week.id, bundle);

    const bundleLessonIds = new Set(bundle.lessons.map((lesson) => lesson.id));
    const missing = week.lessonIds.filter((id) => !bundleLessonIds.has(id));
    if (missing.length > 0) {
      errors.push(`Week ${week.number} references missing lessons: ${missing.join(", ")}.`);
    }
  });

  const supportCategories = (supportSource as SupportFile).categories;
  if (!Array.isArray(supportCategories)) {
    errors.push("support.json must include a categories array.");
  } else {
    supportCategories.forEach((category, index) => {
      const parsed = validateSupportCategory(category, errors, `Support category ${index + 1}`);
      if (parsed) {
        nextStore.supportCategories.push(parsed);
        nextStore.supportBySlug.set(parsed.id, parsed);
      }
    });
  }

  return { store: nextStore, errors };
};

export const initializeContent = (): ContentStatus => {
  if (bootstrapped) {
    return getContentStatus();
  }

  const { store: nextStore, errors } = buildStore();
  store = nextStore;
  status = {
    initialized: true,
    valid: errors.length === 0,
    errors
  };
  bootstrapped = true;
  notifyStatus();
  return getContentStatus();
};

export const getContentStatus = (): ContentStatus => ({
  initialized: status.initialized,
  valid: status.valid,
  errors: [...status.errors]
});

export const subscribeToContentStatus = (listener: (next: ContentStatus) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getWeekByIdInternal = (weekId: string): WeekContent | undefined =>
  store.weeks.find((week) => week.id === weekId);

export const getWeeks = (): WeekContent[] => [...store.weeks];

export const getWeek = (weekNumber: number | null | undefined): WeekContent | undefined => {
  if (!weekNumber && weekNumber !== 0) {
    return undefined;
  }
  return store.weeks.find((week) => week.number === weekNumber);
};

export const getWeekById = (weekId: string): WeekContent | undefined => getWeekByIdInternal(weekId);

const getOrderedLessons = (week: WeekContent): LessonPlan[] => {
  const bundle = store.lessonsByWeekId.get(week.id);
  if (!bundle) {
    return [];
  }

  const lessonMap = new Map<string, LessonPlan>(bundle.lessons.map((lesson) => [lesson.id, lesson]));
  return week.lessonIds
    .map((lessonId) => lessonMap.get(lessonId))
    .filter((lesson): lesson is LessonPlan => Boolean(lesson));
};

export const getLessons = (weekNumber: number | null | undefined): LessonPlan[] => {
  if (weekNumber === null || weekNumber === undefined) {
    return [];
  }
  const week = getWeek(weekNumber);
  return week ? getOrderedLessons(week) : [];
};

export const getLessonsByWeekId = (weekId: string): LessonPlan[] => {
  const week = getWeekByIdInternal(weekId);
  if (!week) {
    return [];
  }
  return getOrderedLessons(week);
};

export const getLessonBundle = (weekId: string): WeekLessonsSource | undefined =>
  store.lessonsByWeekId.get(weekId);

export const getSupportCategories = (): SupportCategory[] =>
  store.supportCategories.map((category) => ({
    ...category,
    keywords: [...category.keywords],
    items: category.items.map((item) => ({ ...item }))
  }));

export const getSupportBySlug = (slug: string): SupportCategory | undefined => {
  const category = store.supportBySlug.get(slug);
  if (!category) {
    return undefined;
  }
  return {
    ...category,
    keywords: [...category.keywords],
    items: category.items.map((item) => ({ ...item }))
  };
};

export const searchSupportLibrary = (query: string): SupportCategory[] => {
  const categories = getSupportCategories();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return categories;
  }

  return categories
    .map((category) => {
      const categoryMatches =
        category.title.toLowerCase().includes(normalizedQuery) ||
        category.description.toLowerCase().includes(normalizedQuery) ||
        category.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery));

      if (categoryMatches) {
        return category;
      }

      const matchingItems = category.items.filter((item) => {
        if (item.title.toLowerCase().includes(normalizedQuery)) {
          return true;
        }

        if (item.summary.toLowerCase().includes(normalizedQuery)) {
          return true;
        }

        return item.tips.some((tip) => tip.toLowerCase().includes(normalizedQuery));
      });

      if (matchingItems.length > 0) {
        return {
          ...category,
          items: matchingItems
        };
      }

      return null;
    })
    .filter((category): category is SupportCategory => Boolean(category));
};
