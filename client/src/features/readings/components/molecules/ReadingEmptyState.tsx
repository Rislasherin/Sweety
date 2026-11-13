import React from 'react'
import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/molecules/EmptyState'

export interface ReadingEmptyStateProps {
  hasDateFilter?: boolean
  onAddReading: () => void
  onClearFilter?: () => void
}

export const ReadingEmptyState: React.FC<ReadingEmptyStateProps> = ({
  hasDateFilter = false,
  onAddReading,
  onClearFilter,
}) => {
  if (hasDateFilter) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/70">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">No readings for this date</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          No blood glucose entries were found matching the selected calendar date.
        </p>
        <div className="flex items-center gap-3">
          {onClearFilter && (
            <Button variant="outline" size="sm" onClick={onClearFilter}>
              Show All Dates
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onAddReading}>
            Add Reading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <EmptyState
      title="No Glucose Readings Yet"
      description="No readings yet. Add your first reading to start tracking your glucose across key meal slots."
      actionLabel="+ Add Your First Reading"
      onAction={onAddReading}
      icon={
        <svg
          className="w-6 h-6 text-teal-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      }
    />
  )
}
