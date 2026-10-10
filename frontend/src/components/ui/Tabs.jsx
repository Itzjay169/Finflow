import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className,
  size = 'md',
  layoutId = 'activeTabPill',
  variant = 'primary', // 'primary' | 'income' | 'expense' | 'neutral'
}) => {
  const activeGradients = {
    primary: "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 shadow-[0_2px_14px_rgba(99,102,241,0.45)] border border-indigo-400/40 text-white",
    income: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-[0_2px_14px_rgba(16,185,129,0.45)] border border-emerald-400/40 text-white",
    expense: "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 shadow-[0_2px_14px_rgba(244,63,94,0.45)] border border-rose-400/40 text-white",
    neutral: "bg-slate-700/80 shadow-md border border-slate-600 text-white",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/70 dark:border-slate-800/80 backdrop-blur-xl shadow-inner",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer select-none z-10 active:scale-95",
              size === 'sm' && "px-2.5 py-1 text-[11px]",
              isActive
                ? "text-white font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  "absolute inset-0 rounded-xl z-[-1]",
                  activeGradients[variant] || activeGradients.primary
                )}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="flex items-center gap-1.5">
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-300/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
