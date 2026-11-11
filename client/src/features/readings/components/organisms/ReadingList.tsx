import React from 'react'
import { Badge } from '@/components/atoms/Badge'
import type { Reading } from '../../types'
import { formatDateOnly, groupReadingsByDate } from '../../utils/readingValidation'
import { ReadingListItem } from '../molecules/ReadingListItem'

export interface ReadingListProps {
  readings: Reading[]
  onEdit: (reading: Reading) => void
  onDelete: (reading: Reading) => void
  disabled?: boolean
}

export const ReadingList: React.FC<ReadingListProps> = ({
  readings,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const grouped = groupReadingsByDate(readings)
  const dateKeys = Object.keys(grouped)

  return (
    <div className="space-y-6">
      {dateKeys.map((dateStr) => {
        const dayReadings = grouped[dateStr]
        const formattedDate = formatDateOnly(dateStr)
        const readingCount = dayReadings.length

        return (
          <section
            key={dateStr}
            className="bg-white/80 rounded-2xl border border-slate-200/80 p-5 shadow-2xs backdrop-blur-xs"
            aria-labelledby={`date-group-${dateStr}`}
          >
            {/* Date Group Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 id={`date-group-${dateStr}`} className="text-base font-bold text-slate-900">
                  {formattedDate}
                </h3>
              </div>

              <Badge variant="neutral" size="sm">
                {readingCount} of 4 slots logged
              </Badge>
            </div>

            {/* List of Readings for this date */}
            <div className="space-y-2.5">
              {dayReadings.map((reading) => (
                <ReadingListItem
                  key={reading.id}
                  reading={reading}
                  disabled={disabled}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
