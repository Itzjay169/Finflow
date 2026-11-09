import React, { useState, useEffect, useRef } from 'react'
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
  Target,
  History,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'
import { getTransactions, getBudgets, getGoals, getRecurring } from '../../lib/api'
import { formatINR } from '../../lib/utils'

export function CommandPalette({ isOpen, onClose, onToggleTheme }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Loaded data for search indexing
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [recurring, setRecurring] = useState([])

  // Recent searches stored in localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('finflow_recent_searches')
      return saved ? JSON.parse(saved) : ['Groceries', 'Food', 'Salary', 'Netflix']
    } catch (_) {
      return ['Groceries', 'Food', 'Salary', 'Netflix']
    }
  })

  // Load telemetry data when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      Promise.all([
        getTransactions({ page_size: 25 }).catch(() => ({ transactions: [] })),
        getBudgets().catch(() => []),
        getGoals().catch(() => []),
        getRecurring().catch(() => []),
      ]).then(([txRes, bRes, gRes, rRes]) => {
        setTransactions(txRes?.transactions || txRes?.items || [])
        setBudgets(bRes || [])
        setGoals(gRes || [])
        setRecurring(rRes || [])
      })
    }
  }, [isOpen])

  const navigationItems = [
    { id: 'nav-dash', label: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard, category: 'Pages' },
    { id: 'nav-tx', label: 'Transactions Ledger', path: '/transactions', icon: Receipt, category: 'Pages' },
    { id: 'nav-pred', label: 'ML Predictor (RandomForest)', path: '/predictor', icon: Cpu, category: 'Pages' },
    { id: 'nav-budgets', label: 'Budgets & Goals', path: '/budgets', icon: PieChart, category: 'Pages' },
    { id: 'nav-settings', label: 'Settings & Security', path: '/settings', icon: Settings, category: 'Pages' },
  ]

  const actionItems = [
    {
      id: 'act-predict',
      label: 'Predict Transaction Type (ML)',
      action: () => navigate('/predictor'),
      icon: Sparkles,
      category: 'Actions',
    },
    {
      id: 'act-budgets',
      label: 'Adjust Monthly Budgets',
      action: () => navigate('/budgets'),
      icon: PieChart,
      category: 'Actions',
    },
    {
      id: 'act-export',
      label: 'Export Ledger (CSV / JSON)',
      action: () => navigate('/settings'),
      icon: Download,
      category: 'Actions',
    },
  ]

  // Filter items
  const q = query.trim().toLowerCase()

  const filteredNav = navigationItems.filter((i) =>
    i.label.toLowerCase().includes(q)
  )

  const filteredActions = actionItems.filter((i) =>
    i.label.toLowerCase().includes(q)
  )

  const filteredBudgets = budgets.filter((b) =>
    b.category.toLowerCase().includes(q)
  )

  const filteredGoals = goals.filter((g) =>
    g.title.toLowerCase().includes(q) || (g.category && g.category.toLowerCase().includes(q))
  )

  const filteredRecurring = recurring.filter((r) =>
    r.title.toLowerCase().includes(q) || (r.category && r.category.toLowerCase().includes(q))
  )

  const filteredTx = transactions.filter(
    (t) =>
      t.category.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      String(t.amount).includes(q)
  )

  // Combined flat list of selectable items
  const allSelectableItems = []

  filteredNav.forEach((item) => {
    allSelectableItems.push({
      type: 'nav',
      id: item.id,
      label: item.label,
      onSelect: () => {
        saveSearch(item.label)
        onClose()
        navigate(item.path)
      },
    })
  })

  filteredActions.forEach((item) => {
    allSelectableItems.push({
      type: 'action',
      id: item.id,
      label: item.label,
      onSelect: () => {
        saveSearch(item.label)
        onClose()
        item.action()
      },
    })
  })

  if (q.length > 0) {
    filteredBudgets.forEach((b) => {
      allSelectableItems.push({
        type: 'budget',
        id: `b-${b.id}`,
        label: `Budget: ${b.category}`,
        onSelect: () => {
          saveSearch(b.category)
          onClose()
          navigate('/budgets')
        },
      })
    })

    filteredGoals.forEach((g) => {
      allSelectableItems.push({
        type: 'goal',
        id: `g-${g.id}`,
        label: `Goal: ${g.title}`,
        onSelect: () => {
          saveSearch(g.title)
          onClose()
          navigate('/budgets')
        },
      })
    })

    filteredRecurring.forEach((r) => {
      allSelectableItems.push({
        type: 'recurring',
        id: `r-${r.id}`,
        label: `Recurring: ${r.title}`,
        onSelect: () => {
          saveSearch(r.title)
          onClose()
          navigate('/budgets')
        },
      })
    })

    filteredTx.slice(0, 5).forEach((t) => {
      allSelectableItems.push({
        type: 'tx',
        id: `tx-${t.id}`,
        label: `${t.category} - ${formatINR(t.amount)}`,
        onSelect: () => {
          saveSearch(t.category)
          onClose()
          navigate('/transactions')
        },
      })
    })
  }

  const saveSearch = (text) => {
    if (!text || !text.trim()) return
    const updated = [text.trim(), ...recentSearches.filter((s) => s !== text.trim())].slice(0, 6)
    setRecentSearches(updated)
    try {
      localStorage.setItem('finflow_recent_searches', JSON.stringify(updated))
    } catch (_) {}
  }

  // Keyboard Navigation: ArrowUp, ArrowDown, Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allSelectableItems.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + allSelectableItems.length) % Math.max(1, allSelectableItems.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allSelectableItems[selectedIndex]) {
          allSelectableItems[selectedIndex].onSelect()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allSelectableItems, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in text-left">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden z-10 bg-slate-900/95 text-slate-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search pages, transactions, budgets, goals, recurring bills... (Ctrl+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
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
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Recent Searches (when query is empty) */}
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                <History className="w-3 h-3 text-slate-400" />
                Recent Searches
              </span>
              <div className="flex flex-wrap gap-1.5 px-2 py-1">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s)
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Pages */}
          {filteredNav.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 block">
                Pages
              </span>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const itemIdx = allSelectableItems.findIndex((x) => x.id === item.id)
                  const isHighlighted = itemIdx === selectedIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        saveSearch(item.label)
                        onClose()
                        navigate(item.path)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer group ${
                        isHighlighted
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                        {item.label}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 block">
                Quick Actions
              </span>
              <div className="space-y-0.5">
                {filteredActions.map((item) => {
                  const itemIdx = allSelectableItems.findIndex((x) => x.id === item.id)
                  const isHighlighted = itemIdx === selectedIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        saveSearch(item.label)
                        onClose()
                        item.action()
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer group ${
                        isHighlighted
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-cyan-400 group-hover:text-white" />
                        {item.label}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Budgets & Goals Match */}
          {q.length > 0 && (filteredBudgets.length > 0 || filteredGoals.length > 0) && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 block">
                Budgets & Goals
              </span>
              <div className="space-y-0.5">
                {filteredBudgets.map((b) => {
                  const itemIdx = allSelectableItems.findIndex((x) => x.id === `b-${b.id}`)
                  const isHighlighted = itemIdx === selectedIndex
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        saveSearch(b.category)
                        onClose()
                        navigate('/budgets')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold">Budget: {b.category}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {formatINR(b.monthly_limit)}/mo
                      </span>
                    </button>
                  )
                })}
                {filteredGoals.map((g) => {
                  const itemIdx = allSelectableItems.findIndex((x) => x.id === `g-${g.id}`)
                  const isHighlighted = itemIdx === selectedIndex
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        saveSearch(g.title)
                        onClose()
                        navigate('/budgets')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold">Goal: {g.title}</span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-400">
                        {formatINR(g.current_amount)} / {formatINR(g.target_amount)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Transactions Match */}
          {q.length > 0 && filteredTx.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 block">
                Transactions Matching "{query}"
              </span>
              <div className="space-y-0.5">
                {filteredTx.slice(0, 5).map((t) => {
                  const itemIdx = allSelectableItems.findIndex((x) => x.id === `tx-${t.id}`)
                  const isHighlighted = itemIdx === selectedIndex
                  const isIncome = t.transaction_type === 'Income'
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        saveSearch(t.category)
                        onClose()
                        navigate('/transactions')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t.category}</span>
                        <span className="text-[10px] text-slate-400">&bull; {t.location}</span>
                        {t.notes && <span className="text-[10px] text-slate-500 italic truncate max-w-[120px]">{t.notes}</span>}
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatINR(t.amount)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">↓</kbd> navigate
            </span>
            <span>&bull;</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">↵</kbd> select
            </span>
            <span>&bull;</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">Esc</kbd> exit
            </span>
          </div>
          <span className="text-indigo-400 font-semibold">FinFlow Global Command Bar</span>
        </div>
      </motion.div>
    </div>
  )
}
