import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReadingPagination } from '@/features/readings/components/molecules/ReadingPagination'

describe('ReadingPagination Molecule', () => {
  const defaultPagination = {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasNextPage: true,
    hasPreviousPage: false,
  }

  it('renders current page, total pages, and record range', () => {
    render(<ReadingPagination pagination={defaultPagination} onPageChange={vi.fn()} />)

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('disables Previous button on the first page', () => {
    const onPageChange = vi.fn()
    render(<ReadingPagination pagination={defaultPagination} onPageChange={onPageChange} />)

    const prevButton = screen.getByRole('button', { name: /previous page/i })
    const nextButton = screen.getByRole('button', { name: /next page/i })

    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(prevButton)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('disables Next button on the last page', () => {
    const lastPagePagination = {
      ...defaultPagination,
      page: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    }
    const onPageChange = vi.fn()
    render(<ReadingPagination pagination={lastPagePagination} onPageChange={onPageChange} />)

    const prevButton = screen.getByRole('button', { name: /previous page/i })
    const nextButton = screen.getByRole('button', { name: /next page/i })

    expect(prevButton).not.toBeDisabled()
    expect(nextButton).toBeDisabled()

    fireEvent.click(nextButton)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('calls onPageChange with page + 1 when Next is clicked', () => {
    const onPageChange = vi.fn()
    render(<ReadingPagination pagination={defaultPagination} onPageChange={onPageChange} />)

    const nextButton = screen.getByRole('button', { name: /next page/i })
    fireEvent.click(nextButton)

    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page - 1 when Previous is clicked on middle page', () => {
    const middlePagePagination = {
      ...defaultPagination,
      page: 2,
      hasNextPage: true,
      hasPreviousPage: true,
    }
    const onPageChange = vi.fn()
    render(<ReadingPagination pagination={middlePagePagination} onPageChange={onPageChange} />)

    const prevButton = screen.getByRole('button', { name: /previous page/i })
    fireEvent.click(prevButton)

    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('disables all buttons when disabled prop is true', () => {
    const middlePagePagination = {
      ...defaultPagination,
      page: 2,
      hasNextPage: true,
      hasPreviousPage: true,
    }
    const onPageChange = vi.fn()
    render(
      <ReadingPagination
        pagination={middlePagePagination}
        onPageChange={onPageChange}
        disabled={true}
      />
    )

    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('renders clean empty state text when total is 0', () => {
    const emptyPagination = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    }
    render(<ReadingPagination pagination={emptyPagination} onPageChange={vi.fn()} />)

    expect(screen.getByText('No readings recorded')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })
})
