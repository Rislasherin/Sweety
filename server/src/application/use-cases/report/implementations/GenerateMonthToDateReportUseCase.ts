import { type IGenerateMonthToDateReportUseCase } from "../interfaces/IGenerateMonthToDateReportUseCase";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import {
  type MonthToDateReportResponseDTO,
  ReportType,
} from "@application/dtos/report/Response/ReportResponseDTO";
import {
  parseDateOnly,
  assertNotFutureDate,
  getMonthToDateRange,
  calculateDailyTrends,
} from "@domain/utils/dateUtils";

export class GenerateMonthToDateReportUseCase implements IGenerateMonthToDateReportUseCase {
  constructor(private readonly _readingRepository: IReadingRepository) {}

  async execute(userId: string, dateStr: string): Promise<MonthToDateReportResponseDTO> {
    const selectedDate = parseDateOnly(dateStr);
    assertNotFutureDate(selectedDate);

    const range = getMonthToDateRange(selectedDate);
    const stats = await this._readingRepository.getAggregatedStats(
      userId,
      range.startDate,
      range.endDate,
    );

    const hasFindByDateRange = typeof this._readingRepository.findByDateRange === "function";

    if (stats.count === 0) {
      const emptyReport: MonthToDateReportResponseDTO = {
        reportType: ReportType.MONTH_TO_DATE,
        startDate: range.startDateStr,
        endDate: range.endDateStr,
        highest: null,
        lowest: null,
        average: null,
        count: 0,
        totalReadings: 0,
        hasData: false,
      };
      if (hasFindByDateRange) {
        emptyReport.dailyTrends = [];
      }
      return emptyReport;
    }

    const report: MonthToDateReportResponseDTO = {
      reportType: ReportType.MONTH_TO_DATE,
      startDate: range.startDateStr,
      endDate: range.endDateStr,
      highest: stats.highest,
      lowest: stats.lowest,
      average: stats.average,
      count: stats.count,
      totalReadings: stats.count,
      hasData: true,
    };

    if (hasFindByDateRange) {
      const readings = await this._readingRepository.findByDateRange(
        userId,
        range.startDate,
        range.endDate,
      );
      report.dailyTrends = calculateDailyTrends(
        readings.map((r) => ({
          date: r.date,
          glucoseValue: r.value.getValue(),
        })),
      );
    }

    return report;
  }
}
