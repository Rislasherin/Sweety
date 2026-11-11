import type { Reading as PrismaReading, Prisma } from "@prisma/client";
import { Reading } from "@domain/entities/Reading";
import { GlucoseValue } from "@domain/value-objects/GlucoseValue";
import { type ReadingSlotType } from "@domain/enums/ReadingSlotType";

export class PrismaReadingMapper {
  static toDomain(raw: PrismaReading): Reading {
    return Reading.create({
      id: raw.id,
      userId: raw.userId,
      date: raw.date,
      slot: raw.slot as ReadingSlotType,
      value: GlucoseValue.create(raw.glucoseValue),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(reading: Reading): Prisma.ReadingUncheckedCreateInput {
    return {
      id: reading.id,
      userId: reading.userId,
      date: reading.date,
      slot: reading.slot,
      glucoseValue: reading.value.getValue(),
      createdAt: reading.createdAt,
      updatedAt: reading.updatedAt,
    };
  }

  static toUpdateInput(reading: Reading): Prisma.ReadingUpdateInput {
    return {
      date: reading.date,
      slot: reading.slot,
      glucoseValue: reading.value.getValue(),
      updatedAt: reading.updatedAt,
    };
  }
}
