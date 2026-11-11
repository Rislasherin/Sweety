import { IsEnum, IsInt, IsNotEmpty, IsString, Matches, Max, Min } from "class-validator";
import { ReadingSlotType } from "@domain/enums/ReadingSlotType";

export class CreateReadingRequestDTO {
  @IsString({ message: "Date must be a string" })
  @IsNotEmpty({ message: "Date is required" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date!: string;

  @IsEnum(ReadingSlotType, {
    message: "Invalid slot. Must be MORNING, AFTER_BREAKFAST, AFTER_LUNCH, or AFTER_DINNER",
  })
  @IsNotEmpty({ message: "Slot is required" })
  slot!: ReadingSlotType;

  @IsInt({ message: "Glucose value must be a whole number" })
  @Min(40, { message: "Glucose value must be at least 40" })
  @Max(600, { message: "Glucose value must be at most 600" })
  @IsNotEmpty({ message: "Glucose value is required" })
  glucoseValue!: number;
}
