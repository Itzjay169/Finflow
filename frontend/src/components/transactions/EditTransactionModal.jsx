import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Modal, Button } from '../ui'
import { updateTransaction } from '../../lib/api'
import { useToast } from '../ui/Toast'
import { usePreferences } from '../../context/PreferencesContext'
import { getCurrencySymbol } from '../../lib/utils'
import { Save, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

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

export const EditTransactionModal = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const { toast } = useToast()
  const { preferences } = usePreferences() || {}
  const currencySymbol = getCurrencySymbol(preferences?.currency)

  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'Expense',
    category: 'Food',
    payment_mode: 'UPI',
    location: 'Mumbai',
    date: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount || '',
        transaction_type: transaction.transaction_type || transaction.type || 'Expense',
        category: transaction.category || 'Food',
        payment_mode: transaction.payment_mode || 'UPI',
        location: transaction.location || 'Mumbai',
        date: transaction.date || '',
        notes: transaction.notes || '',
      })
      setError('')
    }
  }, [transaction])

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      transaction_type: newType,
      category: newType === 'Income' ? 'Salary' : 'Food',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(formData.amount)
    if (!numAmount || numAmount <= 0) {
      setError(`Please enter a valid amount greater than ${currencySymbol}0`)
      return
    }

    try {
      setSubmitting(true)
      const res = await updateTransaction(transaction.id, {
        amount: numAmount,
        transaction_type: formData.transaction_type,
        category: formData.category,
        payment_mode: formData.payment_mode,
        location: formData.location,
        date: formData.date,
        notes: formData.notes || undefined,
      })

      toast.success('Transaction updated successfully', 'Ledger Updated')
      if (onSuccess) onSuccess(res)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryList =
    formData.transaction_type === 'Income'
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Transaction"
      description="Modify transaction attributes and recalculate financial summaries"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Type Selector Sliding Pill Toggle */}
        <div className="relative flex rounded-2xl bg-slate-200/80 dark:bg-slate-900/90 p-1 border border-slate-300/80 dark:border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => handleTypeChange('Expense')}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none z-10 flex items-center justify-center gap-1.5 active:scale-98 ${
              formData.transaction_type === 'Expense' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'
            }`}
          >
            {formData.transaction_type === 'Expense' && (
              <motion.div
                layoutId="editTxModalTypePill"
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
              formData.transaction_type === 'Income' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400'
            }`}
          >
            {formData.transaction_type === 'Income' && (
              <motion.div
                layoutId="editTxModalTypePill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-[0_2px_14px_rgba(16,185,129,0.45)] border border-emerald-400/30 z-[-1]"
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
            <TrendingUp className="w-3.5 h-3.5" />
            Income Inflow
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Category & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {categoryList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              value={formData.payment_mode}
              onChange={(e) =>
                setFormData({ ...formData, payment_mode: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {PAYMENT_MODES.map((pm) => (
                <option key={pm} value={pm} className="bg-slate-900">
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Notes / Merchant
          </label>
          <input
            type="text"
            placeholder="e.g. Electricity bill, Freelance retainer"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            isLoading={submitting}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            Update Record
          </Button>
        </div>
      </form>
    </Modal>
  )
}
