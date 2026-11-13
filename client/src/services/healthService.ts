import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@/types/api.types'

export interface HealthData {
  status: string
  timestamp?: string
  uptime?: number
}

export const healthService = {
  async checkHealth(): Promise<HealthData> {
    const response = await apiClient.get<ApiResponse<HealthData> | HealthData>('/health')
    const body = response.data
    if (body && typeof body === 'object' && 'data' in body && body.data) {
      return body.data
    }
    return body as HealthData
  },
}
