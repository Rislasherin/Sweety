import { formatDateOnly } from '@/features/readings/utils/readingValidation'
import type { GlucoseCategory } from '@/types/glucose.types'
import type { StatusVariant } from '@/types/common.types'

/**
 * Format a calendar date range into a user-friendly label.
 */
export function formatReportPeriodRange(
  startDate: string,
  endDate: string,
  reportType?: 'DAILY' | 'MONTH_TO_DATE' | 'PREVIOUS_MONTH'
): string {
  if (!startDate && !endDate) return ''

  if (reportType === 'DAILY' || startDate === endDate) {
    return formatDateOnly(startDate)
  }

  const startFormatted = formatDateOnly(startDate)
  const endFormatted = formatDateOnly(endDate)

  return `${startFormatted} – ${endFormatted}`
}

/**
 * Format statistical metric values safely.
 * Never outputs '0 mg/dL' for missing or null statistics.
 */
export function formatStatValue(value: number | null | undefined, unit = 'mg/dL'): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return `${value} ${unit}`
}

/**
 * Determine clinical glycemic category for average or reading values:
 * - Low / Hypoglycemia: < 70 mg/dL
 * - Normal / In Range: 70 – 99 mg/dL
 * - Elevated / Impaired: 100 – 125 mg/dL
 * - High / Hyperglycemia: >= 126 mg/dL
 */
export function getReportClinicalCategory(value: number | null): GlucoseCategory | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }
  if (value < 70) return 'LOW'
  if (value < 100) return 'NORMAL'
  if (value < 126) return 'ELEVATED'
  return 'HIGH'
}

export function getReportCategoryVariant(category: GlucoseCategory | null): StatusVariant {
  switch (category) {
    case 'LOW':
      return 'warning'
    case 'NORMAL':
      return 'success'
    case 'ELEVATED':
      return 'warning'
    case 'HIGH':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function getReportCategoryLabel(category: GlucoseCategory | null): string {
  switch (category) {
    case 'LOW':
      return 'Hypoglycemic (< 70)'
    case 'NORMAL':
      return 'Normal (70–99)'
    case 'ELEVATED':
      return 'Elevated (100–125)'
    case 'HIGH':
      return 'High (≥ 126)'
    default:
      return 'No Data'
  }
}

/**
 * Translate backend errors on reports endpoints into helpful user feedback.
 */
export function mapReportApiError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Failed to load report. Please try again.'
  }

  const err = error as {
    message?: string
    statusCode?: number
    response?: { data?: { message?: string } }
  }

  const message = err.response?.data?.message || err.message || ''

  if (message.toLowerCase().includes('future date')) {
    return 'Future dates are not permitted. Please select today or a past date.'
  }

  if (message.toLowerCase().includes('invalid calendar date')) {
    return 'The selected date is not a valid calendar date.'
  }

  if (err.statusCode === 401) {
    return 'Your session has expired. Please log in again to view your reports.'
  }

  return message || 'An error occurred while generating the report. Please try again.'
}
