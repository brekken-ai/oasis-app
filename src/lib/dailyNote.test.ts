import { describe, expect, it } from "vitest";
import { todaysDailyPath } from "./dailyNote";

describe("todaysDailyPath", () => {
  it("returns a path of the form daily/YYYY-MM-DD.md", () => {
    expect(todaysDailyPath()).toMatch(/^daily\/\d{4}-\d{2}-\d{2}\.md$/);
  });

  it("reflects today's date (rough check: year is 2020 or later)", () => {
    const path = todaysDailyPath();
    const year = parseInt(path.slice("daily/".length, "daily/".length + 4), 10);
    expect(year).toBeGreaterThanOrEqual(2020);
  });
});
