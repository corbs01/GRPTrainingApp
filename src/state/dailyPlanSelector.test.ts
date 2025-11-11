import { describe, expect, it } from "vitest";

import { LessonCategory, getLessonCategories } from "@data/index";
import { LessonEngagement, selectDailyLessons } from "./dailyPlanSelector";

describe("selectDailyLessons", () => {
  it("returns all lessons when the pool is smaller than the minimum threshold", () => {
    const todayKey = "2024-06-01";
    const result = selectDailyLessons({
      lessonPool: ["name_game", "potty_routine"],
      todayKey,
      engagement: {},
      now: Date.parse(`${todayKey}T12:00:00.000Z`)
    });

    expect(result).toEqual(["name_game", "potty_routine"]);
  });

  it("handles pools where every lesson was practiced recently and limits repeats from yesterday", () => {
    const todayKey = "2024-06-10";
    const yesterdayKey = "2024-06-09";
    const now = Date.parse(`${todayKey}T15:00:00.000Z`);
    const recently = now - 60 * 60 * 1000;

    const engagement: Record<string, LessonEngagement> = {
      name_game: { lastPracticedAt: recently, lastShownByDate: yesterdayKey },
      potty_routine: { lastPracticedAt: recently, lastShownByDate: yesterdayKey },
      sound_socialization: { lastPracticedAt: recently, lastShownByDate: yesterdayKey },
      hand_touch: { lastPracticedAt: recently, lastShownByDate: yesterdayKey },
      alone_time_1: { lastPracticedAt: recently, lastShownByDate: "2024-06-08" },
      gentle_mouth_1: { lastPracticedAt: recently, lastShownByDate: "2024-06-05" },
      cat_intro_1: { lastPracticedAt: recently, lastShownByDate: "2024-06-05" }
    };

    const selection = selectDailyLessons({
      lessonPool: [
        "name_game",
        "potty_routine",
        "sound_socialization",
        "hand_touch",
        "alone_time_1",
        "gentle_mouth_1",
        "cat_intro_1"
      ],
      todayKey,
      engagement,
      now
    });

    expect(selection).toHaveLength(5);

    const repeatsFromYesterday = selection.filter(
      (lessonId) => engagement[lessonId]?.lastShownByDate === yesterdayKey
    );
    expect(repeatsFromYesterday.length).toBeLessThanOrEqual(2);

    const hasCategory = (category: LessonCategory) =>
      selection.some((lessonId) => getLessonCategories(lessonId).includes(category));

    expect(hasCategory("foundation")).toBe(true);
    expect(hasCategory("lifeManners")).toBe(true);
    expect(hasCategory("socialization")).toBe(true);
  });

  it("avoids lessons practiced within the last two days when enough alternatives exist", () => {
    const todayKey = "2024-06-12";
    const now = Date.parse(`${todayKey}T10:00:00.000Z`);
    const oneHourAgo = now - 60 * 60 * 1000;

    const engagement: Record<string, LessonEngagement> = {
      name_game: { lastPracticedAt: oneHourAgo },
      potty_routine: { lastPracticedAt: oneHourAgo }
    };

    const selection = selectDailyLessons({
      lessonPool: [
        "name_game",
        "potty_routine",
        "sound_socialization",
        "hand_touch",
        "alone_time_1",
        "gentle_mouth_1"
      ],
      todayKey,
      engagement,
      now
    });

    expect(selection).toHaveLength(5);
    const recentSelections = selection.filter((lessonId) =>
      ["name_game", "potty_routine"].includes(lessonId)
    );
    expect(recentSelections.length).toBeLessThanOrEqual(1);
  });

  it("falls back to recently practiced lessons when the pool is too small", () => {
    const todayKey = "2024-06-14";
    const now = Date.parse(`${todayKey}T09:00:00.000Z`);
    const fourHoursAgo = now - 4 * 60 * 60 * 1000;

    const engagement: Record<string, LessonEngagement> = {
      hand_touch: { lastPracticedAt: fourHoursAgo },
      alone_time_1: { lastPracticedAt: fourHoursAgo },
      gentle_mouth_1: { lastPracticedAt: fourHoursAgo }
    };

    const selection = selectDailyLessons({
      lessonPool: ["name_game", "hand_touch", "alone_time_1", "gentle_mouth_1"],
      todayKey,
      engagement,
      now
    });

    expect(selection).toHaveLength(4);
    expect(selection).toEqual(expect.arrayContaining(["hand_touch", "alone_time_1", "gentle_mouth_1"]));
  });
});
