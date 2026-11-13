import React from 'react'
import { cn } from '@/utils/cn'

export interface PeriodTabButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
  icon?: React.ReactNode
}

export const PeriodTabButton: React.FC<PeriodTabButtonProps> = ({
  label,
  isActive,
  onClick,
  icon,
}) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
        isActive
          ? 'bg-teal-700 text-white shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
