import { useCallback, useEffect, useRef, useState } from 'react'
import { getTodayIsoString } from '@/utils/date'
import { reportService } from '../services/reportService'
import type { AnyReport, DailyReport, ReportPeriod } from '../types'
import { mapReportApiError } from '../utils/reportUtils'

export interface UseReportsReturn {
  activePeriod: ReportPeriod
  selectedDate: string
  report: AnyReport | null
  dailyReport: DailyReport | null
  isLoading: boolean
  error: string | null
  setActivePeriod: (period: ReportPeriod) => void
  setSelectedDate: (date: string) => void
  refetch: () => Promise<void>
  clearError: () => void
}

export function useReports(
  initialPeriod: ReportPeriod = 'daily',
  initialDate: string = getTodayIsoString()
): UseReportsReturn {
  const [activePeriod, setActivePeriodState] = useState<ReportPeriod>(initialPeriod)
  const [selectedDate, setSelectedDateState] = useState<string>(initialDate)
  const [report, setReport] = useState<AnyReport | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Tracking request version to eliminate race conditions from rapid date/period switches
  const latestRequestIdRef = useRef<number>(0)

  const fetchReport = useCallback(async (period: ReportPeriod, date: string) => {
    const requestId = ++latestRequestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      let result: AnyReport
      if (period === 'daily') {
        result = await reportService.getDailyReport(date)
      } else if (period === 'month-to-date') {
        result = await reportService.getMonthToDateReport(date)
      } else {
        result = await reportService.getPreviousMonthReport(date)
      }

      if (requestId === latestRequestIdRef.current) {
        setReport(result)
        setError(null)
        setIsLoading(false)
      }
    } catch (err) {
      if (requestId === latestRequestIdRef.current) {
        setError(mapReportApiError(err))
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    const requestId = ++latestRequestIdRef.current

    const promise =
      activePeriod === 'daily'
        ? reportService.getDailyReport(selectedDate)
        : activePeriod === 'month-to-date'
          ? reportService.getMonthToDateReport(selectedDate)
          : reportService.getPreviousMonthReport(selectedDate)

    promise
      .then((result) => {
        if (!isCancelled && requestId === latestRequestIdRef.current) {
          setReport(result)
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled && requestId === latestRequestIdRef.current) {
          setError(mapReportApiError(err))
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activePeriod, selectedDate])

  const setActivePeriod = useCallback((period: ReportPeriod) => {
    setIsLoading(true)
    setActivePeriodState(period)
  }, [])

  const setSelectedDate = useCallback((date: string) => {
    setIsLoading(true)
    setSelectedDateState(date)
  }, [])

  const refetch = useCallback(async () => {
    await fetchReport(activePeriod, selectedDate)
  }, [activePeriod, selectedDate, fetchReport])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const dailyReport = report && report.reportType === 'DAILY' ? (report as DailyReport) : null

  return {
    activePeriod,
    selectedDate,
    report,
    dailyReport,
    isLoading,
    error,
    setActivePeriod,
    setSelectedDate,
    refetch,
    clearError,
  }
}
