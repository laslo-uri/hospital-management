export const MAX_CHANGES_PER_DAY = 5;
export const SUSPEND_DAYS = 14;

export function shouldSuspend(strikes: number): boolean {
  return strikes >= MAX_CHANGES_PER_DAY;
}

export function nextSuspensionEnd(fromIso: string): string {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) {
    throw new Error("Invalid ISO datetime.");
  }
  from.setUTCDate(from.getUTCDate() + SUSPEND_DAYS);
  return from.toISOString();
}
