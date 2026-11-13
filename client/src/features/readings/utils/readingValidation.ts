import { getTodayIsoString } from '@/utils/date'
import type {
  Reading,
  ReadingFormData,
  ReadingFormErrors,
  ReadingSlotOption,
  ReadingSlotType,
} from '../types'

export const READING_SLOT_OPTIONS: readonly ReadingSlotOption[] = [
  {
    value: 'MORNING',
    label: 'Morning',
    description: 'Fasting / upon waking',
  },
  {
    value: 'AFTER_BREAKFAST',
    label: 'After Breakfast',
    description: 'Post-breakfast (1-2 hours)',
  },
  {
    value: 'AFTER_LUNCH',
    label: 'After Lunch',
    description: 'Post-lunch (1-2 hours)',
  },
  {
    value: 'AFTER_DINNER',
    label: 'After Dinner',
    description: 'Post-dinner (1-2 hours)',
  },
] as const

export const READING_SLOT_ORDER: Record<ReadingSlotType, number> = {
  MORNING: 0,
  AFTER_BREAKFAST: 1,
  AFTER_LUNCH: 2,
  AFTER_DINNER: 3,
}

export function formatReadingSlot(slot: ReadingSlotType): string {
  switch (slot) {
    case 'MORNING':
      return 'Morning'
    case 'AFTER_BREAKFAST':
      return 'After Breakfast'
    case 'AFTER_LUNCH':
      return 'After Lunch'
    case 'AFTER_DINNER':
      return 'After Dinner'
    default:
      return slot
  }
}

export function getReadingSlotDescription(slot: ReadingSlotType): string {
  const option = READING_SLOT_OPTIONS.find((opt) => opt.value === slot)
  return option ? option.description : ''
}

/**
 * Timezone-safe calendar date formatter for YYYY-MM-DD strings.
 * Avoids UTC midnight shift that shifts calendar dates when using new Date(string).
 */
export function formatDateOnly(dateStr: string): string {
  if (!dateStr) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return dateStr

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)

  const d = new Date(year, month, day)
  if (Number.isNaN(d.getTime())) return dateStr

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Validate reading form fields against domain and API requirements.
 */
export function validateReadingForm(data: ReadingFormData): ReadingFormErrors {
  const errors: ReadingFormErrors = {}

  // 1. Glucose Value Validation
  const rawValue =
    typeof data.glucoseValue === 'string'
      ? data.glucoseValue.trim()
      : String(data.glucoseValue ?? '')
  if (!rawValue) {
    errors.glucoseValue = 'Glucose value is required'
  } else if (rawValue.includes('.') || !/^-?\d+$/.test(rawValue)) {
    errors.glucoseValue = 'Glucose value must be a whole number'
  } else {
    const num = Number(rawValue)
    if (Number.isNaN(num)) {
      errors.glucoseValue = 'Glucose value must be a valid number'
    } else if (num < 40) {
      errors.glucoseValue = 'Glucose value must be at least 40 mg/dL'
    } else if (num > 600) {
      errors.glucoseValue = 'Glucose value must be at most 600 mg/dL'
    }
  }

  // 2. Date Validation
  const rawDate = data.date ? data.date.trim() : ''
  if (!rawDate) {
    errors.date = 'Reading date is required'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    errors.date = 'Date must be in YYYY-MM-DD format'
  } else {
    const today = getTodayIsoString()
    if (rawDate > today) {
      errors.date = 'Date cannot be in the future'
    }
  }

  // 3. Slot Validation
  if (!data.slot) {
    errors.slot = 'Reading slot is required'
  } else if (!READING_SLOT_OPTIONS.some((opt) => opt.value === data.slot)) {
    errors.slot = 'Please select a valid reading slot'
  }

  return errors
}

/**
 * Group an array of readings by calendar date in descending order.
 * Within each date, readings are sorted by canonical slot order.
 */
export function groupReadingsByDate(readings: Reading[]): Record<string, Reading[]> {
  const groups: Record<string, Reading[]> = {}

  // Sort readings: date DESC, slot order ASC
  const sorted = [...readings].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return (READING_SLOT_ORDER[a.slot] ?? 0) - (READING_SLOT_ORDER[b.slot] ?? 0)
  })

  for (const reading of sorted) {
    if (!groups[reading.date]) {
      groups[reading.date] = []
    }
    groups[reading.date].push(reading)
  }

  return groups
}

/**
 * Map backend error payloads or HTTP statuses into clear, empathetic user-facing messages.
 */
export function mapApiErrorToFriendlyMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.'
  }

  const err = error as {
    message?: string
    statusCode?: number
    response?: { data?: { message?: string; details?: unknown } }
  }

  const message = err.response?.data?.message || err.message || ''

  if (
    message.toLowerCase().includes('already exists') ||
    message.toLowerCase().includes('duplicate') ||
    err.statusCode === 409
  ) {
    return 'A reading for this slot already exists on this date. Please choose another slot or edit the existing reading.'
  }

  if (
    message.toLowerCase().includes('daily reading limit') ||
    message.toLowerCase().includes('limit of 4 readings') ||
    message.toLowerCase().includes('maximum of 4')
  ) {
    return 'Daily limit reached. You can record up to 4 readings per date (one per slot).'
  }

  if (message.toLowerCase().includes('future date')) {
    return 'Future dates are not allowed. Please select today or an earlier date.'
  }

  if (message.toLowerCase().includes('not found') || err.statusCode === 404) {
    return 'The requested reading was not found or has already been deleted.'
  }

  if (err.statusCode === 401) {
    return 'Your session has expired. Please log in again.'
  }

  if (err.statusCode === 403) {
    return 'You do not have permission to modify this reading.'
  }

  return message || 'An unexpected error occurred while communicating with the server.'
}
