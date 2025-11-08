const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeDateInput = (value: string | Date): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getUtcMidnightTimestamp = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const getWeekNumberFromDob = (
  dob: string | Date,
  referenceDate: Date = new Date()
): number | null => {
  const parsedDob = normalizeDateInput(dob);
  const parsedReference = normalizeDateInput(referenceDate);

  if (!parsedDob || !parsedReference) {
    return null;
  }

  const dobUtc = getUtcMidnightTimestamp(parsedDob);
  const referenceUtc = getUtcMidnightTimestamp(parsedReference);
  const dayDiff = Math.floor((referenceUtc - dobUtc) / MS_PER_DAY);

  if (dayDiff < 0) {
    return 0;
  }

  return Math.max(1, Math.floor(dayDiff / 7) + 1);
};

export const getWeekProgressMeta = (
  dob: string | Date,
  referenceDate: Date = new Date()
): { weekNumber: number | null; daysOld: number | null } => {
  const parsedDob = normalizeDateInput(dob);
  const parsedReference = normalizeDateInput(referenceDate);
  if (!parsedDob || !parsedReference) {
    return { weekNumber: null, daysOld: null };
  }

  const dobUtc = getUtcMidnightTimestamp(parsedDob);
  const referenceUtc = getUtcMidnightTimestamp(parsedReference);
  const dayDiff = Math.floor((referenceUtc - dobUtc) / MS_PER_DAY);

  return {
    daysOld: dayDiff < 0 ? 0 : dayDiff,
    weekNumber: dayDiff < 0 ? 0 : Math.max(1, Math.floor(dayDiff / 7) + 1)
  };
};
