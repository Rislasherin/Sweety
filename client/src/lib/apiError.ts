import type { ApiErrorDetail } from '@/types/api.types'

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: ApiErrorDetail[] | unknown
  public readonly isNetworkError: boolean

  constructor(params: {
    message: string
    statusCode?: number
    code?: string
    details?: ApiErrorDetail[] | unknown
    isNetworkError?: boolean
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.statusCode = params.statusCode ?? 500
    this.code = params.code ?? 'UNKNOWN_ERROR'
    this.details = params.details
    this.isNetworkError = Boolean(params.isNetworkError)

    Object.setPrototypeOf(this, new.target.prototype)
  }

  public isUnauthorized(): boolean {
    return this.statusCode === 401 || this.code === 'UNAUTHORIZED'
  }

  public isForbidden(): boolean {
    return this.statusCode === 403 || this.code === 'FORBIDDEN'
  }

  public isNotFound(): boolean {
    return this.statusCode === 404 || this.code === 'NOT_FOUND'
  }

  public isValidationError(): boolean {
    return this.statusCode === 400 || this.code === 'VALIDATION_ERROR'
  }
}
