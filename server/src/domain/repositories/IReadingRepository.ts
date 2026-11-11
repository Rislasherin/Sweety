import { type Reading } from "@domain/entities/Reading";
import { type ReadingSlotType } from "@domain/enums/ReadingSlotType";

export interface GlucoseStatistics {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
}

export interface IReadingRepository {
  save(reading: Reading): Promise<Reading>;

  findById(id: string, userId: string): Promise<Reading | null>;

  findByUserId(userId: string, date?: Date): Promise<Reading[]>;

  findByUserIdDateAndSlot(
    userId: string,
    date: Date,
    slot: ReadingSlotType,
  ): Promise<Reading | null>;

  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Reading[]>;

  countByUserIdAndDate(userId: string, date: Date): Promise<number>;

  getAggregatedStats(userId: string, startDate: Date, endDate: Date): Promise<GlucoseStatistics>;

  update(reading: Reading): Promise<Reading>;

  delete(id: string, userId: string): Promise<boolean>;
}
