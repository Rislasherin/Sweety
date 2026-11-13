import { describe, expect, it } from 'vitest'
import type { Reading, ReadingFormData } from '../features/readings/types'
import {
  formatDateOnly,
  formatReadingSlot,
  getReadingSlotDescription,
  groupReadingsByDate,
  mapApiErrorToFriendlyMessage,
  validateReadingForm,
} from '../features/readings/utils/readingValidation'
import { getTodayIsoString } from '../utils/date'

describe('Reading Validation & Utilities', () => {
  const today = getTodayIsoString()

  describe('validateReadingForm', () => {
    it('accepts valid input for all fields', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: '95',
      }
      const errors = validateReadingForm(data)
      expect(errors).toEqual({})
    })

    it('accepts edge boundaries 40 and 600', () => {
      const minData: ReadingFormData = {
        date: today,
        slot: 'AFTER_BREAKFAST',
        glucoseValue: '40',
      }
      expect(validateReadingForm(minData)).toEqual({})

      const maxData: ReadingFormData = {
        date: today,
        slot: 'AFTER_DINNER',
        glucoseValue: '600',
      }
      expect(validateReadingForm(maxData)).toEqual({})
    })

    it('rejects empty glucose value', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: '',
      }
      const errors = validateReadingForm(data)
      expect(errors.glucoseValue).toBe('Glucose value is required')
    })

    it('rejects decimal glucose values', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: '95.5',
      }
      const errors = validateReadingForm(data)
      expect(errors.glucoseValue).toBe('Glucose value must be a whole number')
    })

    it('rejects non-numeric glucose values', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: 'abc',
      }
      const errors = validateReadingForm(data)
      expect(errors.glucoseValue).toBe('Glucose value must be a whole number')
    })

    it('rejects negative glucose values', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: '-20',
      }
      const errors = validateReadingForm(data)
      expect(errors.glucoseValue).toBe('Glucose value must be at least 40 mg/dL')
    })

    it('rejects values below 40', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: '39',
      }
      const errors = validateReadingForm(data)
      expect(errors.glucoseValue).toBe('Glucose value must be at least 40 mg/dL')
    })

    it('rejects values above 600', () => {
      const data: ReadingFormData = {
        date: today,
        slot: 'MORNING',
        glucoseValue: '601',
      }
      const errors = validateReadingForm(data)
      expect(errors.glucoseValue).toBe('Glucose value must be at most 600 mg/dL')
    })

    it('rejects empty reading date', () => {
      const data: ReadingFormData = {
        date: '',
        slot: 'MORNING',
        glucoseValue: '100',
      }
      const errors = validateReadingForm(data)
      expect(errors.date).toBe('Reading date is required')
    })

    it('rejects malformed date formats', () => {
      const data: ReadingFormData = {
        date: '11/11/2026',
        slot: 'MORNING',
        glucoseValue: '100',
      }
      const errors = validateReadingForm(data)
      expect(errors.date).toBe('Date must be in YYYY-MM-DD format')
    })

    it('rejects future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const futureDate = tomorrow.toISOString().split('T')[0]

      const data: ReadingFormData = {
        date: futureDate,
        slot: 'MORNING',
        glucoseValue: '100',
      }
      const errors = validateReadingForm(data)
      expect(errors.date).toBe('Date cannot be in the future')
    })

    it('rejects empty reading slot', () => {
      const data: ReadingFormData = {
        date: today,
        slot: '',
        glucoseValue: '100',
      }
      const errors = validateReadingForm(data)
      expect(errors.slot).toBe('Reading slot is required')
    })

    it('accepts all 4 standard reading slots', () => {
      const slots = ['MORNING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'] as const
      for (const slot of slots) {
        const errors = validateReadingForm({
          date: today,
          slot,
          glucoseValue: '110',
        })
        expect(errors).toEqual({})
      }
    })
  })

  describe('formatReadingSlot & getReadingSlotDescription', () => {
    it('formats slots into friendly UI labels', () => {
      expect(formatReadingSlot('MORNING')).toBe('Morning')
      expect(formatReadingSlot('AFTER_BREAKFAST')).toBe('After Breakfast')
      expect(formatReadingSlot('AFTER_LUNCH')).toBe('After Lunch')
      expect(formatReadingSlot('AFTER_DINNER')).toBe('After Dinner')
    })

    it('returns description for each slot', () => {
      expect(getReadingSlotDescription('MORNING')).toBe('Fasting / upon waking')
      expect(getReadingSlotDescription('AFTER_BREAKFAST')).toContain('breakfast')
      expect(getReadingSlotDescription('AFTER_LUNCH')).toContain('lunch')
      expect(getReadingSlotDescription('AFTER_DINNER')).toContain('dinner')
    })
  })

  describe('formatDateOnly', () => {
    it('formats YYYY-MM-DD consistently without timezone shifting', () => {
      const formatted = formatDateOnly('2026-11-11')
      expect(formatted).toContain('Nov 11, 2026')
    })

    it('returns empty string for empty input', () => {
      expect(formatDateOnly('')).toBe('')
    })
  })

  describe('groupReadingsByDate', () => {
    it('groups readings by date in descending order with canonical slot ordering', () => {
      const readings: Reading[] = [
        {
          id: '1',
          userId: 'user-1',
          date: '2026-11-10',
          slot: 'AFTER_DINNER',
          glucoseValue: 120,
          createdAt: '2026-11-10T20:00:00Z',
          updatedAt: '2026-11-10T20:00:00Z',
        },
        {
          id: '2',
          userId: 'user-1',
          date: '2026-11-11',
          slot: 'AFTER_BREAKFAST',
          glucoseValue: 105,
          createdAt: '2026-11-11T09:00:00Z',
          updatedAt: '2026-11-11T09:00:00Z',
        },
        {
          id: '3',
          userId: 'user-1',
          date: '2026-11-11',
          slot: 'MORNING',
          glucoseValue: 92,
          createdAt: '2026-11-11T07:00:00Z',
          updatedAt: '2026-11-11T07:00:00Z',
        },
      ]

      const grouped = groupReadingsByDate(readings)
      const dates = Object.keys(grouped)

      expect(dates).toEqual(['2026-11-11', '2026-11-10'])
      // Within 2026-11-11, MORNING (slot order 0) comes before AFTER_BREAKFAST (slot order 1)
      expect(grouped['2026-11-11'][0].slot).toBe('MORNING')
      expect(grouped['2026-11-11'][1].slot).toBe('AFTER_BREAKFAST')
    })
  })

  describe('mapApiErrorToFriendlyMessage', () => {
    it('translates duplicate slot conflict error', () => {
      const error = {
        statusCode: 409,
        message: 'A reading for this slot already exists on this date',
      }
      const message = mapApiErrorToFriendlyMessage(error)
      expect(message).toContain('already exists on this date')
    })

    it('translates daily reading limit exceeded error', () => {
      const error = {
        statusCode: 400,
        message: 'Daily reading limit of 4 readings has been reached for this date',
      }
      const message = mapApiErrorToFriendlyMessage(error)
      expect(message).toContain('Daily limit reached')
      expect(message).toContain('4 readings')
    })

    it('translates future date error', () => {
      const error = {
        statusCode: 400,
        message: 'Future dates are not allowed',
      }
      const message = mapApiErrorToFriendlyMessage(error)
      expect(message).toContain('Future dates are not allowed')
    })

    it('translates not found error', () => {
      const error = {
        statusCode: 404,
        message: 'Reading not found',
      }
      const message = mapApiErrorToFriendlyMessage(error)
      expect(message).toContain('not found')
    })

    it('translates session expiration', () => {
      const error = { statusCode: 401, message: 'Unauthorized' }
      const message = mapApiErrorToFriendlyMessage(error)
      expect(message).toContain('session has expired')
    })
  })
})
