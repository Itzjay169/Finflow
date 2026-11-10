import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PieChart,
  Target,
  Sparkles,
  AlertTriangle,
  Plus,
  PlusCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  Trash2,
  Flame,
  Check,
} from 'lucide-react'
import {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getGoals,
  createGoal,
  contributeToGoal,
  deleteGoal,
  getRecurring,
  createRecurring,
  markRecurringPaid,
  deleteRecurring,
  getSmartInsights,
  getDailyHeatmap,
} from '../lib/api'
import { formatINR, getCurrencySymbol } from '../lib/utils'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../components/ui/Toast'
import { Card } from '../components/ui/Card'
import { Button, Badge, Modal } from '../components/ui'

const CATEGORY_OPTIONS = [
  'Food',
  'Groceries',
  'Entertainment',
  'Bills',
  'Shopping',
  'Fuel',
  'Travel',
  'Healthcare',
  'Investment',
  'Rent',
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function BudgetsPage() {
  const { preferences } = usePreferences()
  const currSymbol = getCurrencySymbol(preferences?.currency)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State
  const [billFilterHorizon, setBillFilterHorizon] = useState('all') // 'all' | '7' | '30' | '90'

  // Stable date references initialized once
  const [currentDate] = useState(() => new Date())
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Helpers to prefill modal forms based on user financial defaults
  const getInitialBudgetForm = useCallback(() => ({
    category: preferences?.default_category || 'Food',
    limit: preferences?.monthly_expense_target > 0 ? preferences.monthly_expense_target : 8000,
    month: currentMonth,
    year: currentYear,
  }), [preferences, currentMonth, currentYear])

  const getInitialGoalForm = useCallback(() => {
    const suggested =
      preferences?.monthly_income_target > 0 && preferences?.savings_rate_target > 0
        ? Math.round(preferences.monthly_income_target * (preferences.savings_rate_target / 100))
        : 5000
    return {
      title: '',
      target_amount: suggested * 10 || 50000,
      current_amount: 0,
      monthly_contribution: suggested,
      deadline: `${currentYear}-12-31`,
      category: 'Savings',
    }
  }, [preferences, currentYear])

  const getInitialRecurringForm = useCallback(() => ({
    title: '',
    amount: 1500,
    transaction_type: preferences?.default_transaction_type || 'Expense',
    category: preferences?.default_category || 'Bills',
    frequency: 'Monthly',
    next_due_date: new Date().toISOString().split('T')[0],
  }), [preferences])

  // Modals state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [budgetForm, setBudgetForm] = useState(getInitialBudgetForm)

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState(getInitialGoalForm)

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [contributeAmount, setContributeAmount] = useState(5000)

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [recurringForm, setRecurringForm] = useState(getInitialRecurringForm)

  const handleOpenBudgetModal = () => {
    setBudgetForm(getInitialBudgetForm())
    setIsBudgetModalOpen(true)
  }

  const handleOpenGoalModal = () => {
    setGoalForm(getInitialGoalForm())
    setIsGoalModalOpen(true)
  }

  const handleOpenRecurringModal = () => {
    setRecurringForm(getInitialRecurringForm())
    setIsRecurringModalOpen(true)
  }

  // --- TanStack Query Data Fetching ---
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => getBudgets(),
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => getGoals(),
  })

  const { data: recurring = [] } = useQuery({
    queryKey: ['recurringBills'],
    queryFn: () => getRecurring(),
  })

  const { data: smartData } = useQuery({
    queryKey: ['smartInsights'],
    queryFn: () => getSmartInsights(),
  })

  const { data: heatmapDataRes } = useQuery({
    queryKey: ['dailyHeatmap'],
    queryFn: () => getDailyHeatmap(120),
  })

  const smartTips = smartData?.insights || []
  const heatmapData = heatmapDataRes?.heatmap || []

  // Filtered recurring bills (Feature D)
  const filteredRecurring = recurring.filter((r) => {
    if (billFilterHorizon === 'all') return true
    const days = Number(billFilterHorizon)
    return r.days_until_due !== undefined && r.days_until_due <= days
  })

  // --- Budget Actions (Bug Fix G) ---
  const handleSaveBudget = async (e) => {
    e.preventDefault()
    try {
      await createOrUpdateBudget({
        category: budgetForm.category,
        monthly_limit: Number(budgetForm.limit),
        month: Number(budgetForm.month),
        year: Number(budgetForm.year),
      })
      toast.success(
        `Budget for ${budgetForm.category} (${MONTH_NAMES[budgetForm.month - 1]} ${budgetForm.year}) saved!`,
        'Budget Updated'
      )
      setIsBudgetModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['smartInsights'] })
    } catch (err) {
      toast.error(err.message || 'Failed to update budget')
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id)
      toast.info('Budget removed')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['smartInsights'] })
    } catch (err) {
      toast.error('Failed to delete budget: ' + err.message)
    }
  }

  // --- Recurring Actions (Feature D: "Mark as Paid") ---
  const handleCreateRecurring = async (e) => {
    e.preventDefault()
    try {
      await createRecurring({
        title: recurringForm.title,
        amount: Number(recurringForm.amount),
        transaction_type: recurringForm.transaction_type,
        category: recurringForm.category,
        frequency: recurringForm.frequency,
        next_due_date: recurringForm.next_due_date,
      })
      toast.success(`Added recurring item "${recurringForm.title}"`)
      setIsRecurringModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['recurringBills'] })
    } catch (err) {
      toast.error(err.message || 'Failed to add recurring item')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      const res = await markRecurringPaid(id)
      toast.success(
        res.message || 'Bill marked as paid! Next due date advanced and ledger updated.',
        'Payment Recorded'
      )
      queryClient.invalidateQueries({ queryKey: ['recurringBills'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    } catch (err) {
      toast.error('Failed to mark paid: ' + err.message)
    }
  }

  const handleDeleteRecurring = async (id) => {
    try {
      await deleteRecurring(id)
      queryClient.invalidateQueries({ queryKey: ['recurringBills'] })
      toast.info('Recurring item removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove recurring item')
    }
  }

  // --- Goal Actions (Feature F) ---
  const handleCreateGoal = async (e) => {
    e.preventDefault()
    try {
      // Calculate suggested monthly contribution if deadline is present
      let suggestedMonthly = Number(goalForm.monthly_contribution)
      if (goalForm.deadline) {
        const targetDate = new Date(goalForm.deadline)
        const diffMonths = Math.max(1, (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + (targetDate.getMonth() - currentDate.getMonth()))
        const remaining = Math.max(0, Number(goalForm.target_amount) - Number(goalForm.current_amount))
        suggestedMonthly = Math.round(remaining / diffMonths)
      }

      await createGoal({
        title: goalForm.title,
        target_amount: Number(goalForm.target_amount),
        current_amount: Number(goalForm.current_amount),
        monthly_contribution: suggestedMonthly,
        deadline: goalForm.deadline || undefined,
        category: goalForm.category,
      })
      toast.success(`Savings goal "${goalForm.title}" initialized!`)
      setIsGoalModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    } catch (err) {
      toast.error(err.message || 'Failed to create goal')
    }
  }

  const handleContribute = async (e) => {
    e.preventDefault()
    if (!selectedGoal) return
    try {
      await contributeToGoal(selectedGoal.id, contributeAmount)
      toast.success(`Deposited ${formatINR(contributeAmount)} to ${selectedGoal.title}!`)
      setIsContributeModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    } catch (err) {
      toast.error(err.message || 'Deposit failed')
    }
  }

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(id)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.info('Goal removed')
    } catch (err) {
      toast.error('Failed to remove goal: ' + err.message)
    }
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Budgets & Financial Goals
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track category spending caps, automated savings milestones, and upcoming recurring bills.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenRecurringModal}
            className="gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Add Bill
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenBudgetModal}
            className="gap-1.5"
          >
            <PieChart className="w-3.5 h-3.5" />
            Set Budget
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleOpenGoalModal}
            className="gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Smart Insights Banner / Algorithmic Tips */}
      {smartTips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {smartTips.slice(0, 3).map((tip, idx) => (
            <motion.div
              key={tip.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md flex items-start gap-3.5 relative overflow-hidden"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  tip.type === 'alert' || tip.type === 'warning'
                    ? 'bg-rose-500/15 text-rose-500'
                    : tip.type === 'positive'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-indigo-500/15 text-indigo-400'
                }`}
              >
                {tip.type === 'alert' || tip.type === 'warning' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : tip.type === 'positive' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {tip.title}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tip.description || tip.message}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* SECTION 1: Category Budgets (Left) & Upcoming Recurring Bills (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Category Budgets (Bug Fix G: Month/Year scope) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                Category Budgets
              </h2>
              <span className="text-[11px] text-slate-400">
                ({MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()})
              </span>
            </div>
            <button
              onClick={handleOpenBudgetModal}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adjust Limits
            </button>
          </div>

          <Card className="glass-panel border-slate-200 dark:border-slate-800 p-5 space-y-5">
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active category budgets set. Click "Set Budget" to define monthly spending caps.
              </div>
            ) : (
              budgets.map((b) => {
                const isOver = b.percentage >= 100
                const isWarning = b.percentage >= 80 && !isOver
                const remaining = Math.max(0, b.monthly_limit - b.spent)
                const barColor = isOver
                  ? 'from-rose-500 to-rose-600'
                  : isWarning
                  ? 'from-amber-400 to-amber-500'
                  : 'from-indigo-500 to-cyan-400'

                return (
                  <div key={b.id} className="space-y-2 group">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {b.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {MONTH_NAMES[(b.month || currentMonth) - 1]?.slice(0, 3)} {b.year || currentYear}
                        </span>
                        {isOver && (
                          <Badge variant="expense" size="sm">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Exceeded
                          </Badge>
                        )}
                        {isWarning && (
                          <Badge variant="warning" size="sm">
                            Near Limit
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {formatINR(b.spent)} / {formatINR(b.monthly_limit)}
                        </span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            isOver ? 'text-rose-500' : isWarning ? 'text-amber-400' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {b.percentage}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(b.id)}
                          className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(2, b.percentage))}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Remaining: <strong className={isOver ? 'text-rose-500' : 'text-emerald-500'}>{formatINR(remaining)}</strong></span>
                      <span>Target: {formatINR(b.monthly_limit)}/mo</span>
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        </div>

        {/* Right Column: Recurring Items & Bills (Feature D) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Recurring Bills
              </h2>
            </div>

            {/* Filter horizon pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px]">
              {[
                { id: 'all', label: 'All' },
                { id: '7', label: '7d' },
                { id: '30', label: '30d' },
                { id: '90', label: '90d' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setBillFilterHorizon(h.id)}
                  className={`px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                    billFilterHorizon === h.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <Card className="glass-panel border-slate-200 dark:border-slate-800 p-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRecurring.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recurring bills matching horizon.
              </div>
            ) : (
              filteredRecurring.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between group">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.frequency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Due: {item.next_due_date}</span>
                      <span className="text-indigo-400">&bull;</span>
                      <span className={item.days_until_due <= 3 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                        {item.days_until_due === 0
                          ? 'Due today!'
                          : item.days_until_due < 0
                          ? 'Overdue'
                          : `in ${item.days_until_due} days`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {formatINR(item.amount)}
                    </span>

                    {/* Feature D: Mark as paid button */}
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(item.id)}
                      title="Mark as paid (records transaction and advances due date)"
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      Paid
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecurring(item.id)}
                      className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* SECTION 2: Savings Goals (Feature F: Automated Milestones & Contributions) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Automated Savings Goals & Milestones
            </h2>
            <p className="text-xs text-slate-500">
              Track capital targets, automatic monthly contributions, and projected completion dates.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenGoalModal}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Create Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goals.map((g) => {
            const circumference = 2 * Math.PI * 34
            const strokeDashoffset = circumference - (Math.min(100, g.percentage) / 100) * circumference
            const remainingAmt = Math.max(0, g.target_amount - g.current_amount)

            return (
              <Card
                key={g.id}
                className="glass-panel border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="violet" size="sm">
                      {g.category || 'Savings'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {g.title}
                    </h3>
                    {g.deadline && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Target date: {g.deadline}
                      </p>
                    )}
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="py-2 flex items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          stroke="currentColor"
                          strokeWidth="7"
                          className="text-slate-100 dark:text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          stroke="currentColor"
                          strokeWidth="7"
                          className="text-emerald-500 transition-all duration-1000 ease-out"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {g.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-center">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(g.current_amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Goal: {formatINR(g.target_amount)} &bull; Left: {formatINR(remainingAmt)}
                    </div>
                    {g.monthly_contribution > 0 && (
                      <div className="text-[10px] text-indigo-500 font-semibold pt-0.5">
                        Pace: {formatINR(g.monthly_contribution)}/mo
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5 cursor-pointer"
                    onClick={() => {
                      setSelectedGoal(g)
                      setContributeAmount(5000)
                      setIsContributeModalOpen(true)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    Deposit Funds
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* SECTION 3: GitHub-Style Spending Calendar Heatmap */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Daily Spending Heatmap (120 Days Activity)
            </h2>
            <p className="text-xs text-slate-500">
              Activity calendar visualizing daily cash outflows and transaction frequency.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-800" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-950/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <span>More</span>
          </div>
        </div>

        <Card className="glass-panel border-slate-200 dark:border-slate-800 p-5 overflow-x-auto">
          <div className="min-w-[650px]">
            <div className="flex flex-wrap gap-1.5">
              {heatmapData.map((d) => {
                const colors = [
                  'bg-slate-200/70 dark:bg-slate-800/70 hover:border-slate-400',
                  'bg-indigo-950/80 border border-indigo-900 hover:border-indigo-400',
                  'bg-indigo-700 hover:border-indigo-300',
                  'bg-indigo-500 shadow-sm shadow-indigo-500/20 hover:border-indigo-200',
                  'bg-cyan-400 shadow-sm shadow-cyan-400/30 hover:border-cyan-100',
                ]

                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${formatINR(d.amount)} (${d.count} transactions)`}
                    className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-transform hover:scale-125 ${
                      colors[d.level]
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* --- MODALS --- */}

      {/* Set Budget Modal (Bug Fix G: month/year selector) */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Set Category Monthly Budget"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Expense Category
            </label>
            <select
              value={budgetForm.category}
              onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Month
              </label>
              <select
                value={budgetForm.month}
                onChange={(e) => setBudgetForm({ ...budgetForm, month: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Year
              </label>
              <input
                type="number"
                min="2020"
                max="2035"
                value={budgetForm.year}
                onChange={(e) => setBudgetForm({ ...budgetForm, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Spending Limit ({currSymbol})
            </label>
            <input
              type="number"
              min="100"
              step="500"
              required
              value={budgetForm.limit}
              onChange={(e) => setBudgetForm({ ...budgetForm, limit: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit">
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Create Automated Savings Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dream Trip to Japan, Emergency Reserve"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Amount ({currSymbol})
              </label>
              <input
                type="number"
                min="1000"
                required
                value={goalForm.target_amount}
                onChange={(e) => setGoalForm({ ...goalForm, target_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Starting Amount ({currSymbol})
              </label>
              <input
                type="number"
                min="0"
                value={goalForm.current_amount}
                onChange={(e) => setGoalForm({ ...goalForm, current_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Deadline
              </label>
              <input
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <input
                type="text"
                placeholder="Travel, Tech, Emergency..."
                value={goalForm.category}
                onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit">
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribute Funds Modal */}
      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Deposit Funds to ${selectedGoal?.title || 'Goal'}`}
      >
        <form onSubmit={handleContribute} className="space-y-4 text-left">
          <p className="text-xs text-slate-500">
            Currently saved: <strong>{formatINR(selectedGoal?.current_amount || 0)}</strong> of{' '}
            <strong>{formatINR(selectedGoal?.target_amount || 0)}</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contribution Amount ({currSymbol})
            </label>
            <input
              type="number"
              min="100"
              required
              value={contributeAmount}
              onChange={(e) => setContributeAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
            />
          </div>

          <div className="flex gap-2">
            {[1000, 5000, 10000, 25000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setContributeAmount(amt)}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                +{currSymbol}{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsContributeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit">
              Deposit Funds
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Recurring Bill Modal */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        title="Add Recurring Bill or Inflow"
      >
        <form onSubmit={handleCreateRecurring} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Title / Vendor
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Bill, Gym Membership, Netflix"
              value={recurringForm.title}
              onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount ({currSymbol})
              </label>
              <input
                type="number"
                min="10"
                required
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm({ ...recurringForm, amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Type
              </label>
              <select
                value={recurringForm.transaction_type}
                onChange={(e) => setRecurringForm({ ...recurringForm, transaction_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Next Due Date
              </label>
              <input
                type="date"
                required
                value={recurringForm.next_due_date}
                onChange={(e) => setRecurringForm({ ...recurringForm, next_due_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={recurringForm.category}
                onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Frequency
            </label>
            <select
              value={recurringForm.frequency}
              onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsRecurringModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit">
              Save Recurring Bill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
