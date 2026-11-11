import { Prisma, type PrismaClient } from "@prisma/client";
import {
  type IReadingRepository,
  type GlucoseStatistics,
} from "@domain/repositories/IReadingRepository";
import { type Reading } from "@domain/entities/Reading";
import { type ReadingSlotType, READING_SLOT_ORDER } from "@domain/enums/ReadingSlotType";
import { DuplicateReadingSlotError } from "@domain/errors/ReadingErrors";
import { roundToOneDecimal } from "@domain/utils/dateUtils";
import { PrismaReadingMapper } from "@infrastructure/mappers/PrismaReadingMapper";

export class PrismaReadingRepository implements IReadingRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async save(reading: Reading): Promise<Reading> {
    try {
      const saved = await this._prisma.reading.create({
        data: PrismaReadingMapper.toPersistence(reading),
      });

      return PrismaReadingMapper.toDomain(saved);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateReadingSlotError();
      }
      throw error;
    }
  }

  async findById(id: string, userId: string): Promise<Reading | null> {
    const record = await this._prisma.reading.findFirst({
      where: {
        id,
        userId,
      },
    });

    return record ? PrismaReadingMapper.toDomain(record) : null;
  }

  async findByUserId(userId: string, date?: Date): Promise<Reading[]> {
    const records = await this._prisma.reading.findMany({
      where: {
        userId,
        ...(date ? { date } : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    });

    const readings = records.map(PrismaReadingMapper.toDomain);

    // Sort consistently: date DESC, slot in standard order
    return readings.sort((a, b) => {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return READING_SLOT_ORDER[a.slot] - READING_SLOT_ORDER[b.slot];
    });
  }

  async findByUserIdDateAndSlot(
    userId: string,
    date: Date,
    slot: ReadingSlotType,
  ): Promise<Reading | null> {
    const record = await this._prisma.reading.findUnique({
      where: {
        userId_date_slot: {
          userId,
          date,
          slot,
        },
      },
    });

    return record ? PrismaReadingMapper.toDomain(record) : null;
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Reading[]> {
    const records = await this._prisma.reading.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    });

    const readings = records.map(PrismaReadingMapper.toDomain);

    return readings.sort((a, b) => {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return READING_SLOT_ORDER[a.slot] - READING_SLOT_ORDER[b.slot];
    });
  }

  async countByUserIdAndDate(userId: string, date: Date): Promise<number> {
    return this._prisma.reading.count({
      where: {
        userId,
        date,
      },
    });
  }

  async getAggregatedStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GlucoseStatistics> {
    const result = await this._prisma.reading.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _min: { glucoseValue: true },
      _max: { glucoseValue: true },
      _avg: { glucoseValue: true },
      _count: { _all: true },
    });

    const count = result._count._all;
    if (count === 0) {
      return {
        highest: null,
        lowest: null,
        average: null,
        count: 0,
      };
    }

    const rawAvg = result._avg.glucoseValue ?? 0;
    const roundedAvg = roundToOneDecimal(rawAvg);

    return {
      highest: result._max.glucoseValue,
      lowest: result._min.glucoseValue,
      average: roundedAvg,
      count,
    };
  }

  async update(reading: Reading): Promise<Reading> {
    try {
      const updated = await this._prisma.reading.update({
        where: {
          id: reading.id,
        },
        data: PrismaReadingMapper.toUpdateInput(reading),
      });

      return PrismaReadingMapper.toDomain(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateReadingSlotError();
      }
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this._prisma.reading.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return result.count > 0;
  }
}
