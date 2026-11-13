import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reportService } from '../features/reports/services/reportService'
import type { DailyReport, MonthToDateReport, PreviousMonthReport } from '../features/reports/types'
import { apiClient } from '../lib/apiClient'

describe('reportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockDailyReport: DailyReport = {
    reportType: 'DAILY',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    highest: 145,
    lowest: 85,
    average: 110.5,
    count: 3,
    totalReadings: 3,
    hasData: true,
    readings: [
      {
        id: 'r-1',
        date: '2026-11-12',
        slot: 'MORNING',
        glucoseValue: 85,
        createdAt: '2026-11-12T07:30:00.000Z',
      },
      {
        id: 'r-2',
        date: '2026-11-12',
        slot: 'AFTER_BREAKFAST',
        glucoseValue: 145,
        createdAt: '2026-11-12T09:30:00.000Z',
      },
      {
        id: 'r-3',
        date: '2026-11-12',
        slot: 'AFTER_LUNCH',
        glucoseValue: 102,
        createdAt: '2026-11-12T13:30:00.000Z',
      },
    ],
  }

  const mockMonthToDateReport: MonthToDateReport = {
    reportType: 'MONTH_TO_DATE',
    startDate: '2026-11-01',
    endDate: '2026-11-12',
    highest: 180,
    lowest: 72,
    average: 114.2,
    count: 28,
    totalReadings: 28,
    hasData: true,
  }

  const mockPreviousMonthReport: PreviousMonthReport = {
    reportType: 'PREVIOUS_MONTH',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    highest: 165,
    lowest: 68,
    average: 108.7,
    count: 75,
    totalReadings: 75,
    hasData: true,
  }

  it('getDailyReport calls /reports/daily with date query param and returns report data', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Daily report retrieved successfully',
        data: mockDailyReport,
      },
    })

    const result = await reportService.getDailyReport('2026-11-12')

    expect(apiClient.get).toHaveBeenCalledWith('/reports/daily', {
      params: { date: '2026-11-12' },
    })
    expect(result).toEqual(mockDailyReport)
    expect(result.readings).toHaveLength(3)
  })

  it('getMonthToDateReport calls /reports/month-to-date with date query param and returns aggregated data', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Month-to-date report retrieved successfully',
        data: mockMonthToDateReport,
      },
    })

    const result = await reportService.getMonthToDateReport('2026-11-12')

    expect(apiClient.get).toHaveBeenCalledWith('/reports/month-to-date', {
      params: { date: '2026-11-12' },
    })
    expect(result).toEqual(mockMonthToDateReport)
    expect(result.average).toBe(114.2)
  })

  it('getPreviousMonthReport calls /reports/previous-month with date query param and returns aggregated data', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Previous month report retrieved successfully',
        data: mockPreviousMonthReport,
      },
    })

    const result = await reportService.getPreviousMonthReport('2026-11-12')

    expect(apiClient.get).toHaveBeenCalledWith('/reports/previous-month', {
      params: { date: '2026-11-12' },
    })
    expect(result).toEqual(mockPreviousMonthReport)
    expect(result.count).toBe(75)
  })

  it('propagates API client errors', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network error'))

    await expect(reportService.getDailyReport('2026-11-12')).rejects.toThrow('Network error')
  })
})
