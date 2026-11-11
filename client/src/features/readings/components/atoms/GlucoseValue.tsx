import React from 'react'
import { Badge } from '@/components/atoms/Badge'
import { cn } from '@/utils/cn'
import { getCategoryVariant, getGlucoseCategory } from '@/utils/formatters'

export interface GlucoseValueProps {
  value: number
  unit?: string
  showBadge?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: {
    value: 'text-base font-bold',
    unit: 'text-xs text-slate-500 font-medium',
  },
  md: {
    value: 'text-xl font-extrabold',
    unit: 'text-xs text-slate-500 font-medium',
  },
  lg: {
    value: 'text-3xl font-black tracking-tight',
    unit: 'text-sm text-slate-500 font-medium',
  },
}

export const GlucoseValue: React.FC<GlucoseValueProps> = ({
  value,
  unit = 'mg/dL',
  showBadge = true,
  size = 'md',
  className,
}) => {
  const category = getGlucoseCategory(value)
  const variant = getCategoryVariant(category)
  const styles = sizeStyles[size]

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-slate-900', styles.value)}>{value}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
      {showBadge && (
        <Badge variant={variant} size="sm" dot>
          {category.charAt(0) + category.slice(1).toLowerCase()}
        </Badge>
      )}
    </div>
  )
}
