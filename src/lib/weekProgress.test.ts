import { describe, expect, it } from "vitest";

import { getWeekNumberFromDob } from "./weekProgress";

const makeDate = (value: string) => new Date(`${value}T12:00:00Z`);

describe("weekProgress", () => {
  it("returns null for invalid DOB input", () => {
    expect(getWeekNumberFromDob("not-a-date")).toBeNull();
  });

  it("returns 0 when the DOB is in the future relative to the reference date", () => {
    const futureDob = makeDate("2100-01-01");
    const reference = makeDate("2024-05-01");
    expect(getWeekNumberFromDob(futureDob, reference)).toBe(0);
  });

  it("advances on strict 7-day boundaries", () => {
    const dob = makeDate("2024-01-01");

    expect(getWeekNumberFromDob(dob, makeDate("2024-01-01"))).toBe(1);
    expect(getWeekNumberFromDob(dob, makeDate("2024-01-06"))).toBe(1);
    expect(getWeekNumberFromDob(dob, makeDate("2024-01-08"))).toBe(2);
    expect(getWeekNumberFromDob(dob, makeDate("2024-01-15"))).toBe(3);
    expect(getWeekNumberFromDob(dob, makeDate("2024-02-12"))).toBe(7);
  });

  it("handles leap years without skipping a week", () => {
    const dob = makeDate("2020-02-29");
    expect(getWeekNumberFromDob(dob, makeDate("2020-03-07"))).toBe(2);
    expect(getWeekNumberFromDob(dob, makeDate("2021-03-01"))).toBe(53);
  });
});
