import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CommandPalette } from '../components/layout/CommandPalette'

describe('CommandPalette Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/transactions')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: {
              transactions: [
                { id: '1', category: 'Groceries', amount: 3500, location: 'Mumbai', transaction_type: 'Expense' },
                { id: '2', category: 'Salary', amount: 85000, location: 'Bangalore', transaction_type: 'Income' },
              ],
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: [] }),
      })
    })
  })

  it('does not render when isOpen is false', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    )
    expect(screen.queryByPlaceholderText(/Search pages/i)).toBeNull()
  })

  it('renders search input and page options when isOpen is true', async () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/Search pages/i)).toBeInTheDocument()
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
    expect(screen.getByText('Transactions Ledger')).toBeInTheDocument()
    expect(screen.getByText('ML Predictor (RandomForest)')).toBeInTheDocument()
  })

  it('filters results dynamically based on typed query', async () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Search pages/i)
    fireEvent.change(input, { target: { value: 'Predict' } })

    expect(screen.getByText('ML Predictor (RandomForest)')).toBeInTheDocument()
    expect(screen.queryByText('Transactions Ledger')).toBeNull()
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalled()
  })
})

