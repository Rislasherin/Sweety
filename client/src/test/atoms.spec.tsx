import { describe, it, expect, beforeEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardTitle } from '@/components/atoms/Card'

describe('Atomic UI Components', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  it('renders Button with text and click behavior', () => {
    let clicked = false
    flushSync(() => {
      root.render(
        <Button variant="primary" onClick={() => (clicked = true)}>
          Record Reading
        </Button>
      )
    })

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.textContent).toContain('Record Reading')
    expect(button?.disabled).toBe(false)

    button?.click()
    expect(clicked).toBe(true)
  })

  it('renders disabled and loading state on Button', () => {
    flushSync(() => {
      root.render(
        <Button variant="danger" isLoading>
          Deleting
        </Button>
      )
    })

    const button = container.querySelector('button')
    expect(button?.disabled).toBe(true)
    expect(button?.getAttribute('aria-busy')).toBe('true')
  })

  it('renders Badge with correct variant class and dot', () => {
    flushSync(() => {
      root.render(
        <Badge variant="success" dot>
          Normal
        </Badge>
      )
    })

    const badge = container.querySelector('span')
    expect(badge).not.toBeNull()
    expect(badge?.textContent).toContain('Normal')
    expect(badge?.className).toContain('bg-emerald-50')
  })

  it('renders Card with title', () => {
    flushSync(() => {
      root.render(
        <Card>
          <CardTitle>Daily Summary</CardTitle>
        </Card>
      )
    })

    const title = container.querySelector('h3')
    expect(title?.textContent).toBe('Daily Summary')
  })
})
