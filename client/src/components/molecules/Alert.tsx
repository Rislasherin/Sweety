import React from 'react'
import { cn } from '@/utils/cn'
import type { StatusVariant } from '@/types/common.types'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StatusVariant
  title?: string
  onClose?: () => void
}

const variantStyles: Record<StatusVariant, { container: string; title: string; icon: string }> = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    title: 'text-emerald-900',
    icon: 'text-emerald-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    title: 'text-amber-900',
    icon: 'text-amber-600',
  },
  danger: {
    container: 'bg-rose-50 border-rose-200 text-rose-800',
    title: 'text-rose-900',
    icon: 'text-rose-600',
  },
  info: {
    container: 'bg-teal-50 border-teal-200 text-teal-800',
    title: 'text-teal-900',
    icon: 'text-teal-600',
  },
  neutral: {
    container: 'bg-slate-50 border-slate-200 text-slate-800',
    title: 'text-slate-900',
    icon: 'text-slate-600',
  },
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  onClose,
  className,
  children,
  ...props
}) => {
  const styles = variantStyles[variant]

  return (
    <div
      role="alert"
      className={cn('p-4 rounded-xl border flex items-start gap-3', styles.container, className)}
      {...props}
    >
      <div className="flex-1 text-sm">
        {title && <h4 className={cn('font-semibold mb-1', styles.title)}>{title}</h4>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
