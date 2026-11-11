import { IsNotEmpty, IsString, Matches } from "class-validator";

export class GetReportQueryDTO {
  @IsNotEmpty({ message: "Date is required" })
  @IsString({ message: "Date must be a string" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date!: string;
}
