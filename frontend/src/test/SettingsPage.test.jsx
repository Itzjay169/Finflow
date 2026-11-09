/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import SettingsPage from '../pages/SettingsPage'
import { AuthProvider } from '../context/AuthContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import { ToastProvider } from '../components/ui/Toast'

// Mock Supabase to avoid cloud network calls
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock_vitest_token',
            user: { id: 'test_user_id', email: 'alex@example.com' },
          },
        },
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock_refreshed_token' } },
        error: null,
      }),
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

// Mock API methods
vi.mock('../lib/api', () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    full_name: 'Alex Mercer',
    avatar_url: '',
    currency: 'INR',
    theme_preference: 'dark',
    accent_color: 'indigo',
  }),
  updateUserProfile: vi.fn().mockResolvedValue({
    full_name: 'Alex Mercer Updated',
    currency: 'INR',
  }),
  getUserPreferences: vi.fn().mockResolvedValue({
    currency: 'INR',
    theme_preference: 'dark',
    accent_color: 'indigo',
    ui_density: 'comfortable',
    timezone: 'Asia/Kolkata',
    start_day_of_week: 'Monday',
    monthly_income_target: 75000,
    monthly_expense_target: 45000,
    savings_rate_target: 25,
    enable_confetti: true,
    notifications_enabled: true,
    quiet_hours_enabled: false,
  }),
  updateUserPreferences: vi.fn().mockResolvedValue({
    currency: 'USD',
    theme_preference: 'light',
  }),
  exportTransactionsCsv: vi.fn().mockResolvedValue('transaction_id,date,amount\ntx_1,2026-11-01,100'),
  exportAllUserDataJson: vi.fn().mockResolvedValue({ schema_version: '1.0.0', user_id: 'test' }),
  importTransactionsCsv: vi.fn().mockResolvedValue({ success: true, imported: 5, message: 'Imported 5' }),
  getTransactionsCsvTemplate: vi.fn().mockResolvedValue('date,transaction_type,category,amount'),
  resetDemoData: vi.fn().mockResolvedValue({ success: true, message: 'Reset done' }),
  deleteUserAccount: vi.fn().mockResolvedValue({ success: true, message: 'Account deleted' }),
  checkHealth: vi.fn().mockResolvedValue({ status: 'healthy' }),
  markAllNotificationsRead: vi.fn().mockResolvedValue({ success: true }),
  clearAllNotifications: vi.fn().mockResolvedValue({ success: true }),
  api: {
    getUserPreferences: vi.fn().mockResolvedValue({ currency: 'INR' }),
    updateUserPreferences: vi.fn().mockResolvedValue({ currency: 'USD' }),
  },
}))

function renderSettingsPage() {
  return render(
    <ToastProvider>
      <AuthProvider>
        <PreferencesProvider>
          <SettingsPage isDark={true} onToggleTheme={vi.fn()} />
        </PreferencesProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

describe('SettingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage?.clear()
  })

  it('renders all 7 navigation tabs', async () => {
    renderSettingsPage()

    expect(screen.getByRole('button', { name: /^Profile$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Preferences$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Financial Defaults$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Notifications$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Data & Privacy$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Security$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^About & Support$/i })).toBeDefined()
  })

  it('displays Profile section by default with full name and read-only email', async () => {
    renderSettingsPage()

    expect(screen.getByText('Profile Information')).toBeDefined()
    expect(screen.getByDisplayValue('Alex Mercer')).toBeDefined()
    expect(screen.getByText(/Read-Only/i)).toBeDefined()
  })

  it('navigates to Preferences tab and displays currency options', async () => {
    renderSettingsPage()

    const prefsTab = screen.getByRole('button', { name: /^Preferences$/i })
    fireEvent.click(prefsTab)

    expect(screen.getByText('Display & Locale Preferences')).toBeDefined()
    expect(screen.getByText('Indian Rupee (INR)')).toBeDefined()
    expect(screen.getByText('US Dollar (USD)')).toBeDefined()
    expect(screen.getByText('Euro (EUR)')).toBeDefined()
    expect(screen.getByText('British Pound (GBP)')).toBeDefined()
  })

  it('navigates to Financial Defaults tab and displays financial targets', async () => {
    renderSettingsPage()

    const finTab = screen.getByRole('button', { name: /^Financial Defaults$/i })
    fireEvent.click(finTab)

    expect(screen.getByText('Financial Targets & Defaults')).toBeDefined()
    expect(screen.getByText(/Monthly Income Target/i)).toBeDefined()
    expect(screen.getByText(/Monthly Expense Budget Target/i)).toBeDefined()
    expect(screen.getByText('Savings Rate Target (%)')).toBeDefined()
    expect(screen.getByText('Celebratory Confetti Animation')).toBeDefined()
  })

  it('navigates to Notifications tab and displays quiet hours controls', async () => {
    renderSettingsPage()

    const notifTab = screen.getByRole('button', { name: /^Notifications$/i })
    fireEvent.click(notifTab)

    expect(screen.getByText('Notification Channels & Quiet Hours')).toBeDefined()
    expect(screen.getByText('Master Notifications System')).toBeDefined()
    expect(screen.getByText('Enable Quiet Hours')).toBeDefined()
  })

  it('navigates to Data & Privacy tab and opens Reset Demo modal requiring exact confirmation phrase', async () => {
    renderSettingsPage()

    const dataTab = screen.getByRole('button', { name: /^Data & Privacy$/i })
    fireEvent.click(dataTab)

    expect(screen.getByText('Data Portability & Import')).toBeDefined()
    expect(screen.getByText('Danger Zone')).toBeDefined()

    // Open Reset Demo Data Modal
    const resetBtn = screen.getByRole('button', { name: /Reset Demo Data/i })
    fireEvent.click(resetBtn)

    expect(screen.getByText('Reset Demo Account Data?')).toBeDefined()
    const confirmBtn = screen.getByRole('button', { name: /Confirm Reset/i })
    // Initially disabled because confirmation input is empty
    expect(confirmBtn.hasAttribute('disabled')).toBe(true)

    // Type phrase into confirmation input
    const input = screen.getByPlaceholderText('RESET DEMO DATA')
    fireEvent.change(input, { target: { value: 'RESET DEMO DATA' } })

    // Button should now be enabled
    expect(confirmBtn.hasAttribute('disabled')).toBe(false)
  })

  it('navigates to Delete Account modal requiring 2-step confirmation', async () => {
    renderSettingsPage()

    const dataTab = screen.getByRole('button', { name: /^Data & Privacy$/i })
    fireEvent.click(dataTab)

    // Open Delete Account Modal
    const deleteBtn = screen.getByRole('button', { name: /^Delete Account$/i })
    fireEvent.click(deleteBtn)

    expect(screen.getByText('Permanently Delete Account?')).toBeDefined()
    const permDeleteBtn = screen.getByRole('button', { name: /Permanently Delete/i })
    expect(permDeleteBtn.hasAttribute('disabled')).toBe(true)

    // Check acknowledgment checkbox
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(permDeleteBtn.hasAttribute('disabled')).toBe(true) // Still disabled without phrase

    // Type exact confirmation phrase
    const input = screen.getByPlaceholderText('DELETE MY ACCOUNT')
    fireEvent.change(input, { target: { value: 'DELETE MY ACCOUNT' } })

    // Now both steps are satisfied -> button enabled
    expect(permDeleteBtn.hasAttribute('disabled')).toBe(false)
  })

  it('navigates to About & Support and renders accurate 95.83% held-out test metric', async () => {
    renderSettingsPage()

    const aboutTab = screen.getByRole('button', { name: /^About & Support$/i })
    fireEvent.click(aboutTab)

    expect(screen.getByText('About FinFlow & System Telemetry')).toBeDefined()
    expect(screen.getByText('v2.4.0')).toBeDefined()
    expect(screen.getByText('95.83%')).toBeDefined()
    expect(screen.getByText(/Held-out test accuracy: 95.83% on 240 unseen rows/i)).toBeDefined()
  })
})
