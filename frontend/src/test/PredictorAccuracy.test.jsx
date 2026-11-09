import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PredictorPage from '../pages/PredictorPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../components/ui/Toast'

describe('Predictor Accuracy & UI Integrity', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/model/summary')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: {
              model_type: 'RandomForestClassifier',
              accuracy: 0.9583,
              accuracy_percentage: '95.83%',
              held_out_accuracy_label: 'Held-out test accuracy: 95.83% on 240 unseen rows',
              training_samples: 960,
              test_samples: 240,
              features_count: 18,
            },
          }),
        })
      }
      if (url.includes('/api/predictions/history')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: {
              predictions: [
                {
                  id: 'pred-1',
                  amount: 1200,
                  payment_mode: 'UPI',
                  location: 'Mumbai',
                  predicted_type: 'Expense',
                  confidence: 0.88,
                  created_at: '2026-11-09T10:00:00Z',
                },
              ],
              total: 1,
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      })
    })
  })

  it('displays the honest 95.83% held-out test accuracy claim and never claims 99.2%', async () => {
    const queryClient = new QueryClient()

    render(
      <MemoryRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <PredictorPage />
            </ToastProvider>
          </QueryClientProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    // Verify 95.83% is shown
    await waitFor(() => {
      expect(screen.getAllByText(/95\.83%/i).length).toBeGreaterThan(0)
    })

    // Strict requirement: Never display the false 99.2% claim anywhere
    expect(screen.queryByText(/99\.2%/i)).toBeNull()
    expect(screen.queryByText(/99\.2 percent/i)).toBeNull()
  })
})

