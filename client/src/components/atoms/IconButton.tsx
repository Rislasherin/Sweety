import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon?: React.ReactNode
  variant?: 'ghost' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variantClasses = {
  ghost:
    'text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-teal-500',
  danger:
    'text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 focus-visible:ring-rose-400',
}

const sizeClasses = {
  sm: 'p-1.5 rounded-md text-xs',
  md: 'p-2 rounded-lg text-sm',
  lg: 'p-2.5 rounded-lg text-base',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      icon,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center justify-center transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : icon || children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
