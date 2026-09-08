import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatTimelineDate } from "../formatTimelineDate";

describe("formatTimelineDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T20:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels a timestamp from today as Today", () => {
    expect(formatTimelineDate("2026-09-07T15:42:00.000Z")).toMatch(/^Today · /);
  });

  it("labels a timestamp from the day before as Yesterday", () => {
    expect(formatTimelineDate("2026-09-06T19:15:00.000Z")).toMatch(/^Yesterday · /);
  });

  it("uses a plain month/day for anything older this year", () => {
    expect(formatTimelineDate("2026-09-03T20:02:00.000Z")).toMatch(/^Sep 3 · /);
  });

  it("includes the year once it's not the current one", () => {
    expect(formatTimelineDate("2025-12-25T20:02:00.000Z")).toMatch(/^Dec 25, 2025 · /);
  });

  it("returns an empty string for a missing or invalid date", () => {
    expect(formatTimelineDate(undefined)).toBe("");
    expect(formatTimelineDate("not-a-date")).toBe("");
  });
});
