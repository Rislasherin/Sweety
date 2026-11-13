import { FutureDateError, InvalidDateError } from "../errors/ReadingErrors";

export function parseDateOnly(dateStr: string): Date {
  if (typeof dateStr !== "string") {
    throw new InvalidDateError("Date must be a string in YYYY-MM-DD format");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new InvalidDateError("Invalid date format. Expected YYYY-MM-DD");
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  const parsed = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new InvalidDateError("Invalid calendar date");
  }

  return parsed;
}

export function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function assertNotFutureDate(date: Date): void {
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );

  if (date.getTime() > todayUtc.getTime()) {
    throw new FutureDateError("Future dates are not allowed");
  }
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
}

export function getDailyDateRange(selectedDate: Date): DateRange {
  const dateStr = formatDateOnly(selectedDate);
  return {
    startDate: selectedDate,
    endDate: selectedDate,
    startDateStr: dateStr,
    endDateStr: dateStr,
  };
}

export function getMonthToDateRange(selectedDate: Date): DateRange {
  const year = selectedDate.getUTCFullYear();
  const month = selectedDate.getUTCMonth();
  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return {
    startDate,
    endDate: selectedDate,
    startDateStr: formatDateOnly(startDate),
    endDateStr: formatDateOnly(selectedDate),
  };
}

export function getPreviousMonthRange(selectedDate: Date): DateRange {
  const year = selectedDate.getUTCFullYear();
  const month = selectedDate.getUTCMonth();

  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;

  const startDate = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
  // Setting day 0 of (prevMonth + 1) gives the exact last day of prevMonth
  const endDate = new Date(Date.UTC(prevYear, prevMonth + 1, 0, 0, 0, 0));

  return {
    startDate,
    endDate,
    startDateStr: formatDateOnly(startDate),
    endDateStr: formatDateOnly(endDate),
  };
}

export function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export interface DailyTrendCalculationItem {
  date: Date | string;
  glucoseValue: number;
}

export interface CalculatedDailyTrend {
  date: string;
  average: number;
  count: number;
  highest: number;
  lowest: number;
}

export function calculateDailyTrends(
  items: DailyTrendCalculationItem[],
): CalculatedDailyTrend[] {
  if (!items || items.length === 0) {
    return [];
  }

  const map = new Map<string, number[]>();

  for (const item of items) {
    const dateStr =
      item.date instanceof Date ? formatDateOnly(item.date) : String(item.date).slice(0, 10);
    const existing = map.get(dateStr);
    if (existing) {
      existing.push(item.glucoseValue);
    } else {
      map.set(dateStr, [item.glucoseValue]);
    }
  }

  const sortedDates = Array.from(map.keys()).sort();

  return sortedDates.map((date) => {
    const values = map.get(date)!;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = roundToOneDecimal(sum / values.length);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    return {
      date,
      average: avg,
      count: values.length,
      highest,
      lowest,
    };
  });
}
