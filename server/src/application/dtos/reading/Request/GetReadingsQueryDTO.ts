import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class GetReadingsQueryDTO {
  @IsOptional()
  @IsString({ message: "Date must be a string" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be greater than or equal to 1" })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be greater than or equal to 1" })
  @Max(100, { message: "Limit cannot exceed 100" })
  limit: number = 20;
}
