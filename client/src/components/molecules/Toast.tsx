import React, { useEffect } from 'react'
import { cn } from '@/utils/cn'

export type ToastVariant = 'success' | 'warning' | 'danger' | 'info'

export interface ToastProps {
  id?: string
  variant?: ToastVariant
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: React.ReactNode; iconBg: string }
> = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    iconBg: 'text-emerald-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    iconBg: 'text-amber-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  danger: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    iconBg: 'text-rose-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  info: {
    container: 'bg-teal-50 border-teal-200 text-teal-900',
    iconBg: 'text-teal-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  message,
  duration,
  onClose,
  action,
  className,
}) => {
  const { container, icon, iconBg } = variantStyles[variant]

  useEffect(() => {
    if (!duration || !onClose) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-sm transition-all',
        container,
        className
      )}
    >
      <div className={cn('shrink-0 mt-0.5', iconBg)} aria-hidden="true">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold">{title}</h4>}
        <p className={cn('text-xs leading-relaxed', title ? 'mt-0.5 opacity-90' : 'text-sm font-medium')}>
          {message}
        </p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-semibold underline hover:opacity-80 cursor-pointer"
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 -mr-1 -mt-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity cursor-pointer"
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
