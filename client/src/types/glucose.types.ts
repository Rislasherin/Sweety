export type MealContext = 'FASTING' | 'BEFORE_MEAL' | 'AFTER_MEAL' | 'BEDTIME' | 'OTHER'

export type GlucoseCategory = 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH'

export interface GlucoseReading {
  id: string
  userId: string
  glucoseValue: number
  mealContext: MealContext
  readingDate: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface GlucoseStats {
  count: number
  average: number | null
  min: number | null
  max: number | null
}

export interface DailyReport {
  date: string
  stats: GlucoseStats
  readings: GlucoseReading[]
}

export interface PeriodReport {
  startDate: string
  endDate: string
  stats: GlucoseStats
  readings: GlucoseReading[]
}
