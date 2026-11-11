import type { GlucoseCategory, MealContext } from '@/types/glucose.types'
import type { StatusVariant } from '@/types/common.types'

/**
 * Categorize fasting/random blood glucose according to clinical standards:
 * - Hypoglycemia: < 70 mg/dL
 * - Normal: 70 - 99 mg/dL
 * - Elevated / Impaired: 100 - 125 mg/dL
 * - High / Hyperglycemia: >= 126 mg/dL
 */
export function getGlucoseCategory(value: number): GlucoseCategory {
  if (value < 70) return 'LOW'
  if (value < 100) return 'NORMAL'
  if (value < 126) return 'ELEVATED'
  return 'HIGH'
}

export function getCategoryVariant(category: GlucoseCategory): StatusVariant {
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

export function formatGlucoseValue(
  value: number | null | undefined,
  unit: string = 'mg/dL'
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `— ${unit}`
  }
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1)
  return `${formatted} ${unit}`
}

export function formatMealContext(context: MealContext): string {
  switch (context) {
    case 'FASTING':
      return 'Fasting'
    case 'BEFORE_MEAL':
      return 'Before Meal'
    case 'AFTER_MEAL':
      return 'After Meal'
    case 'BEDTIME':
      return 'Bedtime'
    case 'OTHER':
      return 'Other'
    default:
      return context
  }
}
