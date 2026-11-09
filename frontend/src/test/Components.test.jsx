import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

function ThrowingComponent() {
  throw new Error('Test crash in child component')
}

describe('ProtectedRoute & ErrorBoundary Components', () => {
  it('redirects unauthenticated users to /login', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Mock</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument()
    expect(screen.queryByText('Secret Content')).toBeNull()
  })

  it('renders children for authenticated users', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Secret Content')).toBeInTheDocument()
  })

  it('catches render errors and displays fallback UI', () => {
    // Suppress console.error in this test because ErrorBoundary logs the error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something unexpected occurred/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument()

    spy.mockRestore()
  })
})
