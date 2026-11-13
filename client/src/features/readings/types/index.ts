export type ReadingSlotType = 'MORNING' | 'AFTER_BREAKFAST' | 'AFTER_LUNCH' | 'AFTER_DINNER'

export const READING_SLOTS: readonly ReadingSlotType[] = [
  'MORNING',
  'AFTER_BREAKFAST',
  'AFTER_LUNCH',
  'AFTER_DINNER',
] as const

export interface Reading {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  slot: ReadingSlotType
  glucoseValue: number
  createdAt: string
  updatedAt: string
}

export interface CreateReadingDTO {
  date: string // YYYY-MM-DD
  slot: ReadingSlotType
  glucoseValue: number
}

export interface UpdateReadingDTO {
  date?: string // YYYY-MM-DD
  slot?: ReadingSlotType
  glucoseValue?: number
}

export interface ReadingFormData {
  date: string
  slot: ReadingSlotType | ''
  glucoseValue: string
}

export interface ReadingFormErrors {
  date?: string
  slot?: string
  glucoseValue?: string
  general?: string
}

export interface ReadingSlotOption {
  value: ReadingSlotType
  label: string
  description: string
}
