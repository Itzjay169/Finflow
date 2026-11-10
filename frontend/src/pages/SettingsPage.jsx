import React, { useState, useEffect } from 'react'
import {
  User,
  Palette,
  DollarSign,
  Download,
  Check,
  Shield,
  FileText,
  AlertTriangle,
  RefreshCw,
  Bell,
  Sliders,
  Upload,
  ExternalLink,
  Lock,
  Globe,
  Clock,
  LogOut,
  Mail,
  Cpu,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../components/ui/Toast'
import {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  exportTransactionsCsv,
  exportAllUserDataJson,
  importTransactionsCsv,
  getTransactionsCsvTemplate,
  resetDemoData,
  deleteUserAccount,
  checkHealth,
  markAllNotificationsRead,
  clearAllNotifications,
} from '../lib/api'
import { siteConfig } from '../config/site'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { Button, Modal } from '../components/ui'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
]

const ACCENT_COLORS = [
  { name: 'Indigo', id: 'indigo', class: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { name: 'Purple', id: 'purple', class: 'bg-purple-600', ring: 'ring-purple-500' },
  { name: 'Cyan', id: 'cyan', class: 'bg-cyan-500', ring: 'ring-cyan-400' },
  { name: 'Emerald', id: 'emerald', class: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { name: 'Rose', id: 'rose', class: 'bg-rose-500', ring: 'ring-rose-400' },
  { name: 'Amber', id: 'amber', class: 'bg-amber-500', ring: 'ring-amber-400' },
]

const CITIES = [
  'Bangalore',
  'Bhubaneswar',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Jaipur',
  'Kolkata',
  'Mumbai',
  'Pune',
  'Ahmedabad',
]

const CATEGORIES = [
  'Food',
  'Groceries',
  'Bills',
  'Shopping',
  'Entertainment',
  'Travel',
  'Fuel',
  'Healthcare',
  'Rent',
  'Investments',
  'Salary',
  'Freelance',
]

const PAYMENT_MODES = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Bank Transfer']

export default function SettingsPage({ isDark: _isDark, onToggleTheme: _onToggleTheme } = {}) {
  const { user, isDemo, signOut } = useAuth()
  const { preferences: globalPrefs, updatePreferences } = usePreferences()
  const { toast } = useToast()

  // Active Tab: profile, preferences, financial, notifications, data, security, about
  const [activeTab, setActiveTab] = useState('profile')

  // Profile State
  const [fullName, setFullName] = useState('Alex Mercer')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Preferences State
  const [currency, setCurrency] = useState(globalPrefs?.currency || 'INR')
  const [themePref, setThemePref] = useState(globalPrefs?.theme_preference || 'dark')
  const [accentColor, setAccentColor] = useState(globalPrefs?.accent_color || 'indigo')
  const [density, setDensity] = useState(globalPrefs?.ui_density || 'comfortable')
  const [timezone, setTimezone] = useState(globalPrefs?.timezone || 'Asia/Kolkata')
  const [weekStartDay, setWeekStartDay] = useState(globalPrefs?.start_day_of_week || 'Monday')

  // Financial Defaults State
  const [defaultTxType, setDefaultTxType] = useState('Expense')
  const [defaultPaymentMode, setDefaultPaymentMode] = useState('UPI')
  const [defaultLocation, setDefaultLocation] = useState('Bangalore')
  const [defaultCategory, setDefaultCategory] = useState('Food')
  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(75000)
  const [monthlyExpenseTarget, setMonthlyExpenseTarget] = useState(45000)
  const [savingsRateTarget, setSavingsRateTarget] = useState(25)
  const [confettiEnabled, setConfettiEnabled] = useState(true)
  const [onboardingTourEnabled, setOnboardingTourEnabled] = useState(true)
  const [compactTables, setCompactTables] = useState(false)

  // Notifications State
  const [masterNotifs, setMasterNotifs] = useState(true)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [recurringReminders, setRecurringReminders] = useState(true)
  const [milestoneAlerts, setMilestoneAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(true)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00')

  // Modals & Async States
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetConfirmationText, setResetConfirmationText] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [confirmPermanentLoss, setConfirmPermanentLoss] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importCsvText, setImportCsvText] = useState('')
  const [csvPreviewRows, setCsvPreviewRows] = useState([])
  const [isDraggingCsv, setIsDraggingCsv] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [apiHealth, setApiHealth] = useState('checking')
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)

  // Load existing profile & preferences on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [prof, prefs, health] = await Promise.all([
          getUserProfile().catch(() => null),
          getUserPreferences().catch(() => null),
          checkHealth().catch(() => ({ status: 'offline' })),
        ])

        if (prof) {
          if (prof.full_name) setFullName(prof.full_name)
          if (prof.avatar_url) setAvatarUrl(prof.avatar_url)
          if (prof.currency) setCurrency(prof.currency)
          if (prof.theme_preference) setThemePref(prof.theme_preference)
          if (prof.accent_color) setAccentColor(prof.accent_color)
        }

        if (prefs) {
          if (prefs.currency) setCurrency(prefs.currency)
          if (prefs.theme_preference) setThemePref(prefs.theme_preference)
          if (prefs.accent_color) setAccentColor(prefs.accent_color)
          if (prefs.density) setDensity(prefs.density)
          if (prefs.timezone) setTimezone(prefs.timezone)
          if (prefs.week_start_day) setWeekStartDay(prefs.week_start_day)
          if (prefs.default_transaction_type) setDefaultTxType(prefs.default_transaction_type)
          if (prefs.default_payment_mode) setDefaultPaymentMode(prefs.default_payment_mode)
          if (prefs.default_location) setDefaultLocation(prefs.default_location)
          if (prefs.default_category) setDefaultCategory(prefs.default_category)
          if (prefs.monthly_income_target !== undefined) setMonthlyIncomeTarget(prefs.monthly_income_target)
          if (prefs.monthly_expense_target !== undefined) setMonthlyExpenseTarget(prefs.monthly_expense_target)
          if (prefs.savings_rate_target !== undefined) setSavingsRateTarget(prefs.savings_rate_target)
          if (prefs.confetti_enabled !== undefined) setConfettiEnabled(Boolean(prefs.confetti_enabled))
          if (prefs.onboarding_tour_enabled !== undefined) setOnboardingTourEnabled(Boolean(prefs.onboarding_tour_enabled))
          if (prefs.compact_tables !== undefined) setCompactTables(Boolean(prefs.compact_tables))
          if (prefs.master_notifications !== undefined) setMasterNotifs(Boolean(prefs.master_notifications))
          if (prefs.budget_alerts !== undefined) setBudgetAlerts(Boolean(prefs.budget_alerts))
          if (prefs.recurring_reminders !== undefined) setRecurringReminders(Boolean(prefs.recurring_reminders))
          if (prefs.milestone_alerts !== undefined) setMilestoneAlerts(Boolean(prefs.milestone_alerts))
          if (prefs.weekly_summary !== undefined) setWeeklySummary(Boolean(prefs.weekly_summary))
          if (prefs.quiet_hours_enabled !== undefined) setQuietHoursEnabled(Boolean(prefs.quiet_hours_enabled))
          if (prefs.quiet_hours_start) setQuietHoursStart(prefs.quiet_hours_start)
          if (prefs.quiet_hours_end) setQuietHoursEnd(prefs.quiet_hours_end)
        }

        setApiHealth(health?.status === 'healthy' ? 'healthy' : 'degraded')
      } catch (err) {
        console.warn('Failed to load settings:', err)
      }
    }
    loadData()
  }, [])

  // Sync state with global preferences from context
  useEffect(() => {
    if (globalPrefs) {
      if (globalPrefs.currency) setCurrency(globalPrefs.currency)
      if (globalPrefs.theme_preference) setThemePref(globalPrefs.theme_preference)
      if (globalPrefs.accent_color) setAccentColor(globalPrefs.accent_color)
      if (globalPrefs.ui_density) setDensity(globalPrefs.ui_density)
      if (globalPrefs.timezone) setTimezone(globalPrefs.timezone)
      if (globalPrefs.start_day_of_week) setWeekStartDay(globalPrefs.start_day_of_week)
    }
  }, [globalPrefs])

  // Interactive preference switchers with immediate reactive feedback
  const handleSelectCurrency = (curCode) => {
    setCurrency(curCode)
    if (updatePreferences) {
      updatePreferences({ currency: curCode })
    }
    toast.success(`Currency switched to ${curCode}`, 'Currency')
  }

  const handleSelectTheme = (th) => {
    setThemePref(th)
    if (updatePreferences) {
      updatePreferences({ theme_preference: th })
    }
    toast.success(`Theme mode set to ${th}`, 'Theme')
  }

  const handleSelectDensity = (d) => {
    setDensity(d)
    if (updatePreferences) {
      updatePreferences({ ui_density: d, density: d })
    }
    toast.success(`Interface density set to ${d}`, 'Density')
  }

  const handleSelectAccent = (colorId) => {
    setAccentColor(colorId)
    if (updatePreferences) {
      updatePreferences({ accent_color: colorId })
    }
    toast.success(`Accent color set to ${colorId}`, 'Accent Color')
  }

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await updateUserProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
        currency,
        theme_preference: themePref,
        accent_color: accentColor,
      })
      toast.success('Profile details updated successfully!', 'Saved')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Save Preferences Handler
  const handleSavePreferences = async () => {
    setIsSavingPrefs(true)
    const payload = {
      currency,
      theme_preference: themePref,
      accent_color: accentColor,
      density,
      ui_density: density,
      timezone,
      week_start_day: weekStartDay,
      start_day_of_week: weekStartDay,
      default_transaction_type: defaultTxType,
      default_payment_mode: defaultPaymentMode,
      default_location: defaultLocation,
      default_category: defaultCategory,
      monthly_income_target: Number(monthlyIncomeTarget),
      monthly_expense_target: Number(monthlyExpenseTarget),
      savings_rate_target: Number(savingsRateTarget),
      confetti_enabled: confettiEnabled,
      enable_confetti: confettiEnabled,
      onboarding_tour_enabled: onboardingTourEnabled,
      enable_onboarding_tour: onboardingTourEnabled,
      compact_tables: compactTables,
      enable_compact_tables: compactTables,
      master_notifications: masterNotifs,
      notifications_enabled: masterNotifs,
      budget_alerts: budgetAlerts,
      budget_alerts_enabled: budgetAlerts,
      recurring_reminders: recurringReminders,
      recurring_bill_reminders_enabled: recurringReminders,
      milestone_alerts: milestoneAlerts,
      goal_milestone_notifications_enabled: milestoneAlerts,
      weekly_summary: weeklySummary,
      weekly_summary_enabled: weeklySummary,
      quiet_hours_enabled: quietHoursEnabled,
      quiet_hours_start: quietHoursStart,
      quiet_hours_end: quietHoursEnd,
    }
    try {
      if (updatePreferences) {
        await updatePreferences(payload)
      } else {
        await updateUserPreferences(payload)
      }
      toast.success('Preferences saved successfully!', 'Preferences Updated')
    } catch (err) {
      toast.error(err.message || 'Failed to save preferences.')
    } finally {
      setIsSavingPrefs(false)
    }
  }

  // Avatar Upload / File reader
  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WEBP).', 'Invalid File')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar image must be smaller than 2MB.', 'File Too Large')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarUrl(ev.target.result)
      toast.success('Avatar image loaded. Click Save Profile to apply.', 'Avatar Staged')
    }
    reader.readAsDataURL(file)
  }

  // Export handlers
  const handleExportCSV = async () => {
    try {
      const csv = await exportTransactionsCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `finflow_transactions_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toast.success('Transactions CSV export downloaded successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV.')
    }
  }

  const handleExportJSON = async () => {
    try {
      const data = await exportAllUserDataJson()
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `finflow_backup_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      toast.success('Full account data backup JSON downloaded!')
    } catch (err) {
      toast.error(err.message || 'Failed to export JSON.')
    }
  }

  const handlePrintPDF = () => {
    setIsExporting(true)
    setTimeout(() => {
      window.print()
      setIsExporting(false)
      toast.success('Printable report dialog initiated!')
    }, 400)
  }

  const parseCsvPreview = (text) => {
    if (!text || !text.trim()) {
      setCsvPreviewRows([])
      return
    }
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length <= 1) {
      setCsvPreviewRows([])
      return
    }
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
    const preview = lines.slice(1, 11).map((line) => {
      const parts = line.split(',').map((p) => p.trim().replace(/"/g, ''))
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = parts[i] || ''
      })
      return obj
    })
    setCsvPreviewRows(preview)
  }

  const handleCsvTextChange = (text) => {
    setImportCsvText(text)
    parseCsvPreview(text)
  }

  const handleCsvFileDrop = (e) => {
    e.preventDefault()
    setIsDraggingCsv(false)
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a valid .csv file.', 'Invalid File')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      setImportCsvText(text)
      parseCsvPreview(text)
      toast.success(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    }
    reader.readAsText(file)
  }

  const handleDownloadTemplate = async () => {
    try {
      const template = await getTransactionsCsvTemplate()
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'finflow_template.csv'
      link.click()
      toast.success('Downloaded sample CSV template.')
    } catch (err) {
      toast.error(err.message || 'Failed to download template.')
    }
  }

  const handleImportCSV = async () => {
    if (!importCsvText.trim()) {
      toast.error('Please paste CSV text or select a valid file.')
      return
    }
    setIsImporting(true)
    try {
      const res = await importTransactionsCsv(importCsvText)
      toast.success(res.message || 'CSV imported successfully!')
      setIsImportModalOpen(false)
      setImportCsvText('')
      setCsvPreviewRows([])
    } catch (err) {
      toast.error(err.message || 'CSV import failed.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleResetDemo = async () => {
    if (resetConfirmationText.trim() !== 'RESET DEMO DATA') {
      toast.error('Please type "RESET DEMO DATA" to confirm.', 'Confirmation Required')
      return
    }
    try {
      await resetDemoData('RESET DEMO DATA')
      toast.success('Demo account data has been reset to defaults.', 'Reset Complete')
      setIsResetModalOpen(false)
      setResetConfirmationText('')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast.error(err.message || 'Failed to reset demo data.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirmPermanentLoss) {
      toast.error('Please check the confirmation box to acknowledge permanent loss.', 'Confirmation Required')
      return
    }
    if (deleteConfirmationText.trim() !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm.', 'Confirmation Required')
      return
    }
    try {
      await deleteUserAccount('DELETE MY ACCOUNT')
      toast.success('Your account and all records have been permanently erased.', 'Account Deleted')
      setIsDeleteModalOpen(false)
      setDeleteConfirmationText('')
      setConfirmPermanentLoss(false)
      await signOut()
    } catch (err) {
      toast.error(err.message || 'Failed to delete account.')
    }
  }

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true)
    try {
      const res = await checkHealth()
      setApiHealth(res?.status === 'healthy' ? 'healthy' : 'degraded')
      toast.success(`API is ${res?.status || 'online'}!`, 'System Health')
    } catch {
      setApiHealth('offline')
      toast.error('Could not reach FinFlow backend API.')
    } finally {
      setIsCheckingHealth(false)
    }
  }

  const handleDownloadDeletionSummary = () => {
    const summary = {
      action: 'DATA_DELETION_SUMMARY',
      user_id: user?.id,
      email: user?.email,
      timestamp: new Date().toISOString(),
      policy: 'GDPR Article 17 Right to Erasure / FinFlow Privacy Commitment',
      notice: 'Executing Delete Account purges transactions, budgets, goals, recurring bills, and ML history.',
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `finflow_deletion_summary_${user?.id || 'user'}.json`
    link.click()
    toast.success('Data deletion summary downloaded.')
  }

  const navTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'financial', label: 'Financial Defaults', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Download },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'about', label: 'About & Support', icon: Sliders },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-500" />
          Settings & Control Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal profile, display preferences, financial parameters, and security policies.
        </p>
      </div>

      {/* Navigation Pills Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {navTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION A: PROFILE */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your display name and profile picture. Your email is managed via your authenticated identity.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 overflow-hidden shadow-lg border-2 border-indigo-500/30 flex items-center justify-center text-white text-xl font-bold">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        fullName.charAt(0) || 'U'
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Avatar Image URL or Upload
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                      />
                      <label className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                        <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="px-2.5 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Supports JPG, PNG, WEBP up to 2MB or secure HTTPS image URLs.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address <span className="text-[10px] text-slate-400">(Read-Only)</span>
                    </label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm bg-slate-200/50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 text-slate-500 cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user?.email || 'demo@finflow.app'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="submit" variant="gradient" disabled={isSavingProfile} className="gap-2">
                  {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Profile
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* SECTION B: PREFERENCES */}
        {/* ========================================================================= */}
        {activeTab === 'preferences' && (
          <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-500" />
                Display & Locale Preferences
              </CardTitle>
              <CardDescription>
                Customize theme, currency formatting, interface density, and time configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Primary Currency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CURRENCIES.map((cur) => {
                    const isSelected = currency === cur.code
                    return (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => handleSelectCurrency(cur.code)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: 'var(--accent-color, #6366f1)',
                                backgroundColor: 'rgba(var(--accent-color-rgb, 99, 102, 241), 0.18)',
                                color: 'var(--accent-color, #6366f1)',
                              }
                            : undefined
                        }
                      >
                        <div className="text-lg font-bold font-mono">{cur.symbol}</div>
                        <div className="text-xs font-medium mt-0.5">{cur.name}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Theme & Density */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['light', 'dark', 'system'].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => handleSelectTheme(th)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          themePref === th
                            ? 'font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40'
                        }`}
                        style={
                          themePref === th
                            ? {
                                borderColor: 'var(--accent-color, #6366f1)',
                                backgroundColor: 'rgba(var(--accent-color-rgb, 99, 102, 241), 0.18)',
                                color: 'var(--accent-color, #6366f1)',
                              }
                            : undefined
                        }
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Interface Density
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['comfortable', 'compact'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleSelectDensity(d)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          density === d
                            ? 'font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40'
                        }`}
                        style={
                          density === d
                            ? {
                                borderColor: 'var(--accent-color, #6366f1)',
                                backgroundColor: 'rgba(var(--accent-color-rgb, 99, 102, 241), 0.18)',
                                color: 'var(--accent-color, #6366f1)',
                              }
                            : undefined
                        }
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => {
                    const isSelected = accentColor === color.id
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleSelectAccent(color.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'text-white shadow-sm ring-1 ring-white/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: 'var(--accent-color, #6366f1)',
                                backgroundColor: 'rgba(var(--accent-color-rgb, 99, 102, 241), 0.25)',
                              }
                            : undefined
                        }
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${color.class}`} />
                        {color.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Timezone & Start of Week */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-500" /> Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (GMT +0:00)</option>
                    <option value="America/New_York">America/New_York (EST -5:00)</option>
                    <option value="Europe/London">Europe/London (GMT +0:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" /> Start Day of Week
                  </label>
                  <select
                    value={weekStartDay}
                    onChange={(e) => setWeekStartDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Monday">Monday (Standard)</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={handleSavePreferences} variant="gradient" disabled={isSavingPrefs} className="gap-2">
                {isSavingPrefs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* SECTION C: FINANCIAL DEFAULTS */}
        {/* ========================================================================= */}
        {activeTab === 'financial' && (
          <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Financial Targets & Defaults
              </CardTitle>
              <CardDescription>
                Configure monthly budgeting targets, transaction creation defaults, and animation toggles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Targets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Monthly Income Target ({CURRENCIES.find((c) => c.code === currency)?.symbol || '₹'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={monthlyIncomeTarget}
                    onChange={(e) => setMonthlyIncomeTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Monthly Expense Budget Target ({CURRENCIES.find((c) => c.code === currency)?.symbol || '₹'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={monthlyExpenseTarget}
                    onChange={(e) => setMonthlyExpenseTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Savings Rate Target (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={savingsRateTarget}
                    onChange={(e) => setSavingsRateTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Form Entry Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Type
                  </label>
                  <select
                    value={defaultTxType}
                    onChange={(e) => setDefaultTxType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Payment
                  </label>
                  <select
                    value={defaultPaymentMode}
                    onChange={(e) => setDefaultPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default City
                  </label>
                  <select
                    value={defaultLocation}
                    onChange={(e) => setDefaultLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Category
                  </label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Celebratory Confetti Animation
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Trigger subtle confetti fireworks when adding transactions or funding goals.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={confettiEnabled}
                    onChange={(e) => setConfettiEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Show Onboarding Guide Tour
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Displays introductory modal tour highlighting ML features and cashflow telemetry.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={onboardingTourEnabled}
                    onChange={(e) => setOnboardingTourEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Compact Dense Tables
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Reduce padding on transactions and telemetry tables to fit more records per view.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactTables}
                    onChange={(e) => setCompactTables(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={handleSavePreferences} variant="gradient" disabled={isSavingPrefs} className="gap-2">
                {isSavingPrefs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Financial Defaults
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* SECTION D: NOTIFICATIONS */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Notification Channels & Quiet Hours
              </CardTitle>
              <CardDescription>
                Control which alerts trigger push badges and set quiet hours for uninterrupted focus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Master Notifications System
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Global switch for all alerts, reminders, and weekly financial intelligence summaries.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={masterNotifs}
                  onChange={(e) => setMasterNotifs(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <div className="space-y-2.5 pt-1">
                {[
                  { label: 'Budget Limit Warnings', desc: 'Alert when category spending exceeds 80% or exceeds limit.', state: budgetAlerts, setter: setBudgetAlerts },
                  { label: 'Upcoming Recurring Bills', desc: 'Send reminders for bills due within 3 days.', state: recurringReminders, setter: setRecurringReminders },
                  { label: 'Savings Goal Milestones', desc: 'Celebrate reaching 25%, 50%, 75%, and 100% of goals.', state: milestoneAlerts, setter: setMilestoneAlerts },
                  { label: 'Weekly Cashflow Digest', desc: 'Weekly algorithmic analysis of income and expense trends.', state: weeklySummary, setter: setWeeklySummary },
                ].map((item) => (
                  <label key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!masterNotifs}
                      checked={masterNotifs && item.state}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              {/* Quiet Hours */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Enable Quiet Hours
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Mute non-critical financial notifications during scheduled resting periods.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">End Time</label>
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Inbox Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await markAllNotificationsRead()
                    toast.success('All notifications marked as read.')
                  }}
                  className="text-xs"
                >
                  Mark All as Read
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await clearAllNotifications()
                    toast.success('Notification feed cleared.')
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600"
                >
                  Clear All Notifications
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={handleSavePreferences} variant="gradient" disabled={isSavingPrefs} className="gap-2">
                {isSavingPrefs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Notification Preferences
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* SECTION E: DATA & PRIVACY */}
        {/* ========================================================================= */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-500" />
                  Data Portability & Import
                </CardTitle>
                <CardDescription>
                  Export RFC 4180 CSV tables, comprehensive JSON backups, or import external financial ledgers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button onClick={handleExportCSV} variant="outline" className="w-full gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportJSON} variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4 text-cyan-500" />
                    Export Full JSON Backup
                  </Button>
                  <Button onClick={handlePrintPDF} variant="outline" disabled={isExporting} className="w-full gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Print / PDF Report
                  </Button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setIsImportModalOpen(true)}
                    variant="outline"
                    className="gap-2 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
                  >
                    <Upload className="w-4 h-4" />
                    Import CSV with Preview
                  </Button>
                  <Button onClick={handleDownloadDeletionSummary} variant="ghost" className="text-xs text-slate-400">
                    Download Data Deletion Policy Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="glass-panel border-rose-500/20 shadow-xl bg-rose-500/5">
              <CardHeader>
                <CardTitle className="text-base text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions. Purge local demo state or permanently delete your account records.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Reset Demo Account Data
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Clears current transactions and re-seeds the 1,200 benchmark test records.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetModalOpen(true)}
                    className="shrink-0 text-amber-500 hover:text-amber-600 border-amber-500/30"
                  >
                    Reset Demo Data
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10">
                  <div>
                    <div className="text-xs font-bold text-rose-500">
                      Delete Account & Erase All Data
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Permanently purges all user profiles, transactions, budgets, goals, and ML inference logs.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="shrink-0 bg-rose-600 text-white hover:bg-rose-700 border-transparent"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION F: SECURITY */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Session & Authentication Security
              </CardTitle>
              <CardDescription>
                Audited active session details and identity authentication status. Zero service-role keys are exposed to the client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Auth Identity
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    {user?.email || 'demo@finflow.app'}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    ID: <span className="font-mono">{user?.id?.substring(0, 16)}...</span>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Authentication Provider
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isDemo ? 'Local Benchmark Demo Session' : 'Supabase Auth / Local Dev JWT'}
                  </div>
                  <span className="text-[11px] text-emerald-500 block">
                    Encrypted Token Authorization Verified
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-500" />
                  Client Security Guarantees
                </div>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
                  <li>Tokens are dynamically obtained via supabase.auth.getSession() and memory-scoped.</li>
                  <li>Server-side authorization strictly verifies cryptographic signatures on every route.</li>
                  <li>All database queries enforce user_id parameterization preventing cross-tenant leakage.</li>
                  <li>No service-role secrets or internal keys are compiled into frontend bundles.</li>
                </ul>
              </div>

              <div className="pt-2">
                <Button onClick={signOut} variant="outline" className="gap-2 text-rose-500 hover:text-rose-600">
                  <LogOut className="w-4 h-4" />
                  Sign Out from Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* SECTION G: ABOUT / SUPPORT */}
        {/* ========================================================================= */}
        {activeTab === 'about' && (
          <Card className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                About FinFlow & System Telemetry
              </CardTitle>
              <CardDescription>
                Application build version, machine learning benchmark accuracy, and legal agreements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Version</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">v2.4.0</div>
                  <span className="text-[10px] text-emerald-500">Production Build</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">API Status</span>
                    <button
                      type="button"
                      onClick={handleCheckHealth}
                      disabled={isCheckingHealth}
                      className="text-[10px] text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                      title="Retry Health Check"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="text-lg font-bold capitalize text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${apiHealth === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {apiHealth}
                  </div>
                  <span className="text-[10px] text-slate-400">FastAPI backend</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">ML Accuracy</span>
                  <div className="text-lg font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">95.83%</div>
                  <span className="text-[10px] text-slate-400">Held-out test accuracy: 95.83% on 240 unseen rows.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Model Pipeline</span>
                  <div className="text-lg font-bold text-cyan-500 dark:text-cyan-400 mt-0.5">18 Vectors</div>
                  <span className="text-[10px] text-slate-400">RandomForest 100-est</span>
                </div>
              </div>

              {/* Legal & Project Links */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Legal & Documentation Resources
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <a href="/privacy" className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
                    Privacy Policy <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a href="/terms" className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
                    Terms of Service <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a href="/disclaimer" className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
                    Disclaimer <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a href="/cookies" className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
                    Cookie Policy <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Have feedback or spotted a bug? Contact the FinFlow core team directly.
                </div>
                <a
                  href={`mailto:${siteConfig.contactEmail || 'support@finflow.app'}?subject=FinFlow%20Feedback%20v2.4.0`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send Feedback
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Modal: Reset Demo Data */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false)
          setResetConfirmationText('')
        }}
        title="Reset Demo Account Data?"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">
            Warning: This action will purge all customized transactions, budgets, goals, and history, restoring the pristine 1,200 benchmark test records.
          </div>
          <p>
            To confirm this irreversible reset, please type <span className="font-mono font-bold text-slate-900 dark:text-white select-all">RESET DEMO DATA</span> below:
          </p>
          <input
            type="text"
            value={resetConfirmationText}
            onChange={(e) => setResetConfirmationText(e.target.value)}
            placeholder="RESET DEMO DATA"
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResetModalOpen(false)
                setResetConfirmationText('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={resetConfirmationText.trim() !== 'RESET DEMO DATA'}
              onClick={handleResetDemo}
              className="bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Delete Account */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeleteConfirmationText('')
          setConfirmPermanentLoss(false)
        }}
        title="Permanently Delete Account?"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold">
            Warning: This action is permanent and cannot be undone. All profiles, transactions, budgets, goals, and ML logs will be erased immediately (GDPR Article 17 Erasure).
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/50">
            <input
              type="checkbox"
              checked={confirmPermanentLoss}
              onChange={(e) => setConfirmPermanentLoss(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              I understand that all financial records and machine learning models tied to my account will be permanently erased.
            </span>
          </label>
          <div>
            <p className="mb-1 text-[11px] text-slate-500">
              Type <span className="font-mono font-bold text-rose-500 select-all">DELETE MY ACCOUNT</span> to proceed:
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-rose-500 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeleteConfirmationText('')
                setConfirmPermanentLoss(false)
              }}
            >
              Keep Account
            </Button>
            <Button
              size="sm"
              disabled={!confirmPermanentLoss || deleteConfirmationText.trim() !== 'DELETE MY ACCOUNT'}
              onClick={handleDeleteAccount}
              className="bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 border-transparent"
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import CSV Modal with Drag-and-Drop, Preview & Template Download */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          setImportCsvText('')
          setCsvPreviewRows([])
        }}
        title="Import Transactions CSV"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              Upload or paste RFC 4180 CSV data with header columns.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-[11px] text-indigo-500 hover:text-indigo-400 gap-1 h-7 px-2"
            >
              <Download className="w-3 h-3" />
              Download Template
            </Button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDraggingCsv(true)
            }}
            onDragLeave={() => setIsDraggingCsv(false)}
            onDrop={handleCsvFileDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
              isDraggingCsv
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-900/40'
            }`}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Drag & drop your CSV file here, or{' '}
              <label className="text-indigo-500 hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileDrop}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Supports standard CSV format with comma-separated values.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Or Paste CSV Text
            </label>
            <textarea
              rows={4}
              value={importCsvText}
              onChange={(e) => handleCsvTextChange(e.target.value)}
              placeholder="date,transaction_type,category,amount,payment_mode,location,notes,tags&#10;2026-11-01,Expense,Food,350.0,UPI,Bangalore,Lunch,dining"
              className="w-full p-2.5 rounded-xl font-mono text-[11px] bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* 10-Row Preview Table if rows exist */}
          {csvPreviewRows.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span>Data Preview (First {csvPreviewRows.length} rows)</span>
                <span className="text-slate-400 font-normal">
                  Total lines: {importCsvText.trim().split('\n').filter(Boolean).length - 1}
                </span>
              </div>
              <div className="max-h-40 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 text-slate-400 uppercase">
                    <tr>
                      <th className="px-2 py-1.5">Date</th>
                      <th className="px-2 py-1.5">Type</th>
                      <th className="px-2 py-1.5">Category</th>
                      <th className="px-2 py-1.5 text-right">Amount</th>
                      <th className="px-2 py-1.5">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {csvPreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        <td className="px-2 py-1">{row.date || '—'}</td>
                        <td className="px-2 py-1">{row.transaction_type || '—'}</td>
                        <td className="px-2 py-1">{row.category || '—'}</td>
                        <td className="px-2 py-1 text-right">{row.amount || '—'}</td>
                        <td className="px-2 py-1">{row.payment_mode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsImportModalOpen(false)
                setImportCsvText('')
                setCsvPreviewRows([])
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={isImporting || !importCsvText.trim()}
              onClick={handleImportCSV}
            >
              {isImporting ? 'Importing...' : 'Validate & Import'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
