import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart,
  Target,
  Calendar,
  Sparkles,
  AlertTriangle,
  Plus,
  PlusCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  DollarSign,
  ChevronRight,
  CreditCard,
  Zap,
  Trash2,
  Flame,
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
  deleteRecurring,
  getSmartInsights,
  getDailyHeatmap,
} from '../lib/api'
import { formatINR } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { Button, Badge, Modal, Input } from '../components/ui'

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

export default function BudgetsPage() {
  const { toast } = useToast()

  // State
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [recurring, setRecurring] = useState([])
  const [smartTips, setSmartTips] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [maxHeatmapAmt, setMaxHeatmapAmt] = useState(1)
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ category: 'Food', limit: 8000 })

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState({
    title: '',
    target_amount: 50000,
    current_amount: 5000,
    deadline: '2026-12-31',
    category: 'Savings',
  })

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [contributeAmount, setContributeAmount] = useState(5000)

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    amount: 1500,
    transaction_type: 'Expense',
    category: 'Bills',
    frequency: 'Monthly',
    next_due_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [bData, gData, rData, iData, hData] = await Promise.all([
        getBudgets(),
        getGoals(),
        getRecurring(),
        getSmartInsights(),
        getDailyHeatmap(120),
      ])
      setBudgets(bData || [])
      setGoals(gData || [])
      setRecurring(rData || [])
      setSmartTips(iData?.insights || [])
      setHeatmapData(hData?.heatmap || [])
      setMaxHeatmapAmt(hData?.max_amount || 1)
    } catch (err) {
      console.error('Error loading budgets data:', err)
      toast.error('Failed to load budget and goal metrics')
    } finally {
      setLoading(false)
    }
  }

  // --- Budget Actions ---
  const handleSaveBudget = async (e) => {
    e.preventDefault()
    try {
      const now = new Date()
      await createOrUpdateBudget({
        category: budgetForm.category,
        monthly_limit: Number(budgetForm.limit),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
      toast.success(`Budget for ${budgetForm.category} updated successfully!`)
      setIsBudgetModalOpen(false)
      const updated = await getBudgets()
      setBudgets(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to update budget')
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id)
      setBudgets((prev) => prev.filter((b) => b.id !== id))
      toast.success('Budget removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove budget')
    }
  }

  // --- Goal Actions ---
  const handleCreateGoal = async (e) => {
    e.preventDefault()
    try {
      await createGoal({
        title: goalForm.title,
        target_amount: Number(goalForm.target_amount),
        current_amount: Number(goalForm.current_amount || 0),
        deadline: goalForm.deadline,
        category: goalForm.category,
      })
      toast.success(`Savings goal "${goalForm.title}" created!`)
      setIsGoalModalOpen(false)
      const updated = await getGoals()
      setGoals(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to create goal')
    }
  }

  const handleContribute = async (e) => {
    e.preventDefault()
    if (!selectedGoal) return
    try {
      await contributeToGoal(selectedGoal.id, Number(contributeAmount))
      toast.success(`Contributed ${formatINR(contributeAmount)} to ${selectedGoal.title}!`)
      setIsContributeModalOpen(false)
      const updated = await getGoals()
      setGoals(updated)
    } catch (err) {
      toast.error(err.message || 'Contribution failed')
    }
  }

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(id)
      setGoals((prev) => prev.filter((g) => g.id !== id))
      toast.success('Goal deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete goal')
    }
  }

  // --- Recurring Actions ---
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
      const updated = await getRecurring()
      setRecurring(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to add recurring item')
    }
  }

  const handleDeleteRecurring = async (id) => {
    try {
      await deleteRecurring(id)
      setRecurring((prev) => prev.filter((r) => r.id !== id))
      toast.success('Recurring item removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove recurring item')
    }
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
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
            onClick={() => setIsRecurringModalOpen(true)}
            className="gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Add Bill
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBudgetModalOpen(true)}
            className="gap-1.5"
          >
            <PieChart className="w-3.5 h-3.5" />
            Set Budget
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
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
                  tip.type === 'alert'
                    ? 'bg-rose-500/15 text-rose-500'
                    : tip.type === 'positive'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-indigo-500/15 text-indigo-400'
                }`}
              >
                {tip.type === 'alert' ? (
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
                  {tip.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* SECTION 1: Category Budgets (Left) & Upcoming Recurring Bills (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Category Budgets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Monthly Category Budgets
            </h2>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adjust Limits
            </button>
          </div>

          <Card className="glass-panel border-slate-200 dark:border-slate-800 p-5 space-y-5">
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active category budgets set. Click "Set Budget" to define spending caps.
              </div>
            ) : (
              budgets.map((b) => {
                const isOver = b.percentage >= 100
                const isWarning = b.percentage >= 80 && !isOver
                const barColor = isOver
                  ? 'from-rose-500 to-rose-600'
                  : isWarning
                  ? 'from-amber-400 to-amber-500'
                  : 'from-indigo-500 to-cyan-400'

                return (
                  <div key={b.id} className="space-y-1.5 group">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {b.category}
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
                            isOver ? 'text-rose-500' : isWarning ? 'text-amber-400' : 'text-slate-300'
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
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(2, b.percentage))}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        </div>

        {/* Right Column: Recurring Items & Bills (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Upcoming Bills & Recurring
            </h2>
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="text-xs font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bill
            </button>
          </div>

          <Card className="glass-panel border-slate-200 dark:border-slate-800 p-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {recurring.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recurring bills recorded.
              </div>
            ) : (
              recurring.map((item) => (
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
                      <span className={item.days_until_due <= 3 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
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

      {/* SECTION 2: Savings Goals (Cards with Circular Progress) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Automated Savings Goals
            </h2>
            <p className="text-xs text-slate-500">
              Track multi-month capital targets, milestones, and fund allocations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Create Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goals.map((g) => {
            const isCompleted = g.percentage >= 100
            const circumference = 2 * Math.PI * 34
            const strokeDashoffset = circumference - (Math.min(100, g.percentage) / 100) * circumference

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

                  <div className="space-y-0.5 text-center">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(g.current_amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Goal: {formatINR(g.target_amount)}
                    </div>
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
                    Add Funds
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
              GitHub-style activity calendar visualizing daily cash outflows and frequency.
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
            {/* Heatmap grid */}
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

      {/* Set Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Set Category Monthly Budget"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Limit (₹)
            </label>
            <input
              type="number"
              min="100"
              step="500"
              required
              value={budgetForm.limit}
              onChange={(e) => setBudgetForm({ ...budgetForm, limit: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
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
        title="Create Savings Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dream Trip to Japan"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Amount (₹)
              </label>
              <input
                type="number"
                min="1000"
                required
                value={goalForm.target_amount}
                onChange={(e) => setGoalForm({ ...goalForm, target_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Starting Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={goalForm.current_amount}
                onChange={(e) => setGoalForm({ ...goalForm, current_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
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
                placeholder="Travel, Tech, Car..."
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
        title={`Add Funds to ${selectedGoal?.title || 'Goal'}`}
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <p className="text-xs text-slate-500">
            Currently saved: {formatINR(selectedGoal?.current_amount || 0)} of{' '}
            {formatINR(selectedGoal?.target_amount || 0)}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contribution Amount (₹)
            </label>
            <input
              type="number"
              min="100"
              required
              value={contributeAmount}
              onChange={(e) => setContributeAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="flex gap-2">
            {[1000, 5000, 10000, 25000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setContributeAmount(amt)}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-600 dark:text-slate-300"
              >
                +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
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
        <form onSubmit={handleCreateRecurring} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Title / Vendor
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Bill, Gym Membership"
              value={recurringForm.title}
              onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                min="10"
                required
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm({ ...recurringForm, amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Type
              </label>
              <div className="relative p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex">
                <button
                  type="button"
                  onClick={() => setRecurringForm({ ...recurringForm, transaction_type: 'Expense' })}
                  className={`relative flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors z-10 cursor-pointer ${
                    recurringForm.transaction_type === 'Expense'
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {recurringForm.transaction_type === 'Expense' && (
                    <motion.div
                      layoutId="recurringTxTypePill"
                      className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg shadow-md shadow-rose-500/25 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setRecurringForm({ ...recurringForm, transaction_type: 'Income' })}
                  className={`relative flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors z-10 cursor-pointer ${
                    recurringForm.transaction_type === 'Income'
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {recurringForm.transaction_type === 'Income' && (
                    <motion.div
                      layoutId="recurringTxTypePill"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md shadow-emerald-500/25 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  Income
                </button>
              </div>
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
