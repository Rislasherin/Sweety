import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
  tabular?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      hasError = false,
      tabular,
      leftIcon,
      rightIcon,
      className,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const isTabular = tabular ?? type === 'number'

    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            isTabular && 'tabular-nums',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            hasError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
