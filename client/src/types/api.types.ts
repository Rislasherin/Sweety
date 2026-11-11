export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  meta?: {
    timestamp?: string
    pagination?: PaginationMeta
  }
}

export interface ApiErrorDetail {
  field?: string
  message: string
  code?: string
}

export interface ApiErrorPayload {
  code?: string
  details?: ApiErrorDetail[] | unknown
}

export interface ApiErrorResponse {
  success: false
  message: string
  error?: ApiErrorPayload
}
