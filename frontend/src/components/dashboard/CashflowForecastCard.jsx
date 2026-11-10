import React from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { formatINR } from '../../lib/utils'

export function CashflowForecastCard({ forecastData, loading, onHorizonChange, months = 3 }) {
  if (loading) {
    return (
      <Card className="glass-panel border border-slate-200 dark:border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const items = forecastData?.forecast_months || []
  const currentBalance = forecastData?.current_balance ?? 0
  const endingBalance = items.length > 0 ? items[items.length - 1].projected_ending_balance : currentBalance
  const totalNet = endingBalance - currentBalance
  const isPositiveGrowth = totalNet >= 0

  return (
    <Card className="glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Algorithmic Cash-Flow Forecast
                </h3>
                <Badge variant="cyan" size="sm">
                  Projections
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rolling historical run-rate + scheduled recurring obligations
              </p>
            </div>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {[1, 3, 6].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onHorizonChange && onHorizonChange(m)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  months === m
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {m === 1 ? '30 Days' : m === 3 ? '90 Days' : '180 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Current vs Projected Runrate Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Baseline Ledger Balance
            </span>
            <p className="text-lg font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {formatINR(currentBalance)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Projected Ending Balance
            </span>
            <p className="text-lg font-extrabold font-mono text-cyan-500 dark:text-cyan-400 mt-0.5">
              {formatINR(endingBalance)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estimated Net Trajectory
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPositiveGrowth ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              )}
              <span
                className={`text-base font-bold font-mono ${
                  isPositiveGrowth ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {isPositiveGrowth ? '+' : ''}
                {formatINR(totalNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Projected Months Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((m, idx) => (
            <motion.div
              key={m.month_label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                  {m.month_label}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    m.projected_net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {m.projected_net >= 0 ? '+' : ''}
                  {formatINR(m.projected_net)}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Est. Inflow:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatINR(m.projected_income)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Est. Outflow:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatINR(m.projected_expenses)}
                  </span>
                </div>
                {m.projected_recurring > 0 && (
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Incl. recurring:</span>
                    <span className="font-mono">-{formatINR(m.projected_recurring)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  End Balance
                </span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300">
                  {formatINR(m.projected_ending_balance)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informational Disclaimer */}
        <div className="flex items-start gap-2 text-[11px] text-slate-400 pt-1">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
          <span>
            {forecastData?.assumptions || 'Based on historical run rates and scheduled bills.'}{' '}
            <strong className="text-slate-500 dark:text-slate-400 font-medium">
              Projection only, not guaranteed financial advice.
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

