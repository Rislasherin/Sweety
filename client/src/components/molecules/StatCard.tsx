import React from 'react'
import { Card, CardContent } from '../atoms/Card'
import { Badge } from '../atoms/Badge'
import type { StatusVariant } from '@/types/common.types'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  badgeText?: string
  badgeVariant?: StatusVariant
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  badgeText,
  badgeVariant = 'neutral',
  icon,
  trend,
  className,
}) => {
  return (
    <Card className={cn('bg-white shadow-2xs hover:shadow-xs transition-shadow', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </div>
          {badgeText && (
            <Badge variant={badgeVariant} size="sm">
              {badgeText}
            </Badge>
          )}
        </div>

        {(subtext || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-semibold',
                  trend.direction === 'up' && 'text-amber-600',
                  trend.direction === 'down' && 'text-teal-600',
                  trend.direction === 'neutral' && 'text-slate-500'
                )}
              >
                {trend.direction === 'up' && '▲ '}
                {trend.direction === 'down' && '▼ '}
                {trend.label}
              </span>
            )}
            {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

