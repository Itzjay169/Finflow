import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:bg-indigo-700",
    gradient: "bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60 dark:bg-slate-800/80",
    outline: "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
    ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25",
    income: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25",
    glass: "glass-panel hover:border-indigo-500/50 text-slate-100 shadow-sm",
  }

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-sm px-4 py-2 gap-2 h-10",
    lg: "text-base px-6 py-2.5 gap-2.5 h-12 font-semibold",
    icon: "p-2 h-10 w-10 aspect-square",
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      whileHover={disabled || isLoading ? undefined : { scale: 1.02 }}
      whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'
