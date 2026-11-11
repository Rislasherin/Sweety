import React from 'react'
import { Badge } from '../atoms/Badge'
import { formatGlucoseValue, getGlucoseCategory, getCategoryVariant } from '@/utils/formatters'
import type { GlucoseCategory } from '@/types/glucose.types'

export interface StatusPillProps {
  value: number
  unit?: string
  showValue?: boolean
  className?: string
}

const categoryLabels: Record<GlucoseCategory, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  ELEVATED: 'Elevated',
  HIGH: 'High',
}

export const StatusPill: React.FC<StatusPillProps> = ({
  value,
  unit = 'mg/dL',
  showValue = true,
  className,
}) => {
  const category = getGlucoseCategory(value)
  const variant = getCategoryVariant(category)
  const label = categoryLabels[category]

  return (
    <div className="inline-flex items-center gap-2">
      {showValue && (
        <span className="font-semibold text-slate-800 text-sm">
          {formatGlucoseValue(value, unit)}
        </span>
      )}
      <Badge variant={variant} dot className={className}>
        {label}
      </Badge>
    </div>
  )
}
