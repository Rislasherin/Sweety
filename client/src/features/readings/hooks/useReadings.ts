import { useCallback, useEffect, useState } from 'react'
import { readingService } from '../services/readingService'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../types'
import { mapApiErrorToFriendlyMessage, READING_SLOT_ORDER } from '../utils/readingValidation'

export interface UseReadingsReturn {
  readings: Reading[]
  isLoading: boolean
  isMutating: boolean
  error: string | null
  dateFilter: string
  setDateFilter: (date: string) => void
  fetchReadings: (date?: string) => Promise<void>
  createReading: (dto: CreateReadingDTO) => Promise<Reading>
  updateReading: (id: string, dto: UpdateReadingDTO) => Promise<Reading>
  deleteReading: (id: string) => Promise<void>
  clearError: () => void
}

function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return (READING_SLOT_ORDER[a.slot] ?? 0) - (READING_SLOT_ORDER[b.slot] ?? 0)
  })
}

export function useReadings(initialDateFilter = ''): UseReadingsReturn {
  const [readings, setReadings] = useState<Reading[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isMutating, setIsMutating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilterState] = useState<string>(initialDateFilter)

  const setDateFilter = useCallback((filter: string) => {
    setIsLoading(true)
    setDateFilterState(filter)
  }, [])

  const fetchReadings = useCallback(
    async (filter?: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const activeFilter = filter !== undefined ? filter : dateFilter
        const data = await readingService.getReadings(activeFilter || undefined)
        setReadings(sortReadings(data))
      } catch (err) {
        setError(mapApiErrorToFriendlyMessage(err))
      } finally {
        setIsLoading(false)
      }
    },
    [dateFilter]
  )

  useEffect(() => {
    let isCancelled = false

    readingService
      .getReadings(dateFilter || undefined)
      .then((data) => {
        if (!isCancelled) {
          setReadings(sortReadings(data))
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(mapApiErrorToFriendlyMessage(err))
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [dateFilter])

  const createReading = useCallback(
    async (dto: CreateReadingDTO): Promise<Reading> => {
      setIsMutating(true)
      try {
        const created = await readingService.createReading(dto)
        setReadings((prev) => {
          // If a date filter is active and doesn't match the new reading date, do not show in filtered list
          if (dateFilter && dateFilter !== created.date) {
            return prev
          }
          return sortReadings([created, ...prev])
        })
        return created
      } catch (err) {
        const friendlyMessage = mapApiErrorToFriendlyMessage(err)
        throw new Error(friendlyMessage)
      } finally {
        setIsMutating(false)
      }
    },
    [dateFilter]
  )

  const updateReading = useCallback(
    async (id: string, dto: UpdateReadingDTO): Promise<Reading> => {
      setIsMutating(true)
      try {
        const updated = await readingService.updateReading(id, dto)
        setReadings((prev) => {
          const filtered = prev.filter((r) => r.id !== id)
          if (dateFilter && dateFilter !== updated.date) {
            return filtered
          }
          return sortReadings([updated, ...filtered])
        })
        return updated
      } catch (err) {
        const friendlyMessage = mapApiErrorToFriendlyMessage(err)
        throw new Error(friendlyMessage)
      } finally {
        setIsMutating(false)
      }
    },
    [dateFilter]
  )

  const deleteReading = useCallback(async (id: string): Promise<void> => {
    setIsMutating(true)
    try {
      await readingService.deleteReading(id)
      setReadings((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      const friendlyMessage = mapApiErrorToFriendlyMessage(err)
      throw new Error(friendlyMessage)
    } finally {
      setIsMutating(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    readings,
    isLoading,
    isMutating,
    error,
    dateFilter,
    setDateFilter,
    fetchReadings,
    createReading,
    updateReading,
    deleteReading,
    clearError,
  }
}
