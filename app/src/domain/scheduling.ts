export type TimeRange = {
  startsAt: string;
  endsAt: string;
};

/** True when [aStart, aEnd) overlaps [bStart, bEnd). */
export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const a0 = Date.parse(aStart);
  const a1 = Date.parse(aEnd);
  const b0 = Date.parse(bStart);
  const b1 = Date.parse(bEnd);
  if ([a0, a1, b0, b1].some((n) => Number.isNaN(n))) {
    throw new Error("Invalid ISO datetime.");
  }
  if (a1 <= a0 || b1 <= b0) {
    throw new Error("End must be after start.");
  }
  return a0 < b1 && b0 < a1;
}

export function assertNoConflict(
  existing: TimeRange[],
  candidate: TimeRange,
): void {
  for (const row of existing) {
    if (
      overlaps(
        row.startsAt,
        row.endsAt,
        candidate.startsAt,
        candidate.endsAt,
      )
    ) {
      throw new Error("Appointment conflicts with an existing slot.");
    }
  }
}
