import React from 'react'
import { Button } from '@/components/atoms/Button'
import type { PaginationMeta } from '@/types/api.types'

export interface ReadingPaginationProps {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}

export const ReadingPagination: React.FC<ReadingPaginationProps> = ({
  pagination,
  onPageChange,
  disabled = false,
  className = '',
}) => {
  const { page, limit, total, totalPages } = pagination

  // Calculate item range for current page
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <nav
      role="navigation"
      aria-label="Readings pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs ${className}`}
    >
      <div className="text-xs sm:text-sm text-slate-500 font-medium order-2 sm:order-1 text-center sm:text-left">
        {total === 0 ? (
          <span>No readings recorded</span>
        ) : (
          <span>
            Showing <strong className="text-slate-800 font-semibold">{startItem}</strong> to{' '}
            <strong className="text-slate-800 font-semibold">{endItem}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{total}</strong> readings
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrev || disabled}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          leftIcon={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
        >
          Previous
        </Button>

        <span className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg min-w-[5.5rem] text-center">
          Page {page} of {Math.max(1, totalPages)}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext || disabled}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          rightIcon={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          }
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
