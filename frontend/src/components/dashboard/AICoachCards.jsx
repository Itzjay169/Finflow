import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  AlertTriangle,
  Calendar,
  Target,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatINR } from '../../lib/utils'

export function AICoachCards({ insights = [], recurring = [], goals = [], summary = null, onMarkPaid, _onQuickAction }) {
  const navigate = useNavigate()

  // Synthesize coaching tips from real data
  const coachItems = []

  // 1. From smart insights (e.g., category overspend)
  if (Array.isArray(insights)) {
    insights.slice(0, 2).forEach((ins, idx) => {
      coachItems.push({
        id: `insight-${idx}`,
        title: ins.title || 'Budget Pacing Advisory',
        description: ins.message || ins.description || 'Review your monthly category pacing to avoid end-of-month budget deficit.',
        type: ins.type === 'warning' ? 'warning' : 'tip',
        icon: ins.type === 'warning' ? AlertTriangle : Lightbulb,
        actionLabel: 'View Ledger',
        onAction: () => navigate('/transactions'),
      })
    })
  }

  // 2. Upcoming recurring bills (within next 5 days)
  if (Array.isArray(recurring)) {
    const now = new Date()
    const fiveDaysLater = new Date()
    fiveDaysLater.setDate(now.getDate() + 5)

    const upcoming = recurring.find((r) => {
      if (!r.next_due_date) return false
      const due = new Date(r.next_due_date)
      return due >= now && due <= fiveDaysLater
    })

    if (upcoming) {
      coachItems.push({
        id: `rec-${upcoming.id}`,
        title: `Upcoming Bill: ${upcoming.title}`,
        description: `${formatINR(upcoming.amount)} due on ${upcoming.next_due_date}. Settle it now to keep cash flow balanced.`,
        type: 'bill',
        icon: Calendar,
        actionLabel: 'Mark as Paid',
        onAction: () => onMarkPaid ? onMarkPaid(upcoming.id) : navigate('/budgets'),
      })
    }
  }

  // 3. Goal milestones
  if (Array.isArray(goals) && goals.length > 0) {
    const goal = goals[0]
    const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
    if (pct < 100) {
      coachItems.push({
        id: `goal-${goal.id}`,
        title: `Goal Progress: ${goal.title}`,
        description: `${pct.toFixed(0)}% funded (${formatINR(goal.current_amount)} / ${formatINR(goal.target_amount)}). Keep up the discipline!`,
        type: 'goal',
        icon: Target,
        actionLabel: 'Manage Goals',
        onAction: () => navigate('/budgets'),
      })
    }
  }

  // 4. General fallback if ledger has good savings
  if (coachItems.length === 0 && summary) {
    coachItems.push({
      id: 'general-savings',
      title: 'Healthy Savings Rate',
      description: `Your savings rate is currently ${summary?.savings_rate?.toFixed(1) || 50}%. Consider investing your surplus into liquid funds.`,
      type: 'tip',
      icon: Sparkles,
      actionLabel: 'Explore Predictor',
      onAction: () => navigate('/predictor'),
    })
  }

  if (coachItems.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            AI Financial Coach &bull; Real-Time Actions
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Contextual Rule Engine</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {coachItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              item.type === 'warning'
                ? 'bg-rose-500/5 border-rose-500/30'
                : item.type === 'bill'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-indigo-500/5 border-indigo-500/30'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    item.type === 'warning'
                      ? 'text-rose-600 dark:text-rose-400'
                      : item.type === 'bill'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  {item.title}
                </span>
                <Badge
                  variant={item.type === 'warning' ? 'danger' : item.type === 'bill' ? 'warning' : 'indigo'}
                  size="sm"
                >
                  {item.type === 'warning' ? 'Alert' : item.type === 'bill' ? 'Action' : 'Insight'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-3 mt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={item.onAction}
                className="text-xs font-semibold gap-1 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

