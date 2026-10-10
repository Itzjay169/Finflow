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
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"

  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/20",
    gradient: "bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-400 text-white shadow-xl shadow-indigo-500/30 border border-white/20",
    secondary: "bg-slate-200/80 dark:bg-slate-800/90 hover:bg-slate-300 dark:hover:bg-slate-700/90 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700/80",
    outline: "border border-slate-300/80 dark:border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-sm",
    ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white",
    danger: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 border border-rose-400/20",
    income: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/20",
    glass: "glass-panel hover:border-indigo-500/50 text-slate-100 shadow-sm",
  }

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-xs sm:text-sm px-4 py-2 gap-2 h-10",
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
