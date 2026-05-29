export function parseDateTime(raw: string): Date | null {
  const normalized = raw.trim().replace("T", " ");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/
  );

  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export const DATE_TIME_HINT = "AAAA-MM-DD HH:MM";
