import { IsOptional, IsString, Matches } from "class-validator";

export class GetReadingsQueryDTO {
  @IsOptional()
  @IsString({ message: "Date must be a string" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date?: string;
}
