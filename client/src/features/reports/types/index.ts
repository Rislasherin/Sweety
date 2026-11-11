import type { GlucoseStats, GlucoseReading } from '@/types/glucose.types'

export type ReportType = 'daily' | 'month-to-date' | 'previous-month'

export interface DailyReportViewModel {
  date: string
  stats: GlucoseStats
  readings: GlucoseReading[]
}

export interface PeriodReportViewModel {
  startDate: string
  endDate: string
  stats: GlucoseStats
  readings: GlucoseReading[]
}
