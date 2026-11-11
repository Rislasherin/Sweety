import type { MealContext } from '@/types/glucose.types'

export interface CreateReadingDTO {
  glucoseValue: number
  mealContext: MealContext
  readingDate?: string
  notes?: string
}

export interface UpdateReadingDTO {
  glucoseValue?: number
  mealContext?: MealContext
  readingDate?: string
  notes?: string
}

export interface ReadingFilterQuery {
  startDate?: string
  endDate?: string
  mealContext?: MealContext
  page?: number
  limit?: number
}
