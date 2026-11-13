import React from 'react'
import { cn } from '@/utils/cn'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  animate?: boolean
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
  card: 'rounded-xl h-24 w-full',
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animate = true,
  className,
  style,
  ...props
}) => {
  const customStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  }

  return (
    <div
      aria-hidden="true"
      data-testid="skeleton"
      className={cn(
        'bg-slate-200/80',
        animate && 'animate-pulse',
        variantStyles[variant],
        className
      )}
      style={customStyles}
      {...props}
    />
  )
}

