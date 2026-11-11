import { type MonthToDateReportResponseDTO } from "@application/dtos/report/Response/ReportResponseDTO";

export interface IGenerateMonthToDateReportUseCase {
  execute(userId: string, dateStr: string): Promise<MonthToDateReportResponseDTO>;
}
