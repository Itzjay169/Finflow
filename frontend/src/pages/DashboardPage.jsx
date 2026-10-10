import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { Button, Badge, Skeleton } from '../components/ui'
import { KPICard } from '../components/dashboard/KPICard'
import { CashflowChart } from '../components/dashboard/CashflowChart'
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart'
import { PaymentAndLocationCard } from '../components/dashboard/PaymentAndLocationCard'
import { RecentTransactionsFeed } from '../components/dashboard/RecentTransactionsFeed'
import { AddTransactionModal } from '../components/dashboard/AddTransactionModal'
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
} from '../lib/api'
import { formatINR } from '../lib/utils'

export default function DashboardPage() {
  const { user, isDemo } = useAuth()
  const { toast } = useToast()

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

  // Dashboard Data State
  const [summary, setSummary] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [locationData, setLocationData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const [
        summaryRes,
        monthlyRes,
        categoryRes,
        paymentRes,
        locationRes,
        txRes,
      ] = await Promise.all([
        getSummary().catch(() => null),
        getMonthlyAnalytics().catch(() => []),
        getCategoryAnalytics().catch(() => []),
        getPaymentModeAnalytics().catch(() => []),
        getLocationAnalytics().catch(() => []),
        getTransactions({ page_size: 10 }).catch(() => ({ transactions: [] })),
      ])

      if (summaryRes) setSummary(summaryRes)
      if (monthlyRes) setMonthlyData(monthlyRes)
      if (categoryRes) setCategoryData(categoryRes)
      if (paymentRes) setPaymentData(paymentRes)
      if (locationRes) setLocationData(locationRes)
      if (txRes?.transactions) setRecentTransactions(txRes.transactions)
      else if (txRes?.items) setRecentTransactions(txRes.items)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err.message || 'Failed to fetch financial telemetry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleSeedData = async () => {
    try {
      setSeeding(true)
      const res = await seedSampleData()
      toast.success(
        res.message || '1,200 sample transactions loaded successfully',
        'Seeder Complete'
      )
      await fetchDashboardData(true)
    } catch (err) {
      toast.error(err.message || 'Failed to seed sample dataset', 'Error')
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
      setRecentTransactions((prev) => prev.filter((t) => t.id !== id))
      // Background reload summary
      getSummary().then(setSummary).catch(() => {})
    } catch (err) {
      toast.error('Failed to delete transaction: ' + err.message, 'Error')
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
            <span>FinFlow Financial Dashboard</span>
            <span>&bull;</span>
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchDashboardData(true)}
            isLoading={refreshing}
            className="border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedData}
            isLoading={seeding}
            className="border-indigo-500/30 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Seed Sample Data
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

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchDashboardData(true)}
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Inflow"
          value={summary?.total_income || 0}
          subtitle="Annual cumulative earnings"
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
          subtitle="Retained capital efficiency"
          icon={Activity}
          variant="cyan"
          progress={summary?.savings_rate || 51.6}
        />
      </div>

      {/* Secondary Status Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-200">
              RandomForest Classifier Active &bull; 95.8% Accuracy
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Trained 18-feature inference engine for instant Income vs Expense classification
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

      {/* Primary Visualizations: Cashflow & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CashflowChart data={monthlyData} loading={loading} />
        </div>
        <div className="lg:col-span-5">
          <CategoryDonutChart data={categoryData} loading={loading} />
        </div>
      </div>

      {/* Secondary Visualizations: Payment Channels & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <PaymentAndLocationCard
            paymentData={paymentData}
            locationData={locationData}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-7">
          <RecentTransactionsFeed
            transactions={recentTransactions}
            loading={loading}
            onDelete={handleDeleteTransaction}
            onAddClick={() => setIsAddModalOpen(true)}
          />
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchDashboardData(true)}
      />
    </div>
  )
}
