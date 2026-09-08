import { describe, expect, it } from "vitest";
import {
  MAX_CHANGES_PER_DAY,
  SUSPEND_DAYS,
  nextSuspensionEnd,
  shouldSuspend,
} from "./anti-spam";

describe("anti-spam", () => {
  it("suspends at the daily change limit", () => {
    expect(shouldSuspend(MAX_CHANGES_PER_DAY - 1)).toBe(false);
    expect(shouldSuspend(MAX_CHANGES_PER_DAY)).toBe(true);
  });

  it("adds suspension days from an ISO stamp", () => {
    const end = nextSuspensionEnd("2026-09-07T08:00:00.000Z");
    const expected = new Date("2026-09-07T08:00:00.000Z");
    expected.setUTCDate(expected.getUTCDate() + SUSPEND_DAYS);
    expect(end).toBe(expected.toISOString());
  });
});
