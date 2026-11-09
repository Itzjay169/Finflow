import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
  isLiveSupabase: false,
  DEMO_USER: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'demo@finflow.app',
    user_metadata: { full_name: 'Demo User' },
  },
  DEMO_TOKEN: 'finflow_demo_jwt_token_2026',
}))

import { AuthProvider, useAuth } from '../context/AuthContext'

function TestConsumer() {
  const { user, isDemo, signInWithDemo, signOut } = useAuth()
  return (
    <div>
      <span data-testid="user-status">{user ? `Logged in as ${user.email}` : 'Not logged in'}</span>
      <span data-testid="demo-status">{isDemo ? 'Demo active' : 'Demo inactive'}</span>
      <button onClick={() => signInWithDemo()} data-testid="login-demo-btn">
        Demo Login
      </button>
      <button onClick={() => signOut()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  )
}

describe('AuthContext Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('initializes with no user when unauthenticated', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo inactive')
    })
  })

  it('allows logging in via demo mode session', async () => {
    // Mock backend demo session endpoint
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        data: {
          access_token: 'valid.dev.jwt',
          user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo@finflow.app' },
        },
      }),
    })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByTestId('login-demo-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as demo@finflow.app')
      expect(screen.getByTestId('demo-status')).toHaveTextContent('Demo active')
    })
  })

  it('clears session and cached storage on logout', async () => {
    localStorage.setItem(
      'finflow_demo_session',
      JSON.stringify({
        access_token: 'token-123',
        user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo@finflow.app' },
      })
    )

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as demo@finflow.app')
    })

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    await waitFor(() => {
      expect(localStorage.getItem('finflow_demo_session')).toBeNull()
      expect(localStorage.getItem('finflow_auth_session')).toBeNull()
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
    })
  })
})
