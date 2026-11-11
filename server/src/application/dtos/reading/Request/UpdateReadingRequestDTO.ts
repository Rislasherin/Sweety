import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";
import { ReadingSlotType } from "@domain/enums/ReadingSlotType";

export class UpdateReadingRequestDTO {
  @IsOptional()
  @IsString({ message: "Date must be a string" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date?: string;

  @IsOptional()
  @IsEnum(ReadingSlotType, {
    message: "Invalid slot. Must be MORNING, AFTER_BREAKFAST, AFTER_LUNCH, or AFTER_DINNER",
  })
  slot?: ReadingSlotType;

  @IsOptional()
  @IsInt({ message: "Glucose value must be a whole number" })
  @Min(40, { message: "Glucose value must be at least 40" })
  @Max(600, { message: "Glucose value must be at most 600" })
  glucoseValue?: number;
}
