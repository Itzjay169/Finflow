import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
  isLiveSupabase: true,
  DEMO_USER: { id: '00000000-0000-0000-0000-000000000001', email: 'demo@finflow.app' },
  DEMO_TOKEN: 'finflow_demo_jwt_token_2026',
}))

import {
  apiFetch,
  getSummary,
  createTransaction,
} from '../lib/api'
import { supabase } from '../lib/supabase'

describe('Frontend API Client (api.js)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('unwraps envelope response containing { success: true, data: ... }', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        data: { total_income: 100000, total_expense: 45000, net_savings: 55000 },
        message: 'Summary calculated',
      }),
    })

    const data = await getSummary()
    expect(data).toEqual({
      total_income: 100000,
      total_expense: 45000,
      net_savings: 55000,
    })
  })

  it('throws structured error message on non-200 responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: { message: 'Invalid transaction amount: must be positive' },
      }),
    })

    await expect(
      createTransaction({ amount: -50, transaction_type: 'Expense' })
    ).rejects.toThrow('Invalid transaction amount: must be positive')
  })

  it('automatically retries once with refreshed token on 401 unauthorized', async () => {
    let callCount = 0

    // Mock supabase getSession and refreshSession
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'old_expired_token' } },
    })

    vi.spyOn(supabase.auth, 'refreshSession').mockResolvedValue({
      data: { session: { access_token: 'new_refreshed_token' } },
      error: null,
    })

    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      callCount++
      const authHeader = options?.headers?.Authorization || options?.headers?.authorization
      if (callCount === 1) {
        expect(authHeader).toBe('Bearer old_expired_token')
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { message: 'Token expired' } }),
        })
      }
      // Second call after refresh
      expect(authHeader).toBe('Bearer new_refreshed_token')
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: { status: 'refreshed_success' },
        }),
      })
    })

    const res = await apiFetch('/api/protected-resource')
    expect(res).toEqual({ status: 'refreshed_success' })
    expect(callCount).toBe(2)
  })
})
