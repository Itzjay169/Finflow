import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Toggle = ({
  checked = false,
  onChange,
  disabled = false,
  className,
  size = 'md',
}) => {
  const isChecked = Boolean(checked)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!isChecked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        size === 'sm' ? "h-5 w-9" : "h-6 w-11",
        isChecked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={cn(
          "inline-block rounded-full bg-white shadow-md",
          size === 'sm' ? "h-3.5 w-3.5" : "h-4.5 w-4.5",
          isChecked
            ? (size === 'sm' ? "translate-x-4.5" : "translate-x-5.5")
            : "translate-x-1"
        )}
      />
    </button>
  )
}

export const ThemeToggle = ({ isDark, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      className="relative p-2 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-indigo-500/40 transition-colors cursor-pointer"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-indigo-400" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
      </motion.div>
    </button>
  )
}
