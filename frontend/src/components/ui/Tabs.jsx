import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className,
  size = 'md',
}) => {
  return (
    <div className={cn("inline-flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300/40 dark:border-slate-800/80 backdrop-blur-md", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer select-none z-10",
              size === 'sm' && "px-2.5 py-1 text-[11px]",
              isActive
                ? "text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm z-[-1]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="flex items-center gap-1.5">
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  isActive ? "bg-white/20 text-white" : "bg-slate-300/40 dark:bg-slate-800 text-slate-400"
                )}>
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
