import { type IGeneratePreviousMonthReportUseCase } from "../interfaces/IGeneratePreviousMonthReportUseCase";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import {
  type PreviousMonthReportResponseDTO,
  ReportType,
} from "@application/dtos/report/Response/ReportResponseDTO";
import { parseDateOnly, assertNotFutureDate, getPreviousMonthRange } from "@domain/utils/dateUtils";

export class GeneratePreviousMonthReportUseCase implements IGeneratePreviousMonthReportUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, dateStr: string): Promise<PreviousMonthReportResponseDTO> {
    const selectedDate = parseDateOnly(dateStr);
    assertNotFutureDate(selectedDate);

    const range = getPreviousMonthRange(selectedDate);
    const stats = await this._readingRepository.getAggregatedStats(
      userId,
      range.startDate,
      range.endDate,
    );

    if (stats.count === 0) {
      return {
        reportType: ReportType.PREVIOUS_MONTH,
        startDate: range.startDateStr,
        endDate: range.endDateStr,
        highest: null,
        lowest: null,
        average: null,
        count: 0,
        totalReadings: 0,
        hasData: false,
      };
    }

    return {
      reportType: ReportType.PREVIOUS_MONTH,
      startDate: range.startDateStr,
      endDate: range.endDateStr,
      highest: stats.highest,
      lowest: stats.lowest,
      average: stats.average,
      count: stats.count,
      totalReadings: stats.count,
      hasData: true,
    };
  }
}
