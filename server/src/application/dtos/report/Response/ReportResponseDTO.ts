import { type ReadingSlotType } from "@domain/enums/ReadingSlotType";

export enum ReportType {
  DAILY = "DAILY",
  MONTH_TO_DATE = "MONTH_TO_DATE",
  PREVIOUS_MONTH = "PREVIOUS_MONTH",
}

export interface DailyReportReadingItemDTO {
  id: string;
  date: string;
  slot: ReadingSlotType;
  glucoseValue: number;
  createdAt: string;
}

export interface DailyTrendPointDTO {
  date: string;
  average: number;
  count: number;
  highest: number;
  lowest: number;
}

export interface BaseReportResponseDTO {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  totalReadings: number;
  hasData: boolean;
  dailyTrends?: DailyTrendPointDTO[];
}

export interface DailyReportResponseDTO extends BaseReportResponseDTO {
  readings: DailyReportReadingItemDTO[];
}

export type MonthToDateReportResponseDTO = BaseReportResponseDTO;

export type PreviousMonthReportResponseDTO = BaseReportResponseDTO;
