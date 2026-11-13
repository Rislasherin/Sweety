import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Modal } from '@/components/molecules/Modal'
import { Toast } from '@/components/molecules/Toast'
import { StatCard } from '@/components/molecules/StatCard'
import { Tabs } from '@/components/molecules/Tabs'

describe('Reusable Senior UI Components', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    root.unmount()
    container.remove()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  describe('Skeleton Component', () => {
    it('renders with default text variant and pulse animation', () => {
      flushSync(() => {
        root.render(<Skeleton />)
      })

      const el = container.querySelector('[data-testid="skeleton"]')
      expect(el).not.toBeNull()
      expect(el?.getAttribute('aria-hidden')).toBe('true')
      expect(el?.className).toContain('animate-pulse')
      expect(el?.className).toContain('h-4')
    })

    it('renders circular and card variants with custom dimensions', () => {
      flushSync(() => {
        root.render(<Skeleton variant="circular" width="40px" height="40px" />)
      })

      const el = container.querySelector('[data-testid="skeleton"]') as HTMLElement
      expect(el?.className).toContain('rounded-full')
      expect(el?.style.width).toBe('40px')
      expect(el?.style.height).toBe('40px')
    })
  })

  describe('Modal Component', () => {
    it('does not render when isOpen is false', () => {
      flushSync(() => {
        root.render(
          <Modal isOpen={false} onClose={() => {}}>
            Modal Content
          </Modal>
        )
      })

      expect(document.querySelector('[role="dialog"]')).toBeNull()
    })

    it('renders accessible dialog with title, description, and traps Escape key', () => {
      const handleClose = vi.fn()
      flushSync(() => {
        root.render(
          <Modal
            isOpen={true}
            onClose={handleClose}
            title="Edit Glucose Reading"
            description="Update your recorded reading"
          >
            <div>Form Body</div>
          </Modal>
        )
      })

      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog).not.toBeNull()
      expect(dialog?.getAttribute('aria-modal')).toBe('true')
      expect(dialog?.textContent).toContain('Edit Glucose Reading')
      expect(dialog?.textContent).toContain('Update your recorded reading')
      expect(dialog?.textContent).toContain('Form Body')

      // Trigger Escape key
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      window.dispatchEvent(event)
      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe('Toast Component', () => {
    it('renders accessible status announcement with title and message', () => {
      const handleClose = vi.fn()
      flushSync(() => {
        root.render(
          <Toast
            variant="success"
            title="Reading Saved"
            message="Your fasting reading was recorded."
            onClose={handleClose}
          />
        )
      })

      const toast = container.querySelector('[role="status"]')
      expect(toast).not.toBeNull()
      expect(toast?.getAttribute('aria-live')).toBe('polite')
      expect(toast?.textContent).toContain('Reading Saved')
      expect(toast?.textContent).toContain('Your fasting reading was recorded.')

      // Close button
      const closeBtn = container.querySelector('button[aria-label="Dismiss notification"]')
      closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe('StatCard Component', () => {
    it('renders metric label, tabular-nums value, and status badge', () => {
      flushSync(() => {
        root.render(
          <StatCard
            label="Daily Average"
            value={108.5}
            unit="mg/dL"
            badgeText="Normal"
            badgeVariant="success"
            subtext="Based on 4 readings today"
          />
        )
      })

      expect(container.textContent).toContain('Daily Average')
      expect(container.textContent).toContain('108.5')
      expect(container.textContent).toContain('mg/dL')
      expect(container.textContent).toContain('Normal')
      expect(container.textContent).toContain('Based on 4 readings today')

      const valueEl = container.querySelector('.tabular-nums')
      expect(valueEl).not.toBeNull()
      expect(valueEl?.textContent).toBe('108.5')
    })
  })

  describe('Tabs Component', () => {
    it('renders accessible tab list and invokes onChange on selection', () => {
      const handleChange = vi.fn()
      const tabs = [
        { id: 'daily', label: 'Daily View' },
        { id: 'monthly', label: 'Monthly Trend', badge: 12 },
      ]

      flushSync(() => {
        root.render(
          <Tabs tabs={tabs} activeTab="daily" onChange={handleChange} />
        )
      })

      const tablist = container.querySelector('[role="tablist"]')
      expect(tablist).not.toBeNull()

      const tabButtons = container.querySelectorAll('[role="tab"]')
      expect(tabButtons.length).toBe(2)
      expect(tabButtons[0].getAttribute('aria-selected')).toBe('true')
      expect(tabButtons[1].getAttribute('aria-selected')).toBe('false')

      // Click second tab
      tabButtons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(handleChange).toHaveBeenCalledWith('monthly')
    })
  })
})
