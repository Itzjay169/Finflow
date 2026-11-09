/**
 * @vitest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { PreferencesProvider, usePreferences } from '../context/PreferencesContext'
import { AuthContext } from '../context/AuthContext'
import * as apiModule from '../lib/api'

// Helper component that displays preferences from context
function Consumer() {
  const { preferences, loading, updatePreferences } = usePreferences()
  return (
    <div>
      <span data-testid="currency">{preferences.currency}</span>
      <span data-testid="theme">{preferences.theme_preference}</span>
      <span data-testid="accent">{preferences.accent_color}</span>
      <span data-testid="density">{preferences.ui_density}</span>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <button
        onClick={() => updatePreferences({ currency: 'EUR', accent_color: 'rose' })}
      >
        Change To EUR
      </button>
    </div>
  )
}

describe('Preferences Persistence & Lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('proves preferences persist from localStorage across simulated page refresh', () => {
    // 1. Simulate existing persisted preferences in localStorage from prior session
    const cachedPreferences = {
      currency: 'GBP',
      theme_preference: 'dark',
      accent_color: 'emerald',
      ui_density: 'compact',
    }
    localStorage.setItem('finflow_preferences', JSON.stringify(cachedPreferences))

    // 2. Mount PreferencesProvider with no active auth session (unauthenticated page reload)
    const mockAuthValue = {
      session: null,
      user: null,
      loading: false,
    }

    render(
      <AuthContext.Provider value={mockAuthValue}>
        <PreferencesProvider>
          <Consumer />
        </PreferencesProvider>
      </AuthContext.Provider>
    )

    // Verify preferences were restored immediately from localStorage cache on refresh
    expect(screen.getByTestId('currency').textContent).toBe('GBP')
    expect(screen.getByTestId('accent').textContent).toBe('emerald')
    expect(screen.getByTestId('density').textContent).toBe('compact')
  })

  it('reconciles preferences with backend after user logs in', async () => {
    // Mock backend returning user's remote preferences
    const serverPreferences = {
      currency: 'USD',
      theme_preference: 'light',
      accent_color: 'violet',
      ui_density: 'comfortable',
    }
    const getUserPreferencesSpy = vi
      .spyOn(apiModule.api, 'getUserPreferences')
      .mockResolvedValue(serverPreferences)

    const mockAuthValue = {
      session: { access_token: 'mock_jwt_token_123' },
      user: { id: 'user_123', email: 'test@example.com' },
      loading: false,
    }

    await act(async () => {
      render(
        <AuthContext.Provider value={mockAuthValue}>
          <PreferencesProvider>
            <Consumer />
          </PreferencesProvider>
        </AuthContext.Provider>
      )
    })

    expect(getUserPreferencesSpy).toHaveBeenCalled()
    expect(screen.getByTestId('currency').textContent).toBe('USD')
    expect(screen.getByTestId('accent').textContent).toBe('violet')

    // Verify localStorage was updated with the reconciled server preferences
    const savedInStorage = JSON.parse(localStorage.getItem('finflow_preferences'))
    expect(savedInStorage.currency).toBe('USD')
    expect(savedInStorage.accent_color).toBe('violet')
  })

  it('updates preferences optimistically and persists to backend and localStorage', async () => {
    const updateUserPreferencesSpy = vi
      .spyOn(apiModule.api, 'updateUserPreferences')
      .mockResolvedValue({ currency: 'EUR', accent_color: 'rose' })

    const mockAuthValue = {
      session: { access_token: 'mock_jwt_token_123' },
      user: { id: 'user_123', email: 'test@example.com' },
      loading: false,
    }

    vi.spyOn(apiModule.api, 'getUserPreferences').mockResolvedValue({
      currency: 'INR',
      accent_color: 'indigo',
    })

    await act(async () => {
      render(
        <AuthContext.Provider value={mockAuthValue}>
          <PreferencesProvider>
            <Consumer />
          </PreferencesProvider>
        </AuthContext.Provider>
      )
    })

    // Click button to update preferences
    const changeBtn = screen.getByRole('button', { name: /Change To EUR/i })
    await act(async () => {
      changeBtn.click()
    })

    expect(updateUserPreferencesSpy).toHaveBeenCalledWith({
      currency: 'EUR',
      accent_color: 'rose',
    })
    expect(screen.getByTestId('currency').textContent).toBe('EUR')
    expect(screen.getByTestId('accent').textContent).toBe('rose')

    // Local storage updated
    const saved = JSON.parse(localStorage.getItem('finflow_preferences'))
    expect(saved.currency).toBe('EUR')
    expect(saved.accent_color).toBe('rose')
  })
})

