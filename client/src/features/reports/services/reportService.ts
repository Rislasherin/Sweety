import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@/types/api.types'
import type { DailyReport, MonthToDateReport, PreviousMonthReport } from '../types'

export const reportService = {
  /**
   * Fetch daily glycemic report for a specific calendar date.
   */
  async getDailyReport(date: string): Promise<DailyReport> {
    const response = await apiClient.get<ApiResponse<DailyReport>>('/reports/daily', {
      params: { date },
    })
    return response.data.data
  },

  /**
   * Fetch month-to-date aggregated report starting from the 1st of the month up to the selected date.
   */
  async getMonthToDateReport(date: string): Promise<MonthToDateReport> {
    const response = await apiClient.get<ApiResponse<MonthToDateReport>>('/reports/month-to-date', {
      params: { date },
    })
    return response.data.data
  },

  /**
   * Fetch previous full calendar month aggregated report relative to the selected date.
   */
  async getPreviousMonthReport(date: string): Promise<PreviousMonthReport> {
    const response = await apiClient.get<ApiResponse<PreviousMonthReport>>(
      '/reports/previous-month',
      {
        params: { date },
      }
    )
    return response.data.data
  },
}
