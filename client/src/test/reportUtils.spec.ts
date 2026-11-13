import { describe, expect, it } from 'vitest'
import {
  formatReportPeriodRange,
  formatStatValue,
  getReportClinicalCategory,
  getReportCategoryLabel,
  getReportCategoryVariant,
  mapReportApiError,
} from '../features/reports/utils/reportUtils'

describe('reportUtils', () => {
  describe('formatReportPeriodRange', () => {
    it('returns empty string when start and end dates are empty', () => {
      expect(formatReportPeriodRange('', '')).toBe('')
    })

    it('formats single date for DAILY reports or identical start and end dates', () => {
      const res = formatReportPeriodRange('2026-11-12', '2026-11-12', 'DAILY')
      expect(res).toBeTruthy()
      expect(res).not.toContain('–')
    })

    it('formats a date range with an en-dash for multi-day periods', () => {
      const res = formatReportPeriodRange('2026-11-01', '2026-11-12', 'MONTH_TO_DATE')
      expect(res).toContain('–')
    })
  })

  describe('formatStatValue', () => {
    it('returns em-dash for null, undefined, or NaN without displaying 0 mg/dL', () => {
      expect(formatStatValue(null)).toBe('—')
      expect(formatStatValue(undefined)).toBe('—')
      expect(formatStatValue(NaN)).toBe('—')
    })

    it('formats numeric values with default mg/dL unit', () => {
      expect(formatStatValue(115)).toBe('115 mg/dL')
      expect(formatStatValue(95.4)).toBe('95.4 mg/dL')
    })

    it('formats 0 as "0 mg/dL" if explicitly a zero reading', () => {
      expect(formatStatValue(0)).toBe('0 mg/dL')
    })
  })

  describe('getReportClinicalCategory and labels', () => {
    it('returns null for missing or invalid values', () => {
      expect(getReportClinicalCategory(null)).toBeNull()
      expect(getReportCategoryVariant(null)).toBe('neutral')
      expect(getReportCategoryLabel(null)).toBe('No Data')
    })

    it('categorizes LOW for values < 70', () => {
      expect(getReportClinicalCategory(65)).toBe('LOW')
      expect(getReportCategoryVariant('LOW')).toBe('warning')
      expect(getReportCategoryLabel('LOW')).toContain('Hypoglycemic')
    })

    it('categorizes NORMAL for values between 70 and 99', () => {
      expect(getReportClinicalCategory(70)).toBe('NORMAL')
      expect(getReportClinicalCategory(99)).toBe('NORMAL')
      expect(getReportCategoryVariant('NORMAL')).toBe('success')
      expect(getReportCategoryLabel('NORMAL')).toContain('Normal')
    })

    it('categorizes ELEVATED for values between 100 and 125', () => {
      expect(getReportClinicalCategory(100)).toBe('ELEVATED')
      expect(getReportClinicalCategory(125)).toBe('ELEVATED')
      expect(getReportCategoryVariant('ELEVATED')).toBe('warning')
      expect(getReportCategoryLabel('ELEVATED')).toContain('Elevated')
    })

    it('categorizes HIGH for values >= 126', () => {
      expect(getReportClinicalCategory(126)).toBe('HIGH')
      expect(getReportClinicalCategory(210)).toBe('HIGH')
      expect(getReportCategoryVariant('HIGH')).toBe('danger')
      expect(getReportCategoryLabel('HIGH')).toContain('High')
    })
  })

  describe('mapReportApiError', () => {
    it('maps future date error correctly', () => {
      const err = { response: { data: { message: 'Future date is not allowed' } } }
      expect(mapReportApiError(err)).toContain('Future dates are not permitted')
    })

    it('maps invalid calendar date error correctly', () => {
      const err = { response: { data: { message: 'Invalid calendar date format' } } }
      expect(mapReportApiError(err)).toContain('not a valid calendar date')
    })

    it('maps 401 unauthorized session expiration error', () => {
      const err = { statusCode: 401 }
      expect(mapReportApiError(err)).toContain('session has expired')
    })

    it('falls back to generic error message for unknown structures', () => {
      expect(mapReportApiError(null)).toBe('Failed to load report. Please try again.')
      expect(mapReportApiError('random string')).toBe('Failed to load report. Please try again.')
    })
  })
})
