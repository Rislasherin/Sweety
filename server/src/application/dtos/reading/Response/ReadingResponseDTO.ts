import { Expose } from "class-transformer";
import { ReadingSlotType } from "@domain/enums/ReadingSlotType";

export class ReadingResponseDTO {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  date!: string;

  @Expose()
  slot!: ReadingSlotType;

  @Expose()
  glucoseValue!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
