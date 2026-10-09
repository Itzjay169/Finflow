import React from 'react'
import { cn } from '../../lib/utils'

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    income: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    expense: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    primary: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    violet: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    neutral: "bg-slate-700/30 text-slate-300 border border-slate-700/50",
  }

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 font-semibold",
    md: "text-xs px-2.5 py-1 font-semibold",
    lg: "text-sm px-3 py-1.5 font-bold",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full uppercase tracking-wider select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
