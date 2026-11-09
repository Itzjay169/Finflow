import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  Tag,
  Paperclip,
  Bookmark,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, Button, Badge, Skeleton, Modal } from '../components/ui'
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
  getTags,
  getSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
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
  const queryClient = useQueryClient()

  // Filter & Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'Income' | 'Expense'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [hasAttachmentOnly, setHasAttachmentOnly] = useState(false)
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

  // Seeding Modal State (Bug Fix H)
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false)
  const [seedReplaceExisting, setSeedReplaceExisting] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Save Filter Modal State (Feature C)
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false)
  const [filterPresetName, setFilterPresetName] = useState('')
  const [savingFilter, setSavingFilter] = useState(false)

  // Fetch Tags and Saved Filters
  const { data: userTags = [] } = useQuery({
    queryKey: ['userTags'],
    queryFn: getTags,
  })

  const { data: savedFilters = [], refetch: refetchSavedFilters } = useQuery({
    queryKey: ['savedFilters'],
    queryFn: getSavedFilters,
  })

  // Build query params
  const queryParams = {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(typeFilter !== 'all' ? { transaction_type: typeFilter } : {}),
    ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
    ...(paymentModeFilter !== 'all' ? { payment_mode: paymentModeFilter } : {}),
    ...(locationFilter !== 'all' ? { location: locationFilter } : {}),
    ...(tagFilter !== 'all' ? { tag: tagFilter } : {}),
    ...(hasAttachmentOnly ? { has_attachment: true } : {}),
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  }

  // TanStack Query for Transactions
  const {
    data: txResponse,
    isLoading: loading,
    isRefetching: refreshing,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: () => getTransactions(queryParams),
  })

  const transactions = txResponse?.transactions || txResponse?.items || []
  const total = txResponse?.total || 0

  // Filter change helper
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
    setTagFilter('all')
    setHasAttachmentOnly(false)
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
    tagFilter !== 'all' ||
    hasAttachmentOnly ||
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
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

  // Seeder submission with safety options (Bug Fix H)
  const handleSeedSubmit = async () => {
    try {
      setSeeding(true)
      const res = await seedSampleData({
        replace_existing: seedReplaceExisting,
        confirm: true,
      })
      toast.success(res.message || 'Sample transactions loaded safely', 'Seeder Complete')
      setIsSeedModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    } catch (err) {
      toast.error('Seed failed: ' + err.message, 'Error')
    } finally {
      setSeeding(false)
    }
  }

  // Saved Filter creation (Feature C)
  const handleSaveFilter = async (e) => {
    e.preventDefault()
    if (!filterPresetName.trim()) return
    try {
      setSavingFilter(true)
      await createSavedFilter({
        name: filterPresetName.trim(),
        filter_criteria: {
          search,
          typeFilter,
          categoryFilter,
          paymentModeFilter,
          locationFilter,
          tagFilter,
        },
      })
      toast.success(`Filter preset "${filterPresetName}" saved!`, 'Saved Filter')
      setIsSaveFilterModalOpen(false)
      setFilterPresetName('')
      refetchSavedFilters()
    } catch (err) {
      toast.error('Failed to save filter preset: ' + err.message, 'Error')
    } finally {
      setSavingFilter(false)
    }
  }

  const handleApplySavedFilter = (preset) => {
    const crit = typeof preset.filter_criteria === 'string'
      ? JSON.parse(preset.filter_criteria)
      : preset.filter_criteria || {}
    if (crit.search !== undefined) setSearch(crit.search)
    if (crit.typeFilter !== undefined) setTypeFilter(crit.typeFilter)
    if (crit.categoryFilter !== undefined) setCategoryFilter(crit.categoryFilter)
    if (crit.paymentModeFilter !== undefined) setPaymentModeFilter(crit.paymentModeFilter)
    if (crit.locationFilter !== undefined) setLocationFilter(crit.locationFilter)
    if (crit.tagFilter !== undefined) setTagFilter(crit.tagFilter)
    setPage(1)
    toast.info(`Applied saved view: ${preset.name}`, 'Preset Applied')
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header & Global Action Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Transactions Ledger
            </h1>
            <Badge variant="primary" size="sm">
              {total.toLocaleString('en-IN')} Entries
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, tag, and inspect granular financial transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Views Dropdown */}
          {savedFilters.length > 0 && (
            <select
              onChange={(e) => {
                const found = savedFilters.find((f) => String(f.id) === e.target.value)
                if (found) handleApplySavedFilter(found)
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="" disabled>
                Saved Presets ({savedFilters.length})
              </option>
              {savedFilters.map((sf) => (
                <option key={sf.id} value={sf.id}>
                  {sf.name}
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetchTransactions()}
            isLoading={refreshing}
            className="border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSeedModalOpen(true)}
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

      {/* Primary Search & Quick Filters Bar */}
      <Card className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, category, location, tags..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange(setSearch, '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sliding Pill Type Selector */}
            <div className="relative flex items-center bg-slate-200/80 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-300/80 dark:border-slate-800 text-xs shrink-0 shadow-inner">
              {['all', 'Income', 'Expense'].map((t) => {
                const isSelected = typeFilter === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleFilterChange(setTypeFilter, t)}
                    className={`relative px-3.5 py-1.5 rounded-xl capitalize font-bold transition-colors cursor-pointer select-none z-10 active:scale-95 ${
                      isSelected
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="txTypeFilterPill"
                        className={`absolute inset-0 rounded-xl z-[-1] ${
                          t === 'Income'
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-[0_2px_12px_rgba(16,185,129,0.45)] border border-emerald-400/30'
                            : t === 'Expense'
                            ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 shadow-[0_2px_12px_rgba(244,63,94,0.45)] border border-rose-400/30'
                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 shadow-[0_2px_12px_rgba(99,102,241,0.45)] border border-indigo-400/30'
                        }`}
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    {t}
                  </button>
                )
              })}
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
                className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
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
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>

              {/* Save current view button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setIsSaveFilterModalOpen(true)}
                  title="Save current filter view"
                  className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save View</span>
                </button>
              )}
            </div>
          </div>

          {/* Advanced Collapsible Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs"
              >
                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      handleFilterChange(setCategoryFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
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
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentModeFilter}
                    onChange={(e) =>
                      handleFilterChange(setPaymentModeFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
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
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    City / Center
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) =>
                      handleFilterChange(setLocationFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="all">All Locations</option>
                    {ALL_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter (Feature B) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Tag
                  </label>
                  <select
                    value={tagFilter}
                    onChange={(e) =>
                      handleFilterChange(setTagFilter, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="all">All Tags</option>
                    {userTags.map((tg) => (
                      <option key={tg.id || tg.name} value={tg.name}>
                        #{tg.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Start & End */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Date Range
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) =>
                        handleFilterChange(setStartDate, e.target.value)
                      }
                      className="w-1/2 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] focus:outline-none"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) =>
                        handleFilterChange(setEndDate, e.target.value)
                      }
                      className="w-1/2 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-5 flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 text-xs">
                    <input
                      type="checkbox"
                      checked={hasAttachmentOnly}
                      onChange={(e) => handleFilterChange(setHasAttachmentOnly, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Has receipt attachment</span>
                  </label>

                  {hasActiveFilters && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="text-xs text-rose-500 hover:text-rose-400"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
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
      <Card className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      transactions.length > 0 &&
                      selectedIds.length === transactions.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Notes / Tags</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {loading ? (
                // Skeleton Rows
                [1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td colSpan={9} className="py-3.5 px-4">
                      <div className="h-6 rounded bg-slate-200 dark:bg-slate-800/50" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Receipt className="w-10 h-10 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No transactions found
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
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
                  const tagList = Array.isArray(tx.tags)
                    ? tx.tags
                    : typeof tx.tags === 'string' && tx.tags
                    ? tx.tags.split(',').map((t) => t.trim())
                    : []

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/40 ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {tx.category}
                      </td>

                      {/* Notes, Tags & Attachment (Features A & B) */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{tx.notes || <span className="text-slate-400 italic">None</span>}</span>
                            {tx.attachment_url && (
                              <a
                                href={tx.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                title="View Receipt Attachment"
                                className="text-cyan-500 hover:text-cyan-400 shrink-0 inline-flex items-center"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {tagList.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tagList.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {tx.payment_mode}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {tx.location}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            isIncome ? 'text-emerald-500' : 'text-rose-500'
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: tx.id })}
                            title="Delete transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(page * pageSize, total)}
              </strong>{' '}
              of <strong className="text-slate-800 dark:text-slate-200">{total}</strong> records
            </span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="font-mono text-slate-700 dark:text-slate-300 px-1">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
          queryClient.invalidateQueries({ queryKey: ['summary'] })
        }}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={Boolean(editingTransaction)}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          isLoading={deleteLoading}
          count={deleteTarget.bulk ? selectedIds.length : 1}
        />
      )}

      {/* Bug Fix H: Seeding Safety Confirmation Modal */}
      <Modal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        title="Seed Sample Financial Records"
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-slate-600 dark:text-slate-300">
            Generate and seed benchmark transactions with realistic locations, categories, and payment modes.
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
                ? 'Caution: All current ledger transactions will be permanently deleted and replaced.'
                : 'Safe: Sample transactions will be appended to your current ledger without deleting records.'}
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
              {seedReplaceExisting ? 'Replace & Seed' : 'Append Safely'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feature C: Save Filter View Modal */}
      <Modal
        isOpen={isSaveFilterModalOpen}
        onClose={() => setIsSaveFilterModalOpen(false)}
        title="Save Current Filter View"
      >
        <form onSubmit={handleSaveFilter} className="space-y-4 text-xs text-left">
          <p className="text-slate-500 dark:text-slate-400">
            Save your active search, category, type, and location filters for one-click access.
          </p>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Preset Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Groceries, Large UPI Expenses"
              value={filterPresetName}
              onChange={(e) => setFilterPresetName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSaveFilterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              isLoading={savingFilter}
            >
              Save View
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
