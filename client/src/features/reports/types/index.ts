import type { ReadingSlotType } from '@/features/readings/types'

export type ReportPeriod = 'daily' | 'month-to-date' | 'previous-month'

export interface DailyReportReadingItem {
  id: string
  date: string // YYYY-MM-DD
  slot: ReadingSlotType
  glucoseValue: number
  createdAt: string // ISO 8601 string
}

export interface BaseReport {
  reportType: 'DAILY' | 'MONTH_TO_DATE' | 'PREVIOUS_MONTH'
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  highest: number | null
  lowest: number | null
  average: number | null // Rounded to 1 decimal place
  count: number
  totalReadings: number
  hasData: boolean
}

export interface DailyReport extends BaseReport {
  reportType: 'DAILY'
  readings: DailyReportReadingItem[]
}

export type MonthToDateReport = BaseReport

export type PreviousMonthReport = BaseReport

export type AnyReport = DailyReport | BaseReport
