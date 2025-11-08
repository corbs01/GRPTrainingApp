import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native-mmkv", () => {
  class MockMMKV {
    private storage = new Map<string, string>();

    getString(key: string) {
      return this.storage.get(key) ?? null;
    }

    set(key: string, value: string) {
      this.storage.set(key, value);
    }

    delete(key: string) {
      this.storage.delete(key);
    }
  }

  return { MMKV: MockMMKV };
});

import {
  getPracticeEntries,
  logPractice,
  resetPracticeLogForTests
} from "./practiceLog";

describe("practiceLog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-01T10:00:00Z"));
    resetPracticeLogForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deduplicates entries for the same lesson and day", () => {
    logPractice("lesson-1", "First pass");
    logPractice("lesson-1", "Follow-up note");

    const entries = getPracticeEntries().filter((entry) => entry.lessonId === "lesson-1");
    expect(entries).toHaveLength(1);
    expect(entries[0]?.note).toBe("Follow-up note");
  });

  it("keeps notes isolated per day", () => {
    logPractice("lesson-2", "Day one note");

    vi.setSystemTime(new Date("2024-05-02T09:00:00Z"));
    logPractice("lesson-2", "Day two note");

    const entries = getPracticeEntries().filter((entry) => entry.lessonId === "lesson-2");
    expect(entries).toHaveLength(2);

    const firstDay = entries.find((entry) => entry.dateKey === "2024-05-01");
    const secondDay = entries.find((entry) => entry.dateKey === "2024-05-02");
    expect(firstDay?.note).toBe("Day one note");
    expect(secondDay?.note).toBe("Day two note");
  });
});
