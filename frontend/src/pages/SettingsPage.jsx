import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Palette,
  DollarSign,
  Download,
  Trash2,
  Check,
  Shield,
  Moon,
  Sun,
  Laptop,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { getUserProfile, updateUserProfile, exportTransactionsCsv } from '../lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { Button, Badge, Modal } from '../components/ui'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

const ACCENT_COLORS = [
  { name: 'Indigo', class: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { name: 'Purple', class: 'bg-purple-600', ring: 'ring-purple-500' },
  { name: 'Cyan', class: 'bg-cyan-500', ring: 'ring-cyan-400' },
  { name: 'Emerald', class: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { name: 'Rose', class: 'bg-rose-500', ring: 'ring-rose-400' },
  { name: 'Amber', class: 'bg-amber-500', ring: 'ring-amber-400' },
]

export default function SettingsPage() {
  const { user, isDemo, signOut } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState('Alex Mercer')
  const [currency, setCurrency] = useState('INR')
  const [themePref, setThemePref] = useState('dark')
  const [accentColor, setAccentColor] = useState('indigo')
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await getUserProfile()
        if (prof) {
          if (prof.full_name) setFullName(prof.full_name)
          if (prof.currency) setCurrency(prof.currency)
          if (prof.theme_preference) setThemePref(prof.theme_preference)
          if (prof.accent_color) setAccentColor(prof.accent_color)
        }
      } catch (err) {
        console.warn('Profile load fallback:', err)
      }
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateUserProfile({
        full_name: fullName,
        currency,
        theme_preference: themePref,
        accent_color: accentColor,
      })
      toast.success('Settings and profile updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPDF = () => {
    setIsExporting(true)
    // Print-friendly report dialog or generate download
    setTimeout(() => {
      window.print()
      setIsExporting(false)
      toast.success('Monthly summary print / PDF report initialized!')
    }, 500)
  }

  const handleExportCSV = async () => {
    try {
      const csvData = await exportTransactionsCsv()
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `FinFlow_Export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Transactions exported to CSV!')
    } catch (err) {
      toast.error('Failed to export CSV')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Account & Application Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your display preferences, currency standards, and account data exports.
            </p>
          </div>
        </div>

        {isDemo && (
          <Badge variant="warning" size="md">
            Demo Account Active
          </Badge>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <Card className="glass-panel border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <User className="w-4 h-4 text-indigo-500" />
            Profile Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'demo@finflow.app'}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300/50 dark:border-slate-800/50 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Currency & Locale */}
        <Card className="glass-panel border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Currency & Regional Formatting
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CURRENCIES.map((c) => {
              const isSelected = currency === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-900/40'
                  }`}
                >
                  <span className="font-mono text-xl font-black block text-indigo-400">
                    {c.symbol}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mt-1">
                    {c.code}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{c.name}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Appearance & Accent Color */}
        <Card className="glass-panel border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Palette className="w-4 h-4 text-purple-400" />
            Theme & Color Palette
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Color Accent
              </label>
              <div className="flex items-center gap-3">
                {ACCENT_COLORS.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => setAccentColor(a.name.toLowerCase())}
                    className={`w-9 h-9 rounded-xl ${a.class} flex items-center justify-center text-white transition-transform hover:scale-110 cursor-pointer ${
                      accentColor === a.name.toLowerCase() ? `ring-2 ring-offset-2 ${a.ring}` : ''
                    }`}
                  >
                    {accentColor === a.name.toLowerCase() && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Data Exports */}
        <Card className="glass-panel border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Download className="w-4 h-4 text-cyan-400" />
            Reports & Data Portability
          </div>
          <p className="text-xs text-slate-500">
            Export complete financial data, transaction histories, and printable PDF statements.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="outline"
              type="button"
              onClick={handleExportCSV}
              className="gap-2 text-xs"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Export Transactions (CSV)
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleExportPDF}
              className="gap-2 text-xs"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              Generate Monthly Report (PDF)
            </Button>
          </div>
        </Card>

        {/* Save Changes Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="gradient" type="submit" disabled={isSaving} className="gap-2 px-6">
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving Preferences...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="glass-panel border-rose-500/20 p-6 space-y-4 bg-rose-500/5">
        <div className="flex items-center gap-2 text-base font-bold text-rose-500">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </div>
        <p className="text-xs text-slate-500">
          Resetting will clear custom transaction entries or end your current session.
        </p>

        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Demo Account & Session
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Reset Account & Session"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Are you sure you want to reset your local data? This will sign you out and return you to the welcome screen.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setIsDeleteModalOpen(false)
                await signOut()
                window.location.href = '/'
              }}
            >
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
