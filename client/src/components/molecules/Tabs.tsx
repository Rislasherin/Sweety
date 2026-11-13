import React, { useRef } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'pills' | 'underline'
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className,
  ariaLabel = 'Navigation Tabs',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled)
    if (enabledTabs.length === 0) return

    const currentIndex = enabledTabs.findIndex((t) => t.id === tabs[index].id)
    let nextIndex = currentIndex

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % enabledTabs.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = enabledTabs.length - 1
    }

    if (nextIndex !== currentIndex) {
      const nextTab = enabledTabs[nextIndex]
      onChange(nextTab.id)
      const targetButton = tabListRef.current?.querySelector<HTMLButtonElement>(
        `[data-tab-id="${nextTab.id}"]`
      )
      targetButton?.focus()
    }
  }

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-1.5',
        variant === 'pills' ? 'bg-slate-100 p-1 rounded-xl' : 'border-b border-slate-200',
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'inline-flex items-center justify-center font-medium transition-all cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2 text-sm gap-2',
              variant === 'pills' && [
                'rounded-lg',
                isActive
                  ? 'bg-white text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60',
              ],
              variant === 'underline' && [
                '-mb-px border-b-2 font-medium',
                isActive
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              ]
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  isActive
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
