import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Modal, Input, Button } from '../ui'
import { createTransaction, checkPotentialDuplicate } from '../../lib/api'
import { useToast } from '../ui/Toast'
import { usePreferences } from '../../context/PreferencesContext'
import { formatCurrency, getCurrencySymbol } from '../../lib/utils'
import {
  Sparkles,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Paperclip,
  Tag,
  AlertTriangle,
} from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Rent',
  'Travel',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Bills',
  'Fuel',
  'Education',
]

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Rental',
  'Bonus',
  'Other',
]

const PAYMENT_MODES = [
  'UPI',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
]

const LOCATIONS = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Pune',
  'Kolkata',
  'Chennai',
  'Hyderabad',
  'Ahmedabad',
  'Jaipur',
  'Bhubaneswar',
]

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast()
  const { preferences } = usePreferences() || {}
  const currencySymbol = getCurrencySymbol(preferences?.currency)
  const todayStr = new Date().toISOString().split('T')[0]

  const getInitialForm = () => ({
    amount: '',
    type: preferences?.default_transaction_type || 'Expense',
    category: preferences?.default_category || (preferences?.default_transaction_type === 'Income' ? 'Salary' : 'Food'),
    payment_mode: preferences?.default_payment_mode || 'UPI',
    location: preferences?.default_location || 'Mumbai',
    date: todayStr,
    description: '',
    tags: '',
    attachment_url: '',
  })

  const [formData, setFormData] = useState(getInitialForm)
  const [submitting, setSubmitting] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialForm())
      setDuplicateWarning(null)
      setError('')
    }
  }, [isOpen, preferences])

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'Income' ? 'Salary' : 'Food',
    }))
  }

  const handleSubmit = async (e, bypassDuplicate = false) => {
    if (e) e.preventDefault()
    setError('')

    const numAmount = parseFloat(formData.amount)
    if (!numAmount || numAmount <= 0) {
      setError(`Please enter a valid amount greater than ${currencySymbol}0`)
      return
    }

    // Check for potential duplicate if not already confirmed
    if (!bypassDuplicate && !duplicateWarning) {
      try {
        const dupRes = await checkPotentialDuplicate({
          amount: numAmount,
          date: formData.date,
          category: formData.category,
        })
        if (dupRes?.is_duplicate) {
          setDuplicateWarning({
            count: dupRes.match_count || 1,
            amount: numAmount,
            date: formData.date,
            category: formData.category,
          })
          return
        }
      } catch (_) {
        // Continue if duplicate check fails
      }
    }

    try {
      setSubmitting(true)
      const res = await createTransaction({
        amount: numAmount,
        transaction_type: formData.type,
        category: formData.category,
        payment_mode: formData.payment_mode,
        location: formData.location,
        date: formData.date,
        notes: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        attachment_url: formData.attachment_url ? formData.attachment_url.trim() : undefined,
      })

      // Trigger celebratory confetti burst if enabled
      if (preferences?.enable_confetti !== false) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#6366f1', '#10b981', '#06b6d4', '#ec4899'],
        })
      }

      toast.success(
        `Added ${formData.type} of ${formatCurrency(numAmount, preferences?.currency)}`,
        'Transaction Recorded'
      )

      if (onSuccess) onSuccess(res)
      handleClose()
    } catch (err) {
      setError(err.message || 'Failed to record transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setDuplicateWarning(null)
    setError('')
    setFormData(getInitialForm())
    onClose()
  }

  const categoryList =
    formData.type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record New Transaction"
      description="Add an income deposit or expense payout to your telemetry ledger"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-left">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Potential Duplicate Detected</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              A transaction of <strong>{formatCurrency(duplicateWarning.amount, preferences?.currency)}</strong> on <strong>{duplicateWarning.date}</strong> in <strong>{duplicateWarning.category}</strong> already exists. Would you like to record this anyway?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDuplicateWarning(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="warning"
                onClick={() => handleSubmit(null, true)}
                isLoading={submitting}
              >
                Yes, Record Duplicate
              </Button>
            </div>
          </div>
        )}

        {/* Type Selector Sliding Pill Toggle */}
        <div className="relative flex rounded-2xl bg-slate-200/80 dark:bg-slate-900/90 p-1 border border-slate-300/80 dark:border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => handleTypeChange('Expense')}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none z-10 flex items-center justify-center gap-1.5 active:scale-98 ${
              formData.type === 'Expense' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'
            }`}
          >
            {formData.type === 'Expense' && (
              <motion.div
                layoutId="addTxModalTypePill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 shadow-[0_2px_14px_rgba(244,63,94,0.45)] border border-rose-400/30 z-[-1]"
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
            <TrendingDown className="w-3.5 h-3.5" />
            Expense Outflow
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('Income')}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none z-10 flex items-center justify-center gap-1.5 active:scale-98 ${
              formData.type === 'Income' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400'
            }`}
          >
            {formData.type === 'Income' && (
              <motion.div
                layoutId="addTxModalTypePill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-[0_2px_14px_rgba(16,185,129,0.45)] border border-emerald-400/30 z-[-1]"
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
            <TrendingUp className="w-3.5 h-3.5" />
            Income Inflow
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Amount ({preferences?.currency || 'INR'}) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 2400"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Category & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {categoryList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-100 dark:bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              value={formData.payment_mode}
              onChange={(e) =>
                setFormData({ ...formData, payment_mode: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {PAYMENT_MODES.map((pm) => (
                <option key={pm} value={pm} className="bg-slate-100 dark:bg-slate-900">
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-100 dark:bg-slate-900">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tags & Receipt URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. food, weekend, work"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Paperclip className="w-3 h-3 text-cyan-400" />
              Receipt URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.attachment_url}
              onChange={(e) =>
                setFormData({ ...formData, attachment_url: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Merchant (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Swiggy lunch order, Client invoice #4"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            isLoading={submitting}
            className="gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Save Transaction
          </Button>
        </div>
      </form>
    </Modal>
  )
}
