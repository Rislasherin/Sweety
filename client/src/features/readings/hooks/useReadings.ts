import { useCallback, useEffect, useState } from 'react'
import { readingService } from '../services/readingService'
import type { CreateReadingDTO, Reading, UpdateReadingDTO } from '../types'
import type { PaginationMeta } from '@/types/api.types'
import { mapApiErrorToFriendlyMessage, READING_SLOT_ORDER } from '../utils/readingValidation'

export interface UseReadingsReturn {
  readings: Reading[]
  pagination: PaginationMeta
  page: number
  limit: number
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  isLoading: boolean
  isMutating: boolean
  error: string | null
  dateFilter: string
  setDateFilter: (date: string) => void
  fetchReadings: (filter?: string, pageNumber?: number) => Promise<void>
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

export function useReadings(initialDateFilter = '', initialPage = 1, limit = 20): UseReadingsReturn {
  const [readings, setReadings] = useState<Reading[]>([])
  const [page, setPageState] = useState<number>(initialPage)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: initialPage,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isMutating, setIsMutating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilterState] = useState<string>(initialDateFilter)

  const setDateFilter = useCallback((filter: string) => {
    setIsLoading(true)
    setDateFilterState(filter)
    setPageState(1)
  }, [])

  const setPage = useCallback((newPage: number) => {
    setIsLoading(true)
    setPageState(newPage)
  }, [])

  const nextPage = useCallback(() => {
    setPageState((current) => {
      const canGoNext = pagination.hasNextPage ?? (current < pagination.totalPages)
      if (canGoNext) {
        setIsLoading(true)
        return current + 1
      }
      return current
    })
  }, [pagination.hasNextPage, pagination.totalPages])

  const prevPage = useCallback(() => {
    setPageState((current) => {
      const canGoPrev = pagination.hasPreviousPage ?? (current > 1)
      if (canGoPrev) {
        setIsLoading(true)
        return current - 1
      }
      return current
    })
  }, [pagination.hasPreviousPage])

  const fetchReadings = useCallback(
    async (filter?: string, pageNumber?: number) => {
      setIsLoading(true)
      setError(null)
      try {
        const activeFilter = filter !== undefined ? filter : dateFilter
        const activePage = pageNumber !== undefined ? pageNumber : page
        const response = await readingService.getReadings({
          date: activeFilter || undefined,
          page: activePage,
          limit,
        })
        const items: Reading[] = Array.isArray(response)
          ? response
          : (response as { readings?: Reading[] }).readings ?? []
        const meta: PaginationMeta =
          'pagination' in response && response.pagination
            ? response.pagination
            : {
                page: activePage,
                limit,
                total: items.length,
                totalPages: Math.ceil(items.length / limit) || 1,
                hasNextPage: activePage < (Math.ceil(items.length / limit) || 1),
                hasPreviousPage: activePage > 1,
              }
        setReadings(sortReadings(items))
        setPagination(meta)
      } catch (err) {
        setError(mapApiErrorToFriendlyMessage(err))
      } finally {
        setIsLoading(false)
      }
    },
    [dateFilter, page, limit]
  )

  useEffect(() => {
    let isCancelled = false

    readingService
      .getReadings({
        date: dateFilter || undefined,
        page,
        limit,
      })
      .then((response) => {
        if (!isCancelled) {
          const items: Reading[] = Array.isArray(response)
          ? response
          : (response as { readings?: Reading[] }).readings ?? []
          const meta: PaginationMeta =
            'pagination' in response && response.pagination
              ? response.pagination
              : {
                  page,
                  limit,
                  total: items.length,
                  totalPages: Math.ceil(items.length / limit) || 1,
                  hasNextPage: page < (Math.ceil(items.length / limit) || 1),
                  hasPreviousPage: page > 1,
                }
          setReadings(sortReadings(items))
          setPagination(meta)
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
  }, [dateFilter, page, limit])

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
        setPagination((prev) => {
          const newTotal = prev.total + 1
          const newTotalPages = Math.ceil(newTotal / prev.limit) || 1
          return {
            ...prev,
            total: newTotal,
            totalPages: newTotalPages,
            hasNextPage: prev.page < newTotalPages,
            hasPreviousPage: prev.page > 1,
          }
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
      setPagination((prev) => {
        const newTotal = Math.max(0, prev.total - 1)
        const newTotalPages = Math.ceil(newTotal / prev.limit) || 1
        return {
          ...prev,
          total: newTotal,
          totalPages: newTotalPages,
          hasNextPage: prev.page < newTotalPages,
          hasPreviousPage: prev.page > 1,
        }
      })
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
    pagination,
    page,
    limit,
    setPage,
    nextPage,
    prevPage,
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
