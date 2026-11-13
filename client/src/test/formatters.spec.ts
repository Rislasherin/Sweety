import { describe, it, expect } from 'vitest'
import {
  getGlucoseCategory,
  formatGlucoseValue,
  getCategoryVariant,
  formatMealContext,
} from '@/utils/formatters'

describe('formatters utility', () => {
  describe('getGlucoseCategory', () => {
    it('categorizes < 70 as LOW (hypoglycemia)', () => {
      expect(getGlucoseCategory(55)).toBe('LOW')
      expect(getGlucoseCategory(69.9)).toBe('LOW')
    })

    it('categorizes 70 - 99.9 as NORMAL', () => {
      expect(getGlucoseCategory(70)).toBe('NORMAL')
      expect(getGlucoseCategory(85)).toBe('NORMAL')
      expect(getGlucoseCategory(99.9)).toBe('NORMAL')
    })

    it('categorizes 100 - 125.9 as ELEVATED', () => {
      expect(getGlucoseCategory(100)).toBe('ELEVATED')
      expect(getGlucoseCategory(115)).toBe('ELEVATED')
      expect(getGlucoseCategory(125.9)).toBe('ELEVATED')
    })

    it('categorizes >= 126 as HIGH', () => {
      expect(getGlucoseCategory(126)).toBe('HIGH')
      expect(getGlucoseCategory(210)).toBe('HIGH')
    })
  })

  describe('getCategoryVariant', () => {
    it('returns appropriate status variant for each category', () => {
      expect(getCategoryVariant('LOW')).toBe('warning')
      expect(getCategoryVariant('NORMAL')).toBe('success')
      expect(getCategoryVariant('ELEVATED')).toBe('warning')
      expect(getCategoryVariant('HIGH')).toBe('danger')
    })
  })

  describe('formatGlucoseValue', () => {
    it('formats numbers with unit', () => {
      expect(formatGlucoseValue(95)).toBe('95 mg/dL')
      expect(formatGlucoseValue(105.4)).toBe('105.4 mg/dL')
      expect(formatGlucoseValue(105.45)).toBe('105.5 mg/dL')
    })

    it('handles custom unit', () => {
      expect(formatGlucoseValue(5.5, 'mmol/L')).toBe('5.5 mmol/L')
    })

    it('handles null, undefined, and NaN gracefully', () => {
      expect(formatGlucoseValue(null)).toBe('— mg/dL')
      expect(formatGlucoseValue(undefined)).toBe('— mg/dL')
      expect(formatGlucoseValue(Number.NaN)).toBe('— mg/dL')
    })
  })

  describe('formatMealContext', () => {
    it('converts enum keys to human-friendly labels', () => {
      expect(formatMealContext('FASTING')).toBe('Fasting')
      expect(formatMealContext('BEFORE_MEAL')).toBe('Before Meal')
      expect(formatMealContext('AFTER_MEAL')).toBe('After Meal')
      expect(formatMealContext('BEDTIME')).toBe('Bedtime')
      expect(formatMealContext('OTHER')).toBe('Other')
    })
  })
})
