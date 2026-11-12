import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReports } from '../features/reports/hooks/useReports'
import { reportService } from '../features/reports/services/reportService'
import type { DailyReport, MonthToDateReport, PreviousMonthReport } from '../features/reports/types'

describe('useReports Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockDaily: DailyReport = {
    reportType: 'DAILY',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    highest: 135,
    lowest: 88,
    average: 104.2,
    count: 2,
    totalReadings: 2,
    hasData: true,
    readings: [
      {
        id: 'r-1',
        date: '2026-11-12',
        slot: 'MORNING',
        glucoseValue: 88,
        createdAt: '2026-11-12T07:00:00.000Z',
      },
      {
        id: 'r-2',
        date: '2026-11-12',
        slot: 'AFTER_BREAKFAST',
        glucoseValue: 135,
        createdAt: '2026-11-12T09:00:00.000Z',
      },
    ],
  }

  const mockMtd: MonthToDateReport = {
    reportType: 'MONTH_TO_DATE',
    startDate: '2026-11-01',
    endDate: '2026-11-12',
    highest: 160,
    lowest: 74,
    average: 112.5,
    count: 24,
    totalReadings: 24,
    hasData: true,
  }

  const mockPrevMonth: PreviousMonthReport = {
    reportType: 'PREVIOUS_MONTH',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    highest: 170,
    lowest: 70,
    average: 109.8,
    count: 60,
    totalReadings: 60,
    hasData: true,
  }

  it('fetches daily report by default on mount', async () => {
    vi.spyOn(reportService, 'getDailyReport').mockResolvedValueOnce(mockDaily)

    const { result } = renderHook(() => useReports('daily', '2026-11-12'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.report).toEqual(mockDaily)
    expect(result.current.dailyReport).toEqual(mockDaily)
    expect(result.current.error).toBeNull()
    expect(reportService.getDailyReport).toHaveBeenCalledWith('2026-11-12')
  })

  it('fetches month-to-date report when active period is changed', async () => {
    vi.spyOn(reportService, 'getDailyReport').mockResolvedValueOnce(mockDaily)
    vi.spyOn(reportService, 'getMonthToDateReport').mockResolvedValueOnce(mockMtd)

    const { result } = renderHook(() => useReports('daily', '2026-11-12'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setActivePeriod('month-to-date')
    })

    await waitFor(() => {
      expect(result.current.report).toEqual(mockMtd)
    })

    expect(result.current.activePeriod).toBe('month-to-date')
    expect(result.current.dailyReport).toBeNull()
    expect(reportService.getMonthToDateReport).toHaveBeenCalledWith('2026-11-12')
  })

  it('fetches previous-month report when period is switched to previous-month', async () => {
    vi.spyOn(reportService, 'getDailyReport').mockResolvedValueOnce(mockDaily)
    vi.spyOn(reportService, 'getPreviousMonthReport').mockResolvedValueOnce(mockPrevMonth)

    const { result } = renderHook(() => useReports('daily', '2026-11-12'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setActivePeriod('previous-month')
    })

    await waitFor(() => {
      expect(result.current.report).toEqual(mockPrevMonth)
    })

    expect(result.current.activePeriod).toBe('previous-month')
    expect(reportService.getPreviousMonthReport).toHaveBeenCalledWith('2026-11-12')
  })

  it('refetches when selected date changes', async () => {
    vi.spyOn(reportService, 'getDailyReport').mockResolvedValue(mockDaily)

    const { result } = renderHook(() => useReports('daily', '2026-11-12'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedDate('2026-11-11')
    })

    await waitFor(() => {
      expect(reportService.getDailyReport).toHaveBeenCalledWith('2026-11-11')
    })

    expect(result.current.selectedDate).toBe('2026-11-11')
  })

  it('handles error state properly and clears error on request', async () => {
    vi.spyOn(reportService, 'getDailyReport').mockRejectedValueOnce({
      response: { data: { message: 'Future date is not allowed' } },
    })

    const { result } = renderHook(() => useReports('daily', '2026-11-13'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toContain('Future dates are not permitted')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('guards against race conditions where slower response arrives after faster one', async () => {
    let resolveFirstRequest!: (val: DailyReport) => void
    let resolveSecondRequest!: (val: DailyReport) => void

    const slowFirstPromise = new Promise<DailyReport>((resolve) => {
      resolveFirstRequest = resolve
    })
    const fastSecondPromise = new Promise<DailyReport>((resolve) => {
      resolveSecondRequest = resolve
    })

    const getDailySpy = vi.spyOn(reportService, 'getDailyReport')
    getDailySpy.mockReturnValueOnce(slowFirstPromise)
    getDailySpy.mockReturnValueOnce(fastSecondPromise)

    const { result } = renderHook(() => useReports('daily', '2026-11-10'))

    // Trigger second request while first is still pending
    act(() => {
      result.current.setSelectedDate('2026-11-11')
    })

    // Resolve second request first
    const updatedDaily: DailyReport = {
      ...mockDaily,
      startDate: '2026-11-11',
      endDate: '2026-11-11',
      highest: 150,
    }
    await act(async () => {
      resolveSecondRequest(updatedDaily)
    })

    await waitFor(() => {
      expect(result.current.report?.highest).toBe(150)
    })

    // Now resolve the older slow first request
    const staleDaily: DailyReport = {
      ...mockDaily,
      startDate: '2026-11-10',
      endDate: '2026-11-10',
      highest: 99,
    }
    await act(async () => {
      resolveFirstRequest(staleDaily)
    })

    // Verify state was NOT overwritten by stale request
    expect(result.current.report?.highest).toBe(150)
  })
})
