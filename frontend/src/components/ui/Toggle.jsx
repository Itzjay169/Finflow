import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Ultra-refined tactile toggle switch with glowing gradient track and spring knob
 */
export const Toggle = ({
  checked = false,
  onChange,
  disabled = false,
  className,
  size = 'md',
  color = 'primary', // 'primary' | 'income' | 'expense'
}) => {
  const isChecked = Boolean(checked)

  const activeGradients = {
    primary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_16px_rgba(99,102,241,0.45)] border-indigo-400/40",
    income: "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.45)] border-emerald-400/40",
    expense: "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.45)] border-rose-400/40",
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!isChecked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 cursor-pointer select-none border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-95",
        size === 'sm' ? "h-5 w-10 p-0.5" : "h-6 w-12 p-0.5",
        isChecked
          ? activeGradients[color] || activeGradients.primary
          : "bg-slate-200 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700/80 shadow-inner",
        disabled && "opacity-50 cursor-not-allowed active:scale-100",
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className={cn(
          "inline-block rounded-full bg-white shadow-md transition-shadow",
          size === 'sm' ? "h-4 w-4" : "h-5 w-5",
          isChecked ? "shadow-[0_2px_8px_rgba(0,0,0,0.3)]" : "shadow-[0_1px_3px_rgba(0,0,0,0.2)]",
          isChecked
            ? (size === 'sm' ? "translate-x-5" : "translate-x-6")
            : "translate-x-0"
        )}
      />
    </button>
  )
}

/**
 * Luxury dual-pill ThemeToggle with Sun & Moon indicators and sliding animated highlight
 */
export const ThemeToggle = ({ isDark, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme mode"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="relative flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300/70 dark:border-slate-700/70 backdrop-blur-xl shadow-inner transition-all hover:border-indigo-500/50 cursor-pointer group active:scale-95"
    >
      {/* Sliding illuminated pill */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "absolute inset-y-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 z-0",
          isDark
            ? "left-[calc(50%+2px)] bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.55)] border border-indigo-400/30"
            : "left-1 bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.55)] border border-amber-300/40"
        )}
      />

      {/* Sun Button */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center w-7 h-7 rounded-xl transition-colors duration-200",
          !isDark ? "text-white" : "text-slate-400 group-hover:text-amber-400"
        )}
      >
        <Sun className={cn("w-4 h-4 transition-transform duration-300", !isDark ? "scale-105" : "scale-90 opacity-70")} />
      </div>

      {/* Moon Button */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center w-7 h-7 rounded-xl transition-colors duration-200",
          isDark ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
        )}
      >
        <Moon className={cn("w-4 h-4 transition-transform duration-300", isDark ? "scale-105" : "scale-90 opacity-70")} />
      </div>
    </button>
  )
}
