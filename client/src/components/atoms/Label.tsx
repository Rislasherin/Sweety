import React from 'react'
import { cn } from '@/utils/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label: React.FC<LabelProps> = ({ required, className, children, ...props }) => {
  return (
    <label
      className={cn('block text-sm font-medium text-slate-700 select-none mb-1.5', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-rose-500 ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}
