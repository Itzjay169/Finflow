import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  Search,
  Filter,
  PlusCircle,
  Download,
  RefreshCw,
  Database,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  CheckSquare,
  Square,
  ArrowUpDown,
} from 'lucide-react'
import { Card, CardContent, Button, Badge, Skeleton } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { AddTransactionModal } from '../components/dashboard/AddTransactionModal'
import { EditTransactionModal } from '../components/transactions/EditTransactionModal'
import { DeleteConfirmModal } from '../components/transactions/DeleteConfirmModal'
import {
  getTransactions,
  deleteTransaction,
  bulkDeleteTransactions,
  exportTransactionsCsv,
  seedSampleData,
} from '../lib/api'
import { formatINR, formatDate } from '../lib/utils'

const ALL_CATEGORIES = [
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
  'Salary',
  'Freelance',
  'Investments',
  'Rental',
  'Bonus',
]

const ALL_PAYMENT_MODES = [
  'UPI',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
]

const ALL_LOCATIONS = [
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

export default function TransactionsPage() {
  const { toast } = useToast()

  // Transactions State
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Filter & Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'Income' | 'Expense'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'amount'
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' | 'asc'

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id: string } or { bulk: true }
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Fetch transactions with applied parameters
  const loadTransactions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }

      if (search.trim()) params.search = search.trim()
      if (typeFilter !== 'all') params.transaction_type = typeFilter
      if (categoryFilter !== 'all') params.category = categoryFilter
      if (paymentModeFilter !== 'all') params.payment_mode = paymentModeFilter
      if (locationFilter !== 'all') params.location = locationFilter
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const res = await getTransactions(params)
      setTransactions(res.transactions || [])
      setTotal(res.total || 0)
    } catch (err) {
      toast.error('Failed to load transactions: ' + err.message, 'Error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [
    page,
    pageSize,
    search,
    typeFilter,
    categoryFilter,
    paymentModeFilter,
    locationFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    toast,
  ])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Reset page when filter changes
  const handleFilterChange = (setter, value) => {
    setter(value)
    setPage(1)
    setSelectedIds([])
  }

  const handleClearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setPaymentModeFilter('all')
    setLocationFilter('all')
    setStartDate('')
    setEndDate('')
    setSortBy('date')
    setSortOrder('desc')
    setPage(1)
    setSelectedIds([])
  }

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentModeFilter !== 'all' ||
    locationFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate)

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map((t) => t.id))
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Deletion execution
  const executeDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      if (deleteTarget.bulk) {
        const res = await bulkDeleteTransactions(selectedIds)
        toast.info(`Deleted ${res.deleted_count} transactions`, 'Bulk Purge Complete')
        setSelectedIds([])
      } else {
        await deleteTransaction(deleteTarget.id)
        toast.info('Transaction deleted successfully', 'Removed')
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id))
      }
      setDeleteTarget(null)
      await loadTransactions(true)
    } catch (err) {
      toast.error('Failed to delete: ' + err.message, 'Error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const csvData = await exportTransactionsCsv()
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `finflow_ledger_${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.info('Transactions ledger exported as CSV', 'Export Ready')
    } catch (err) {
      toast.error('Export failed: ' + err.message, 'Error')
    }
  }

  // Seeder
  const handleSeedData = async () => {
    try {
      setSeeding(true)
      const res = await seedSampleData()
      toast.success(res.message, 'Seeder Complete')
      await loadTransactions(true)
    } catch (err) {
      toast.error('Seed failed: ' + err.message, 'Error')
    } finally {
      setSeeding(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header & Global Action Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Transactions Ledger
            </h1>
            <Badge variant="primary" size="sm">
              {total.toLocaleString('en-IN')} Entries
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, categorize, and inspect granular financial transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadTransactions(true)}
            isLoading={refreshing}
            className="border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedData}
            isLoading={seeding}
            className="border-indigo-500/30 text-indigo-300 hover:text-white"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Seed 1.2k Records
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="border-slate-700/60 text-slate-300 hover:text-white"
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

      {/* Primary Search & Quick Filters Bar */}
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, category, location..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange(setSearch, '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sliding Pill Type Selector */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs shrink-0">
              {['all', 'Income', 'Expense'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleFilterChange(setTypeFilter, t)}
                  className={`px-3 py-1 rounded-lg capitalize font-semibold transition-colors cursor-pointer ${
                    typeFilter === t
                      ? t === 'Income'
                        ? 'bg-emerald-600 text-white shadow'
                        : t === 'Expense'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-')
                  setSortBy(sb)
                  setSortOrder(so)
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (Highest First)</option>
                <option value="amount-asc">Amount (Lowest First)</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </button>
            </div>
          </div>

          {/* Advanced Collapsible Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
              >
                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      handleFilterChange(setCategoryFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Mode Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentModeFilter}
                    onChange={(e) =>
                      handleFilterChange(setPaymentModeFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Payment Modes</option>
                    {ALL_PAYMENT_MODES.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    City / Center
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) =>
                      handleFilterChange(setLocationFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Locations</option>
                    {ALL_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Start & End */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Date Range
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) =>
                        handleFilterChange(setStartDate, e.target.value)
                      }
                      className="w-1/2 px-2 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) =>
                        handleFilterChange(setEndDate, e.target.value)
                      }
                      className="w-1/2 px-2 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Floating Bulk Action Ribbon */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-2xl glass-panel border border-indigo-500/40 bg-indigo-950/40 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 text-indigo-200 font-semibold">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>{selectedIds.length} item(s) selected</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-300"
              >
                Deselect
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteTarget({ bulk: true })}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table */}
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      transactions.length > 0 &&
                      selectedIds.length === transactions.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-700 bg-slate-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Notes / Merchant</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                // Skeleton Rows
                [1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td colSpan={9} className="py-3.5 px-4">
                      <div className="h-6 rounded bg-slate-800/50" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Receipt className="w-10 h-10 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-300">
                        No transactions found
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {hasActiveFilters
                          ? 'Try resetting your filter parameters or search terms.'
                          : 'Your ledger is empty. Record a new transaction or load the sample benchmark.'}
                      </p>
                      {hasActiveFilters ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleClearFilters}
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="gradient"
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          Add First Transaction
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isIncome =
                    (tx.transaction_type || tx.type || '').toLowerCase() ===
                    'income'
                  const isSelected = selectedIds.includes(tx.id)

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded border-slate-700 bg-slate-800 cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(tx.date)}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={isIncome ? 'income' : 'expense'}
                          size="sm"
                          className="uppercase font-bold text-[9px] flex items-center gap-1 w-max"
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {tx.transaction_type || tx.type}
                        </Badge>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                        {tx.category}
                      </td>

                      {/* Notes / Merchant */}
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {tx.notes || (
                          <span className="text-slate-600 italic">None</span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                          {tx.payment_mode}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {tx.location}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {isIncome
                            ? `+${formatINR(tx.amount)}`
                            : `-${formatINR(tx.amount)}`}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingTransaction(tx)}
                            title="Edit transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: tx.id })}
                            title="Delete transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-slate-200">
                {total === 0 ? 0 : (page - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-200">
                {Math.min(page * pageSize, total)}
              </strong>{' '}
              of <strong className="text-slate-200">{total}</strong> records
            </span>

            {/* Page Size selector */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
              >
                {[10, 20, 50, 100].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 py-1 font-mono text-xs text-slate-200">
              Page {page} of {totalPages}
            </span>

            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadTransactions(true)}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => loadTransactions(true)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        isBulk={Boolean(deleteTarget?.bulk)}
        count={deleteTarget?.bulk ? selectedIds.length : 1}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
      />
    </div>
  )
}
