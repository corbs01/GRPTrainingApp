import type {
  LessonPlan,
  SupportCategory as LoaderSupportCategory,
  SupportItemLookup as LoaderSupportItemLookup,
  SupportTip as LoaderSupportTip,
  WeekContent
} from "@lib/contentLoader";
import {
  getContentStatus,
  getLessonBundle,
  getLessons as loaderGetLessons,
  getLessonsByWeekId,
  getSupportItemById as loaderGetSupportItemById,
  getSupportBySlug as loaderGetSupportBySlug,
  getSupportCategories as loaderGetSupportCategories,
  getWeek as loaderGetWeek,
  getWeekById as loaderGetWeekById,
  getWeeks as loaderGetWeeks,
  initializeContent,
  searchSupportLibrary as loaderSearchSupportLibrary
} from "@lib/contentLoader";

export type WeekSummary = WeekContent;
export type LessonDetail = LessonPlan;
export type LessonSummary = Pick<LessonPlan, "id" | "title" | "objective" | "duration">;
export type SupportTip = LoaderSupportTip;
export type SupportCategory = LoaderSupportCategory;
export type SupportItemLookup = LoaderSupportItemLookup;

export type WeekLessonContent = {
  id: string;
  title: string;
  summary?: string;
  lessons: LessonDetail[];
};

export { initializeContent, getContentStatus };
export { getLessonCategories, hasLessonCategory } from "@data/lessonCategories";
export type { LessonCategory } from "@data/lessonCategories";

export const getWeeks = (): WeekSummary[] => loaderGetWeeks();

export const getWeek = (weekNumber: number | null | undefined): WeekSummary | undefined =>
  loaderGetWeek(weekNumber);

export const getWeekByNumber = (weekNumber: number | null): WeekSummary | undefined =>
  loaderGetWeek(weekNumber);

export const getWeekById = (weekId: string): WeekSummary | undefined => loaderGetWeekById(weekId);

export const getDefaultWeek = (): WeekSummary | undefined => {
  const weeks = loaderGetWeeks();
  return weeks.length > 0 ? weeks[0] : undefined;
};

export const getAllWeeks = (): WeekSummary[] => loaderGetWeeks();

const toSummary = (lesson: LessonDetail): LessonSummary => ({
  id: lesson.id,
  title: lesson.title,
  objective: lesson.objective,
  duration: lesson.duration
});

export const getLessons = (weekNumber: number | null | undefined): LessonDetail[] =>
  loaderGetLessons(weekNumber);

export const getWeekLessonSummaries = (weekId: string): LessonSummary[] =>
  getLessonsByWeekId(weekId).map(toSummary);

export const getLessonSummariesFromIds = (weekId: string, lessonIds: string[]): LessonSummary[] => {
  const lessons = getLessonsByWeekId(weekId);
  const lookup = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return lessonIds
    .map((lessonId) => lookup.get(lessonId))
    .filter((lesson): lesson is LessonDetail => Boolean(lesson))
    .map(toSummary);
};

export const getWeekLessonContent = (weekId: string): WeekLessonContent | undefined => {
  const bundle = getLessonBundle(weekId);
  if (!bundle) {
    return undefined;
  }

  return {
    id: bundle.id,
    title: bundle.title,
    summary: bundle.summary,
    lessons: getLessonsByWeekId(weekId)
  };
};

export const getSupportCategories = (): SupportCategory[] => loaderGetSupportCategories();

export const getSupportBySlug = (slug: string): SupportCategory | undefined =>
  loaderGetSupportBySlug(slug);

export const getSupportItemById = (itemId: string): SupportItemLookup | undefined =>
  loaderGetSupportItemById(itemId);

export const searchSupportLibrary = (query: string): SupportCategory[] =>
  loaderSearchSupportLibrary(query);
