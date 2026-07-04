const BRASILIA_UTC_OFFSET_MINUTES = -3 * 60;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getMatchKickoffTimestamp(dateValue: Date | string): number {
  const date = toDate(dateValue);

  return (
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ) -
    BRASILIA_UTC_OFFSET_MINUTES * 60_000
  );
}

export function isMatchLockedByKickoff(
  dateValue: Date | string,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= getMatchKickoffTimestamp(dateValue);
}
