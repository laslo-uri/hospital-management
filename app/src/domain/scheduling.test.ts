import { describe, expect, it } from "vitest";
import { assertNoConflict, overlaps } from "./scheduling";

describe("overlaps", () => {
  it("detects overlapping ranges", () => {
    expect(
      overlaps(
        "2026-09-07T09:00:00.000Z",
        "2026-09-07T10:00:00.000Z",
        "2026-09-07T09:30:00.000Z",
        "2026-09-07T10:30:00.000Z",
      ),
    ).toBe(true);
  });

  it("allows back-to-back slots", () => {
    expect(
      overlaps(
        "2026-09-07T09:00:00.000Z",
        "2026-09-07T10:00:00.000Z",
        "2026-09-07T10:00:00.000Z",
        "2026-09-07T11:00:00.000Z",
      ),
    ).toBe(false);
  });
});

describe("assertNoConflict", () => {
  it("throws when a candidate overlaps", () => {
    expect(() =>
      assertNoConflict(
        [
          {
            startsAt: "2026-09-07T09:00:00.000Z",
            endsAt: "2026-09-07T10:00:00.000Z",
          },
        ],
        {
          startsAt: "2026-09-07T09:45:00.000Z",
          endsAt: "2026-09-07T10:15:00.000Z",
        },
      ),
    ).toThrow(/conflict/i);
  });

  it("passes when free", () => {
    expect(() =>
      assertNoConflict(
        [
          {
            startsAt: "2026-09-07T09:00:00.000Z",
            endsAt: "2026-09-07T10:00:00.000Z",
          },
        ],
        {
          startsAt: "2026-09-07T11:00:00.000Z",
          endsAt: "2026-09-07T12:00:00.000Z",
        },
      ),
    ).not.toThrow();
  });
});
