import "dotenv/config";
import { PrismaClient, ReadingSlot } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@sweety.app").toLowerCase();
const DEMO_NAME = process.env.DEMO_USER_NAME || "Sweety Demo Patient";
const BCRYPT_SALT_ROUNDS = 12;

export interface DemoReadingEntry {
  dateStr: string; // YYYY-MM-DD
  date: Date; // UTC midnight Date
  slot: ReadingSlot;
  glucoseValue: number;
}

/**
 * Application glycemic thresholds (strictly matching client formatters and chart bands):
 * - Low: glucoseValue < 70
 * - Normal: 70–99
 * - Elevated: 100–125
 * - High: >= 126
 */
export type DemoGlucoseCategory = "LOW" | "NORMAL" | "ELEVATED" | "HIGH";

export function getGlucoseCategory(glucoseValue: number): DemoGlucoseCategory {
  if (glucoseValue < 70) return "LOW";
  if (glucoseValue < 100) return "NORMAL";
  if (glucoseValue < 126) return "ELEVATED";
  return "HIGH";
}

export function getRequiredDemoPassword(): string {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password || password.trim().length === 0) {
    throw new Error(
      "Missing required environment variable: DEMO_USER_PASSWORD. Please configure DEMO_USER_PASSWORD (minimum 8 characters) to seed the demo user.",
    );
  }
  if (password.length < 8) {
    throw new Error("DEMO_USER_PASSWORD must be at least 8 characters long.");
  }
  return password;
}

/**
 * Returns total days in a given year and 1-indexed month.
 * Automatically handles leap years (e.g. Feb 2024 = 29, Feb 2025 = 28).
 */
export function getDaysInMonth(year: number, month1Indexed: number): number {
  return new Date(Date.UTC(year, month1Indexed, 0)).getUTCDate();
}

/**
 * Formats year, 1-indexed month, and day into strict YYYY-MM-DD.
 */
export function formatUtcYmd(year: number, month1Indexed: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month1Indexed).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Generates 8 distinct calendar days evenly distributed across the entire previous month.
 * Correctly rolls over January to December of the previous year.
 */
export function getPreviousMonthDates(refDate: Date): {
  year: number;
  month: number;
  days: number[];
} {
  const currentYear = refDate.getUTCFullYear();
  const currentMonth0 = refDate.getUTCMonth(); // 0..11

  const prevYear = currentMonth0 === 0 ? currentYear - 1 : currentYear;
  const prevMonth1 = currentMonth0 === 0 ? 12 : currentMonth0; // 1..12
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth1);

  // 8 distinct days evenly spaced from day 1 to the last day of the previous month
  const days: number[] = [];
  for (let i = 0; i < 8; i++) {
    const day = Math.floor(1 + (i * (daysInPrevMonth - 1)) / 7);
    days.push(day);
  }

  return { year: prevYear, month: prevMonth1, days };
}

/**
 * Generates up to 8 distinct calendar days within the current month up to today's date.
 * - Always includes today's date.
 * - Never produces future dates.
 * - Leaves at least one unseeded day for empty-day testing whenever currentDay > 1.
 */
export function getCurrentMonthDates(refDate: Date): {
  year: number;
  month: number;
  days: number[];
} {
  const currentYear = refDate.getUTCFullYear();
  const currentMonth1 = refDate.getUTCMonth() + 1; // 1..12
  const currentDay = refDate.getUTCDate(); // 1..31

  let days: number[];
  if (currentDay <= 1) {
    days = [1];
  } else if (currentDay <= 3) {
    days = [1, currentDay];
  } else if (currentDay <= 8) {
    // Leave day 2 unseeded for empty-day testing
    days = [1];
    for (let d = 3; d <= currentDay; d++) {
      days.push(d);
    }
  } else {
    // currentDay > 8: 4 recent days ending on currentDay + up to 4 earlier days
    const recent = [currentDay - 3, currentDay - 2, currentDay - 1, currentDay];
    const earlyEnd = currentDay - 5;
    const early: number[] = [];
    if (earlyEnd >= 4) {
      early.push(1);
      early.push(Math.floor(1 + earlyEnd * 0.33));
      early.push(Math.floor(1 + earlyEnd * 0.66));
      early.push(earlyEnd);
    } else {
      for (let d = 1; d <= earlyEnd; d++) {
        early.push(d);
      }
    }
    days = Array.from(new Set([...early, ...recent])).sort((a, b) => a - b);
  }

  return { year: currentYear, month: currentMonth1, days };
}

/**
 * Generates dynamic demo readings relative to referenceDate.
 * Covers all 4 slots, varied clinical ranges (Low, Normal, Elevated, High),
 * and partial as well as complete 4-slot days.
 */
export function generateDemoReadings(referenceDate: Date = new Date()): DemoReadingEntry[] {
  const readings: DemoReadingEntry[] = [];

  const prevMonthInfo = getPreviousMonthDates(referenceDate);
  const currentMonthInfo = getCurrentMonthDates(referenceDate);

  // 8 Previous Month Day Templates
  const prevMonthPatterns: Array<Array<{ slot: ReadingSlot; glucoseValue: number }>> = [
    // Day 1
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 88 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 140 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 115 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 92 },
    ],
    // Day 2
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 84 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 125 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 105 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 89 },
    ],
    // Day 3
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 92 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 135 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 110 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 94 },
    ],
    // Day 4 (Hypoglycemic reading)
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 68 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 118 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 102 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 90 },
    ],
    // Day 5 (High reading)
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 86 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 148 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 114 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 93 },
    ],
    // Day 6
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 89 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 122 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 108 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 91 },
    ],
    // Day 7
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 85 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 130 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 106 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 88 },
    ],
    // Day 8
    [
      { slot: ReadingSlot.MORNING, glucoseValue: 90 },
      { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 136 },
      { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 112 },
      { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 95 },
    ],
  ];

  for (let i = 0; i < prevMonthInfo.days.length; i++) {
    const day = prevMonthInfo.days[i];
    const dateStr = formatUtcYmd(prevMonthInfo.year, prevMonthInfo.month, day);
    const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
    const pattern = prevMonthPatterns[i % prevMonthPatterns.length];

    for (const item of pattern) {
      readings.push({
        dateStr,
        date: dateObj,
        slot: item.slot,
        glucoseValue: item.glucoseValue,
      });
    }
  }

  // Current Month Patterns (reverse index: 0 = today, 1 = yesterday, etc.)
  const currentMonthDays = currentMonthInfo.days; // sorted ascending
  const totalDays = currentMonthDays.length;

  for (let i = 0; i < totalDays; i++) {
    const day = currentMonthDays[i];
    const dateStr = formatUtcYmd(currentMonthInfo.year, currentMonthInfo.month, day);
    const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
    const daysFromToday = totalDays - 1 - i; // 0 for today, 1 for yesterday, etc.

    let slotEntries: Array<{ slot: ReadingSlot; glucoseValue: number }>;

    if (daysFromToday === 0) {
      // Today: Complete 4-slot day showcasing all 4 application glycemic categories
      // Low (<70), High (>=126), Elevated (100–125), Normal (70–99)
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 68 }, // Low (< 70)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 145 }, // High (>= 126)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 115 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 92 }, // Normal (70–99)
      ];
    } else if (daysFromToday === 1) {
      // Yesterday: Complete 4-slot day
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 85 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 138 }, // High (>= 126)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 108 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 95 }, // Normal (70–99)
      ];
    } else if (daysFromToday === 2) {
      // 2 days ago: Complete 4-slot day
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 82 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 120 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 98 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 88 }, // Normal (70–99)
      ];
    } else if (daysFromToday === 3) {
      // 3 days ago: Partial 3-slot day with Low morning reading
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 66 }, // Low (< 70)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 118 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 102 }, // Elevated (100–125)
      ];
    } else if (daysFromToday === 4) {
      // 4 days ago: Partial 2-slot day
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 94 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 124 }, // Elevated (100–125)
      ];
    } else if (daysFromToday === 5) {
      // 5 days ago: Complete 4-slot day with high peak reading
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 89 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 152 }, // High (>= 126)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 104 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 96 }, // Normal (70–99)
      ];
    } else if (daysFromToday === 6) {
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 91 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 128 }, // High (>= 126)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 110 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 90 }, // Normal (70–99)
      ];
    } else {
      slotEntries = [
        { slot: ReadingSlot.MORNING, glucoseValue: 86 }, // Normal (70–99)
        { slot: ReadingSlot.AFTER_BREAKFAST, glucoseValue: 132 }, // High (>= 126)
        { slot: ReadingSlot.AFTER_LUNCH, glucoseValue: 106 }, // Elevated (100–125)
        { slot: ReadingSlot.AFTER_DINNER, glucoseValue: 89 }, // Normal (70–99)
      ];
    }

    for (const item of slotEntries) {
      readings.push({
        dateStr,
        date: dateObj,
        slot: item.slot,
        glucoseValue: item.glucoseValue,
      });
    }
  }

  return readings;
}

export async function seedDemoData(referenceDate: Date = new Date()): Promise<{
  demoUserId: string;
  demoEmail: string;
  totalDemoReadings: number;
  currentMonthReadings: number;
  previousMonthReadings: number;
  referenceDateStr: string;
}> {
  console.log(`Starting Sweety dynamic demo data seeding...`);

  const password = getRequiredDemoPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 1. Safe idempotent user upsert
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: DEMO_NAME,
      passwordHash,
    },
    create: {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash,
    },
  });

  console.log(`Demo user ready: ${demoUser.name} (${demoUser.email}) [ID: ${demoUser.id}]`);

  // 2. Generate dynamic readings relative to reference date
  const generatedReadings = generateDemoReadings(referenceDate);
  console.log(`Generated ${generatedReadings.length} dynamic demo readings for execution.`);

  // 3. Safe idempotent readings upsert using compound unique constraint
  let upsertCount = 0;
  for (const entry of generatedReadings) {
    await prisma.reading.upsert({
      where: {
        userId_date_slot: {
          userId: demoUser.id,
          date: entry.date,
          slot: entry.slot,
        },
      },
      update: {
        glucoseValue: entry.glucoseValue,
      },
      create: {
        userId: demoUser.id,
        date: entry.date,
        slot: entry.slot,
        glucoseValue: entry.glucoseValue,
      },
    });
    upsertCount++;
  }

  // 4. Verification queries
  const totalDemoReadings = await prisma.reading.count({
    where: { userId: demoUser.id },
  });

  const curYear = referenceDate.getUTCFullYear();
  const curMonth0 = referenceDate.getUTCMonth();
  const currentMonthStart = new Date(Date.UTC(curYear, curMonth0, 1, 0, 0, 0, 0));
  const currentMonthEnd = new Date(Date.UTC(curYear, curMonth0 + 1, 0, 23, 59, 59, 999));

  const currentMonthReadings = await prisma.reading.count({
    where: {
      userId: demoUser.id,
      date: { gte: currentMonthStart, lte: currentMonthEnd },
    },
  });

  const prevYear = curMonth0 === 0 ? curYear - 1 : curYear;
  const prevMonth0 = curMonth0 === 0 ? 11 : curMonth0 - 1;
  const prevMonthStart = new Date(Date.UTC(prevYear, prevMonth0, 1, 0, 0, 0, 0));
  const prevMonthEnd = new Date(Date.UTC(prevYear, prevMonth0 + 1, 0, 23, 59, 59, 999));

  const previousMonthReadings = await prisma.reading.count({
    where: {
      userId: demoUser.id,
      date: { gte: prevMonthStart, lte: prevMonthEnd },
    },
  });

  const refDateStr = formatUtcYmd(curYear, curMonth0 + 1, referenceDate.getUTCDate());

  console.log(`Dynamic seeding completed:`);
  console.log(`- Reference date: ${refDateStr}`);
  console.log(`- Processed entries: ${upsertCount}`);
  console.log(
    `- Current Month (${curYear}-${String(curMonth0 + 1).padStart(2, "0")}) readings: ${currentMonthReadings}`,
  );
  console.log(
    `- Previous Month (${prevYear}-${String(prevMonth0 + 1).padStart(2, "0")}) readings: ${previousMonthReadings}`,
  );
  console.log(`- Total demo readings in DB: ${totalDemoReadings}`);

  return {
    demoUserId: demoUser.id,
    demoEmail: demoUser.email,
    totalDemoReadings,
    currentMonthReadings,
    previousMonthReadings,
    referenceDateStr: refDateStr,
  };
}

async function main() {
  try {
    await seedDemoData();
  } catch (error) {
    console.error("Failed to seed demo data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
