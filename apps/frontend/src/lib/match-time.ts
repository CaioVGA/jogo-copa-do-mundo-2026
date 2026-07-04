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

export function isMatchClosed(dateValue: Date | string, nowMs = Date.now()): boolean {
  return nowMs >= getMatchKickoffTimestamp(dateValue);
}

export function formatMatchDateTime(dateValue: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(getMatchKickoffTimestamp(dateValue)));
}
