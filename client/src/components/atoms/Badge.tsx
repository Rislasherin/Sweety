import React from 'react'
import { cn } from '@/utils/cn'
import type { StatusVariant } from '@/types/common.types'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant
  size?: 'sm' | 'md'
  dot?: boolean
}

const variantClasses: Record<StatusVariant, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  danger: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  info: {
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => {
  const { badge: badgeClass, dot: dotClass } = variantClasses[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5',
        badgeClass,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClass)} aria-hidden="true" />
      )}
      <span>{children}</span>
    </span>
  )
}
