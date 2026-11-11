import { type DailyReportResponseDTO } from "@application/dtos/report/Response/ReportResponseDTO";

export interface IGenerateDailyReportUseCase {
  execute(userId: string, dateStr: string): Promise<DailyReportResponseDTO>;
}
