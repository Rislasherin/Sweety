import React from 'react'
import { cn } from '@/utils/cn'
import type { ReadingSlotType } from '../../types'
import { formatReadingSlot } from '../../utils/readingValidation'

export interface ReadingSlotBadgeProps {
  slot: ReadingSlotType
  size?: 'sm' | 'md'
  className?: string
}

const slotStyles: Record<ReadingSlotType, { container: string; icon: string; dot: string }> = {
  MORNING: {
    container: 'bg-amber-50 text-amber-800 border-amber-200/80',
    icon: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  AFTER_BREAKFAST: {
    container: 'bg-orange-50 text-orange-800 border-orange-200/80',
    icon: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  AFTER_LUNCH: {
    container: 'bg-sky-50 text-sky-800 border-sky-200/80',
    icon: 'text-sky-600',
    dot: 'bg-sky-500',
  },
  AFTER_DINNER: {
    container: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    icon: 'text-indigo-600',
    dot: 'bg-indigo-500',
  },
}

function renderSlotIcon(slot: ReadingSlotType): React.ReactNode {
  switch (slot) {
    case 'MORNING':
      // Sunrise icon
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a5 5 0 100-10 5 5 0 000 10zm-8-3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 12zm13.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
        </svg>
      )
    case 'AFTER_BREAKFAST':
      // Coffee / breakfast icon
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.5 3A1.5 1.5 0 002 4.5v7A4.5 4.5 0 006.5 16h4a4.5 4.5 0 004.5-4.5v-1a3 3 0 003-3v-1A3 3 0 0015 3.5V4a1 1 0 00-1-1H3.5zM15 5.5A1.5 1.5 0 0116.5 7v1A1.5 1.5 0 0115 9.5V5.5z" />
        </svg>
      )
    case 'AFTER_LUNCH':
      // Sun icon
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          <path
            fillRule="evenodd"
            d="M10 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1.5zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm8.5-5.25a.75.75 0 00-.75-.75h-1.5a.75.75 0 000 1.5h1.5a.75.75 0 00.75-.75zm-13 0a.75.75 0 00-.75-.75h-1.5a.75.75 0 000 1.5h1.5a.75.75 0 00.75-.75z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'AFTER_DINNER':
      // Moon / evening icon
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z"
            clipRule="evenodd"
          />
        </svg>
      )
    default:
      return null
  }
}

export const ReadingSlotBadge: React.FC<ReadingSlotBadgeProps> = ({
  slot,
  size = 'md',
  className,
}) => {
  const styles = slotStyles[slot] || slotStyles.MORNING
  const label = formatReadingSlot(slot)

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full select-none',
        size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5',
        styles.container,
        className
      )}
    >
      <span className={styles.icon}>{renderSlotIcon(slot)}</span>
      <span>{label}</span>
    </span>
  )
}
