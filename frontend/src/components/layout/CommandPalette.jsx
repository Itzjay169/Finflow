import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutDashboard,
  Receipt,
  Cpu,
  PieChart,
  Settings,
  PlusCircle,
  Download,
  Sparkles,
  X,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { getTransactions } from '../../lib/api'
import { formatINR } from '../../lib/utils'

export function CommandPalette({ isOpen, onClose, onToggleTheme, onOpenAddTransaction }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [transactions, setTransactions] = useState([])

  // Load some transactions for live search
  useEffect(() => {
    if (isOpen) {
      getTransactions({ page_size: 20 })
        .then((res) => setTransactions(res?.transactions || []))
        .catch(() => {})
    }
  }, [isOpen])

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // toggle or notify
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Transactions', path: '/transactions', icon: Receipt, category: 'Navigation' },
    { label: 'ML Predictor', path: '/predictor', icon: Cpu, category: 'Navigation' },
    { label: 'Budgets & Goals', path: '/budgets', icon: PieChart, category: 'Navigation' },
    { label: 'Settings', path: '/settings', icon: Settings, category: 'Navigation' },
  ]

  const actionItems = [
    {
      label: 'Predict Transaction Type (ML)',
      action: () => navigate('/predictor'),
      icon: Sparkles,
      category: 'Actions',
    },
    {
      label: 'View Category Budgets',
      action: () => navigate('/budgets'),
      icon: PieChart,
      category: 'Actions',
    },
    {
      label: 'Export Transactions (CSV)',
      action: () => navigate('/settings'),
      icon: Download,
      category: 'Actions',
    },
  ]

  const filteredNav = navigationItems.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  )

  const filteredActions = actionItems.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  )

  const filteredTx = transactions.filter(
    (t) =>
      t.category.toLowerCase().includes(query.toLowerCase()) ||
      t.location.toLowerCase().includes(query.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(query.toLowerCase())) ||
      String(t.amount).includes(query)
  )

  const handleSelectNav = (path) => {
    onClose()
    navigate(path)
  }

  const handleSelectAction = (action) => {
    onClose()
    action()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden z-10"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, page, or search transactions... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Pages */}
          {filteredNav.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Pages
              </span>
              <div className="space-y-0.5">
                {filteredNav.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleSelectNav(item.path)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                      {item.label}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Quick Actions
              </span>
              <div className="space-y-0.5">
                {filteredActions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectAction(item.action)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 text-cyan-400 group-hover:text-white" />
                      {item.label}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Match */}
          {query.trim().length > 1 && filteredTx.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Transactions Matching "{query}"
              </span>
              <div className="space-y-0.5">
                {filteredTx.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectNav('/transactions')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.category}</span>
                      <span className="text-[10px] text-slate-400">&bull; {t.location}</span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        t.transaction_type === 'Income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatINR(t.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Navigation: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">Esc</kbd> to exit
          </span>
          <span className="text-indigo-400 font-semibold">FinFlow Command Bar</span>
        </div>
      </motion.div>
    </div>
  )
}
