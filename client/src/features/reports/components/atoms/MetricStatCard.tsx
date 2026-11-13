import React from 'react'
import { Card, CardContent } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import type { StatusVariant } from '@/types/common.types'
import { cn } from '@/utils/cn'

export interface MetricStatCardProps {
  label: string
  value: string
  subtext?: string
  badgeText?: string
  badgeVariant?: StatusVariant
  icon?: React.ReactNode
  className?: string
}

export const MetricStatCard: React.FC<MetricStatCardProps> = ({
  label,
  value,
  subtext,
  badgeText,
  badgeVariant = 'neutral',
  icon,
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
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {value}
          </div>
          {badgeText && (
            <Badge variant={badgeVariant} size="sm">
              {badgeText}
            </Badge>
          )}
        </div>

        {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
      </CardContent>
    </Card>
  )
}
