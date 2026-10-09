import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../ui'
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Trash2,
  Calendar,
  CreditCard,
  MapPin,
} from 'lucide-react'
import { formatINR, formatDate } from '../../lib/utils'

export const RecentTransactionsFeed = ({
  transactions = [],
  loading = false,
  onDelete,
  onAddClick,
}) => {
  const [filter, setFilter] = useState('all') // 'all' | 'income' | 'expense'

  const filtered = transactions.filter((tx) => {
    const t = (tx.transaction_type || tx.type || '').toLowerCase()
    if (filter === 'income') return t === 'income'
    if (filter === 'expense') return t === 'expense'
    return true
  })

  return (
    <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Recent Transactions Feed
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of recorded personal expenditures and earnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick filter pills */}
          <div className="flex items-center bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 text-xs">
            {['all', 'income', 'expense'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg capitalize text-xs font-semibold transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Link
            to="/transactions"
            className="hidden sm:flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            View All
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-14 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Receipt className="w-10 h-10 text-slate-600" />
            <p className="text-xs text-slate-400">No transactions recorded under this filter.</p>
            {onAddClick && (
              <Button size="sm" variant="gradient" onClick={onAddClick}>
                Add First Transaction
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {filtered.slice(0, 7).map((tx) => {
              const isIncome = (tx.transaction_type || tx.type || '').toLowerCase() === 'income'

              return (
                <div
                  key={tx.id}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition-colors group"
                >
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {tx.category || 'General'}
                        </p>
                        {tx.notes && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            ({tx.notes})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDate(tx.date)}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {tx.payment_mode || 'Cash'}
                        </span>
                        {tx.location && (
                          <>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {tx.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-sm font-black font-mono tracking-tight ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                      </p>
                      <Badge
                        variant={isIncome ? 'income' : 'expense'}
                        size="sm"
                        className="text-[9px] uppercase font-bold"
                      >
                        {tx.transaction_type || tx.type}
                      </Badge>
                    </div>

                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        title="Delete transaction"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-800 text-center sm:hidden">
          <Link
            to="/transactions"
            className="text-xs text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
          >
            View all transactions <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
