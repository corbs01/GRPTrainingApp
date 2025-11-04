import weeksCatalog from "./weeks.json";
import week08 from "./lessons/week08.json";
import week09 from "./lessons/week09.json";
import week10 from "./lessons/week10.json";
import week11 from "./lessons/week11.json";
import week12 from "./lessons/week12.json";
import week13 from "./lessons/week13.json";
import week14 from "./lessons/week14.json";
import week15 from "./lessons/week15.json";
import week16 from "./lessons/week16.json";
import week17 from "./lessons/week17.json";
import week18 from "./lessons/week18.json";
import week19 from "./lessons/week19.json";
import week20 from "./lessons/week20.json";
import supportLibrary from "./support.json";

type WeekCatalogEntry = {
  id: string;
  number: number;
  title: string;
  focus: string;
  lessonIds: string[];
};

type WeekLessonSource = {
  id: string;
  title: string;
  summary?: string;
  lessons: Array<{
    id: string;
    title: string;
    objective?: string;
    duration?: string;
    materials?: string[];
    steps?: string[];
    supportGuidelines?: string[];
    safetyNotes?: string;
  }>;
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

type SupportLibrarySource = {
  categories: SupportCategory[];
};

export type LessonSummary = {
  id: string;
  title: string;
  objective?: string;
  duration?: string;
};

export type WeekSummary = WeekCatalogEntry;

export type LessonDetail = LessonSummary & {
  materials?: string[];
  steps?: string[];
  supportGuidelines?: string[];
  safetyNotes?: string;
};

export type WeekLessonContent = {
  id: string;
  title: string;
  summary?: string;
  lessons: LessonDetail[];
};

const weeksList = (weeksCatalog as { weeks: WeekCatalogEntry[] }).weeks;

const lessonsByWeek: Record<string, WeekLessonSource> = {
  week08,
  week09,
  week10,
  week11,
  week12,
  week13,
  week14,
  week15,
  week16,
  week17,
  week18,
  week19,
  week20
};

export const getWeekByNumber = (weekNumber: number | null): WeekSummary | undefined => {
  if (!weekNumber) {
    return undefined;
  }

  return weeksList.find((week) => week.number === weekNumber);
};

export const getWeekById = (weekId: string): WeekSummary | undefined =>
  weeksList.find((week) => week.id === weekId);

export const getAllWeeks = (): WeekSummary[] => [...weeksList];

export const getWeekLessonSummaries = (weekId: string): LessonSummary[] => {
  const source = lessonsByWeek[weekId];
  if (!source) {
    return [];
  }

  return source.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    objective: lesson.objective,
    duration: lesson.duration
  }));
};

export const getLessonSummariesFromIds = (weekId: string, lessonIds: string[]): LessonSummary[] => {
  const lessons = getWeekLessonSummaries(weekId);
  const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return lessonIds
    .map((lessonId) => lessonMap.get(lessonId))
    .filter((lesson): lesson is LessonSummary => Boolean(lesson));
};

export const getDefaultWeek = (): WeekSummary | undefined =>
  weeksList.length > 0 ? weeksList[0] : undefined;

export const getWeekLessonContent = (weekId: string): WeekLessonContent | undefined => {
  const source = lessonsByWeek[weekId];
  if (!source) {
    return undefined;
  }

  return {
    id: source.id,
    title: source.title,
    summary: source.summary,
    lessons: source.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      duration: lesson.duration,
      materials: lesson.materials,
      steps: lesson.steps,
      supportGuidelines: lesson.supportGuidelines,
      safetyNotes: lesson.safetyNotes
    }))
  };
};

const supportCategories = (supportLibrary as SupportLibrarySource).categories;

export const getSupportCategories = (): SupportCategory[] =>
  supportCategories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      tips: [...item.tips]
    }))
  }));

export const searchSupportLibrary = (query: string): SupportCategory[] => {
  if (!query.trim()) {
    return getSupportCategories();
  }

  const q = query.trim().toLowerCase();

  return supportCategories
    .map((category) => {
      const categoryMatches =
        category.title.toLowerCase().includes(q) ||
        category.description.toLowerCase().includes(q) ||
        category.keywords.some((keyword) => keyword.toLowerCase().includes(q));

      const items = category.items.filter((item) => {
        if (item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q)) {
          return true;
        }

        return item.tips.some((tip) => tip.toLowerCase().includes(q));
      });

      if (categoryMatches) {
        return { ...category, items: category.items.map((item) => ({ ...item, tips: [...item.tips] })) };
      }

      if (items.length > 0) {
        return { ...category, items: items.map((item) => ({ ...item, tips: [...item.tips] })) };
      }

      return null;
    })
    .filter((category): category is SupportCategory => Boolean(category));
};
