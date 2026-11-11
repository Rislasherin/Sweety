import { type PreviousMonthReportResponseDTO } from "@application/dtos/report/Response/ReportResponseDTO";

export interface IGeneratePreviousMonthReportUseCase {
  execute(userId: string, dateStr: string): Promise<PreviousMonthReportResponseDTO>;
}
