import React from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { getTodayIsoString } from '@/utils/date'

export interface ReadingManagementHeaderProps {
  dateFilter: string
  onDateFilterChange: (date: string) => void
  onAddReading: () => void
  disabled?: boolean
}

export const ReadingManagementHeader: React.FC<ReadingManagementHeaderProps> = ({
  dateFilter,
  onDateFilterChange,
  onAddReading,
  disabled = false,
}) => {
  const today = getTodayIsoString()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Daily Tracking
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Glucose Readings
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xl">
          Log and monitor your blood glucose readings across daily meal slots to maintain steady glycemic balance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Date Filter & Clear Controls */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            max={today}
            value={dateFilter}
            disabled={disabled}
            aria-label="Filter readings by date"
            className="w-auto py-1.5 text-xs bg-white shadow-2xs"
            onChange={(e) => onDateFilterChange(e.target.value)}
          />
          {dateFilter ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onDateFilterChange('')}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Clear
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onDateFilterChange(today)}
              className="text-xs text-slate-500 hover:text-teal-700 hidden sm:inline-flex"
            >
              Today
            </Button>
          )}
        </div>

        {/* Add Reading Primary Action */}
        <Button
          variant="primary"
          size="md"
          disabled={disabled}
          onClick={onAddReading}
          className="shadow-xs"
          leftIcon={
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          }
        >
          Add Reading
        </Button>
      </div>
    </div>
  )
}
