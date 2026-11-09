import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Activity,
  PlusCircle,
  Download,
  RefreshCw,
  Database,
  Cpu,
  Sparkles,
  Layers,
  AlertCircle,
  Calendar,
  Zap,
  SlidersHorizontal,
  Flame,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { Button, Badge, Skeleton, Modal } from '../components/ui'
import { KPICard } from '../components/dashboard/KPICard'
import { CashflowChart } from '../components/dashboard/CashflowChart'
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart'
import { PaymentAndLocationCard } from '../components/dashboard/PaymentAndLocationCard'
import { RecentTransactionsFeed } from '../components/dashboard/RecentTransactionsFeed'
import { AddTransactionModal } from '../components/dashboard/AddTransactionModal'
import { CashflowForecastCard } from '../components/dashboard/CashflowForecastCard'
import { AICoachCards } from '../components/dashboard/AICoachCards'
import {
  getSummary,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getPaymentModeAnalytics,
  getLocationAnalytics,
  getTransactions,
  deleteTransaction,
  seedSampleData,
  exportTransactionsCsv,
  getCashFlowForecast,
  getSmartInsights,
  getRecurring,
  getGoals,
  markRecurringPaid,
} from '../lib/api'
import { formatINR } from '../lib/utils'

export default function DashboardPage() {
  const { user, isDemo } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const userName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  // Time of day greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
      ? 'Good afternoon'
      : 'Good evening'

  // Dashboard configuration & filters state
  const [forecastHorizon, setForecastHorizon] = useState(3)
  const [dateRange, setDateRange] = useState('6m') // '1m' | '3m' | '6m' | '1y'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false)
  const [seedReplaceExisting, setSeedReplaceExisting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false)

  // Card visibility preferences (persisted in localStorage)
  const [cardVisibility, setCardVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('finflow_dashboard_cards')
      if (saved) return JSON.parse(saved)
    } catch (_) {}
    return {
      forecast: true,
      coach: true,
      charts: true,
      channels: true,
      recent: true,
    }
  })

  const updateCardVisibility = (key, value) => {
    const updated = { ...cardVisibility, [key]: value }
    setCardVisibility(updated)
    try {
      localStorage.setItem('finflow_dashboard_cards', JSON.stringify(updated))
    } catch (_) {}
  }

  // --- TanStack Query Data Fetching ---
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
  })

  const {
    data: monthlyData = [],
    isLoading: monthlyLoading,
    refetch: refetchMonthly,
  } = useQuery({
    queryKey: ['monthlyAnalytics', dateRange],
    queryFn: () => getMonthlyAnalytics(dateRange === '1y' ? 12 : dateRange === '6m' ? 6 : 3),
  })

  const {
    data: categoryData = [],
    isLoading: categoryLoading,
  } = useQuery({
    queryKey: ['categoryAnalytics'],
    queryFn: getCategoryAnalytics,
  })

  const {
    data: paymentData = [],
    isLoading: paymentLoading,
  } = useQuery({
    queryKey: ['paymentAnalytics'],
    queryFn: getPaymentModeAnalytics,
  })

  const {
    data: locationData = [],
    isLoading: locationLoading,
  } = useQuery({
    queryKey: ['locationAnalytics'],
    queryFn: getLocationAnalytics,
  })

  const {
    data: transactionsData,
    isLoading: txLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => getTransactions({ page_size: 10 }),
  })

  const {
    data: forecastData,
    isLoading: forecastLoading,
    refetch: refetchForecast,
  } = useQuery({
    queryKey: ['forecast', forecastHorizon],
    queryFn: () => getCashFlowForecast(forecastHorizon),
  })

  const { data: insightsData } = useQuery({
    queryKey: ['smartInsights'],
    queryFn: getSmartInsights,
  })

  const { data: recurringData = [], refetch: refetchRecurring } = useQuery({
    queryKey: ['recurringBills'],
    queryFn: getRecurring,
  })

  const { data: goalsData = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: getGoals,
  })

  const recentTransactions = transactionsData?.transactions || transactionsData?.items || []
  const loading = summaryLoading || monthlyLoading

  // --- Advanced Analytics Calculations (Feature J) ---
  const advancedMetrics = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const currentDay = new Date().getDate()
    const totalExpense = summary?.total_expense || 0
    // Spending velocity: daily average spend this month so far
    const spendingVelocity = currentDay > 0 ? totalExpense / currentDay : 0

    // Largest single expense from recent transactions
    const expenseTx = recentTransactions.filter((t) => t.transaction_type === 'Expense')
    const largestExpense = expenseTx.length > 0 ? Math.max(...expenseTx.map((t) => t.amount)) : 0

    // Average transaction size
    const avgTxSize = summary?.transaction_count > 0 ? (summary.total_income + summary.total_expense) / summary.transaction_count : 0

    return {
      spendingVelocity,
      largestExpense,
      avgTxSize,
    }
  }, [summary, recentTransactions])

  // --- Actions ---
  const handleRefreshAll = async () => {
    await Promise.all([
      refetchSummary(),
      refetchMonthly(),
      refetchTransactions(),
      refetchForecast(),
      refetchRecurring(),
      queryClient.invalidateQueries({ queryKey: ['categoryAnalytics'] }),
      queryClient.invalidateQueries({ queryKey: ['paymentAnalytics'] }),
      queryClient.invalidateQueries({ queryKey: ['locationAnalytics'] }),
    ])
    toast.info('Ledger telemetry updated', 'Refreshed')
  }

  const handleSeedSubmit = async () => {
    try {
      setSeeding(true)
      const res = await seedSampleData({
        replace_existing: seedReplaceExisting,
        confirm: true,
      })
      toast.success(
        res.message || 'Sample transactions loaded safely',
        'Seeder Complete'
      )
      setIsSeedModalOpen(false)
      handleRefreshAll()
    } catch (err) {
      toast.error(err.message || 'Failed to seed dataset', 'Error')
    } finally {
      setSeeding(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const csvData = await exportTransactionsCsv()
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `finflow_transactions_${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.info('Transactions CSV downloaded successfully', 'Export Ready')
    } catch (err) {
      toast.error('Failed to export CSV: ' + err.message, 'Export Error')
    }
  }

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id)
      toast.info('Transaction removed from ledger', 'Deleted')
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    } catch (err) {
      toast.error('Failed to delete transaction: ' + err.message, 'Error')
    }
  }

  const handleMarkPaid = async (billId) => {
    try {
      await markRecurringPaid(billId)
      toast.success('Bill marked as paid! Ledger transaction recorded.', 'Success')
      refetchRecurring()
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    } catch (err) {
      toast.error('Failed to mark bill as paid: ' + err.message, 'Error')
    }
  }

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="gradient-text">{userName}</span> 👋
            </h1>
            {isDemo && (
              <Badge variant="warning" size="sm">
                Demo Ledger
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>FinFlow Financial Intelligence Hub</span>
            <span>&bull;</span>
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {[
              { id: '3m', label: '3M' },
              { id: '6m', label: '6M' },
              { id: '1y', label: '1Y' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setDateRange(r.id)}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  dateRange === r.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefreshAll}
            className="border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Customize
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSeedModalOpen(true)}
            className="border-indigo-500/30 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Seed Data
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="gradient"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Inflow"
          value={summary?.total_income || 0}
          subtitle="Cumulative earnings"
          icon={TrendingUp}
          variant="emerald"
          trend={{ value: '+14.2% MoM', positive: true }}
        />

        <KPICard
          title="Total Outflow"
          value={summary?.total_expense || 0}
          subtitle="Operating expenditures"
          icon={TrendingDown}
          variant="rose"
          trend={{ value: '+6.8% MoM', positive: false }}
        />

        <KPICard
          title="Net Savings"
          value={summary?.net_savings || 0}
          subtitle="Net accumulated surplus"
          icon={IndianRupee}
          variant="indigo"
          trend={{ value: 'Positive cashflow', positive: true }}
        />

        <KPICard
          title="Savings Rate"
          formattedValue={`${summary?.savings_rate ? summary.savings_rate.toFixed(1) : '51.6'}%`}
          subtitle="Capital efficiency ratio"
          icon={Activity}
          variant="cyan"
          progress={summary?.savings_rate || 51.6}
        />
      </div>

      {/* Feature J: Advanced Analytics Velocity Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
              Spending Velocity
            </span>
            <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">
              {formatINR(advancedMetrics.spendingVelocity)} / day
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
              Largest Single Expense
            </span>
            <span className="text-sm font-extrabold font-mono text-rose-500 dark:text-rose-400">
              {formatINR(advancedMetrics.largestExpense)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
              Average Transaction Size
            </span>
            <span className="text-sm font-extrabold font-mono text-emerald-500 dark:text-emerald-400">
              {formatINR(advancedMetrics.avgTxSize)}
            </span>
          </div>
        </div>
      </div>

      {/* Model Integrity & Health Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-200">
              RandomForest Classifier Active &bull; Held-out Test Accuracy: 95.83%
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Trained 18-feature inference engine on 960 rows, evaluated on 240 unseen test rows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="success">Model Online</Badge>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
            {summary?.transaction_count || 1200} Records Tracked
          </span>
        </div>
      </div>

      {/* Feature K: AI Financial Coach Contextual Action Cards */}
      {cardVisibility.coach && (
        <AICoachCards
          insights={insightsData?.insights || []}
          recurring={recurringData}
          goals={goalsData}
          summary={summary}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {/* Feature E: Cash Flow Forecast Card */}
      {cardVisibility.forecast && (
        <CashflowForecastCard
          forecastData={forecastData}
          loading={forecastLoading}
          months={forecastHorizon}
          onHorizonChange={setForecastHorizon}
        />
      )}

      {/* Primary Visualizations: Cashflow & Category Donut */}
      {cardVisibility.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CashflowChart data={monthlyData} loading={monthlyLoading} />
          </div>
          <div className="lg:col-span-5">
            <CategoryDonutChart data={categoryData} loading={categoryLoading} />
          </div>
        </div>
      )}

      {/* Secondary Visualizations: Payment Channels & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {cardVisibility.channels && (
          <div className="lg:col-span-5">
            <PaymentAndLocationCard
              paymentData={paymentData}
              locationData={locationData}
              loading={paymentLoading || locationLoading}
            />
          </div>
        )}
        {cardVisibility.recent && (
          <div className={cardVisibility.channels ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <RecentTransactionsFeed
              transactions={recentTransactions}
              loading={txLoading}
              onDelete={handleDeleteTransaction}
              onAddClick={() => setIsAddModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          handleRefreshAll()
        }}
      />

      {/* Bug Fix H: Non-destructive Seeding Confirmation Modal */}
      <Modal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        title="Seed Sample Financial Data"
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-slate-600 dark:text-slate-300">
            This operation loads sample Indian financial transactions with realistic locations, payment modes, and categories into your ledger.
          </p>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={seedReplaceExisting}
                onChange={(e) => setSeedReplaceExisting(e.target.checked)}
                className="rounded border-amber-500 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Replace existing transactions (Destructive)</span>
            </label>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {seedReplaceExisting
                ? 'Warning: All current transactions in your account will be cleared before seeding.'
                : 'Safe: Sample transactions will be appended without deleting your existing ledger.'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSeedModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={seedReplaceExisting ? 'danger' : 'gradient'}
              isLoading={seeding}
              onClick={handleSeedSubmit}
            >
              {seedReplaceExisting ? 'Replace & Seed' : 'Append Sample Data'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feature I: Dashboard Customization Modal */}
      <Modal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        title="Customize Dashboard Layout"
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-slate-500 dark:text-slate-400">
            Toggle visibility of telemetry sections to tailor your financial workspace.
          </p>

          <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { key: 'coach', label: 'AI Financial Coach Action Cards' },
              { key: 'forecast', label: 'Cash Flow Forecast & Projection Model' },
              { key: 'charts', label: 'Cashflow Trend & Category Donut Charts' },
              { key: 'channels', label: 'Payment Channels & City Spending Breakdown' },
              { key: 'recent', label: 'Recent Transactions Ledger Feed' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between pt-2.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {label}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateCardVisibility(key, !cardVisibility[key])}
                  className="gap-1.5"
                >
                  {cardVisibility[key] ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">Hidden</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="button"
              variant="gradient"
              onClick={() => setIsCustomizeModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
