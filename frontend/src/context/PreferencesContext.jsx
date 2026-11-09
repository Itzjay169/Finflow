import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../lib/api'
import { formatCurrency, setActiveCurrency } from '../lib/utils'

const PreferencesContext = createContext(null)

const DEFAULTS = {
  currency: 'INR',
  theme_preference: 'dark',
  accent_color: 'indigo',
  ui_density: 'comfortable',
  timezone: 'Asia/Kolkata',
  start_day_of_week: 'Monday',
  default_transaction_type: 'Expense',
  default_category: 'Food',
  default_payment_mode: 'UPI',
  default_location: 'Bangalore',
  monthly_income_target: 0,
  monthly_expense_target: 0,
  savings_rate_target: 20,
  enable_confetti: true,
  enable_onboarding_tour: true,
  enable_compact_tables: false,
  notifications_enabled: true,
  budget_alerts_enabled: true,
  recurring_bill_reminders_enabled: true,
  goal_milestone_notifications_enabled: true,
  weekly_summary_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
}

const ACCENT_COLORS = {
  indigo: '#6366f1',
  blue: '#3b82f6',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  orange: '#f97316',
}

const ACCENT_RGB = {
  indigo: '99, 102, 241',
  blue: '59, 130, 246',
  emerald: '16, 185, 129',
  rose: '244, 63, 94',
  amber: '245, 158, 11',
  violet: '139, 92, 246',
  cyan: '6, 182, 212',
  orange: '249, 115, 22',
}

/**
 * PreferencesProvider fetches user preferences from the backend after login,
 * caches them in React state, and applies theme/density/accent CSS reactively.
 * localStorage is only used as a fast-startup cache—backend is always truth.
 */
export function PreferencesProvider({ children }) {
  const { session } = useAuth()
  const [preferences, setPreferences] = useState(() => {
    try {
      const cached = localStorage.getItem('finflow_preferences')
      const initial = cached ? { ...DEFAULTS, ...JSON.parse(cached) } : DEFAULTS
      if (initial.currency) setActiveCurrency(initial.currency)
      return initial
    } catch {
      return DEFAULTS
    }
  })
  const [loading, setLoading] = useState(false)

  // Sync preferences from backend after authentication
  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false

    async function fetchPreferences() {
      setLoading(true)
      try {
        const data = await api.getUserPreferences()
        if (!cancelled && data) {
          const merged = { ...DEFAULTS, ...data }
          setPreferences(merged)
          localStorage.setItem('finflow_preferences', JSON.stringify(merged))
        }
      } catch (err) {
        console.warn('Failed to fetch user preferences:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPreferences()
    return () => { cancelled = true }
  }, [session?.access_token])

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    const theme = preferences.theme_preference

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e) => root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    root.classList.toggle('dark', theme === 'dark')
  }, [preferences.theme_preference])

  // Apply density class to <html>
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('density-compact', preferences.ui_density === 'compact')
    root.classList.toggle('density-comfortable', preferences.ui_density !== 'compact')
  }, [preferences.ui_density])

  // Apply accent color attribute & CSS variables
  useEffect(() => {
    const colorId = preferences.accent_color || 'indigo'
    const hex = ACCENT_COLORS[colorId] || ACCENT_COLORS.indigo
    const rgb = ACCENT_RGB[colorId] || ACCENT_RGB.indigo
    const root = document.documentElement
    root.setAttribute('data-accent', colorId)
    root.style.setProperty('--accent-color', hex)
    root.style.setProperty('--accent-color-rgb', rgb)
    root.style.setProperty('--primary', rgb.replace(/,/g, ''))
    root.style.setProperty('--ring', rgb.replace(/,/g, ''))
  }, [preferences.accent_color])

  // Apply active currency globally to formatters
  useEffect(() => {
    if (preferences.currency) {
      setActiveCurrency(preferences.currency)
    }
  }, [preferences.currency])

  const updatePreferences = useCallback(async (updates) => {
    // Optimistic update
    const previous = { ...preferences }
    const optimistic = { ...preferences, ...updates }
    setPreferences(optimistic)
    localStorage.setItem('finflow_preferences', JSON.stringify(optimistic))
    if (optimistic.currency) setActiveCurrency(optimistic.currency)

    try {
      const data = await api.updateUserPreferences(updates)
      if (data) {
        const merged = { ...DEFAULTS, ...data }
        setPreferences(merged)
        localStorage.setItem('finflow_preferences', JSON.stringify(merged))
        if (merged.currency) setActiveCurrency(merged.currency)
      }
      return { success: true }
    } catch (err) {
      // Rollback on error
      setPreferences(previous)
      localStorage.setItem('finflow_preferences', JSON.stringify(previous))
      if (previous.currency) setActiveCurrency(previous.currency)
      return { success: false, error: err.message || 'Failed to update preferences' }
    }
  }, [preferences])

  const formatMoney = useCallback((amount, options = {}) => {
    return formatCurrency(amount, preferences.currency, options)
  }, [preferences.currency])

  const value = useMemo(() => ({
    preferences,
    loading,
    currency: preferences.currency,
    theme: preferences.theme_preference,
    density: preferences.ui_density,
    accentColor: preferences.accent_color,
    updatePreferences,
    formatMoney,
    ACCENT_COLORS,
    DEFAULTS,
  }), [preferences, loading, updatePreferences, formatMoney])

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) {
    return {
      preferences: DEFAULTS,
      loading: false,
      updatePreferences: async () => ({ success: true }),
      refreshPreferences: async () => {},
    }
  }
  return ctx
}

export { ACCENT_COLORS, DEFAULTS as PREFERENCE_DEFAULTS }

