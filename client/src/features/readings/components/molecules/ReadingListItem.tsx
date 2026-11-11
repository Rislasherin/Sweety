import React from 'react'
import { IconButton } from '@/components/atoms/IconButton'
import { formatTime } from '@/utils/date'
import type { Reading } from '../../types'
import { GlucoseValue } from '../atoms/GlucoseValue'
import { ReadingSlotBadge } from '../atoms/ReadingSlotBadge'

export interface ReadingListItemProps {
  reading: Reading
  onEdit: (reading: Reading) => void
  onDelete: (reading: Reading) => void
  disabled?: boolean
}

export const ReadingListItem: React.FC<ReadingListItemProps> = ({
  reading,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const recordedTime = formatTime(reading.createdAt)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all gap-3">
      {/* Left side: Slot badge and recorded timestamp */}
      <div className="flex items-center gap-3">
        <ReadingSlotBadge slot={reading.slot} />
        {recordedTime && (
          <span className="text-xs text-slate-400 font-medium">Recorded at {recordedTime}</span>
        )}
      </div>

      {/* Right side: Glucose Value & Action buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <GlucoseValue value={reading.glucoseValue} size="md" />

        <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
          <IconButton
            label={`Edit reading for ${reading.slot}`}
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => onEdit(reading)}
            icon={
              <svg className="w-4 h-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
            }
          />
          <IconButton
            label={`Delete reading for ${reading.slot}`}
            size="sm"
            variant="danger"
            disabled={disabled}
            onClick={() => onDelete(reading)}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}
