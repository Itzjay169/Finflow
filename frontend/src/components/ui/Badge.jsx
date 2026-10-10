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
    income: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    expense: "bg-rose-500/15 text-rose-400 border border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
    primary: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.15)]",
    violet: "bg-violet-500/15 text-violet-400 border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.15)]",
    cyan: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    neutral: "bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700/80",
  }

  const sizes = {
    sm: "text-[10px] px-2.5 py-0.5 font-bold tracking-wider",
    md: "text-xs px-3 py-1 font-bold tracking-wider",
    lg: "text-sm px-3.5 py-1.5 font-extrabold tracking-wider",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full uppercase select-none transition-colors backdrop-blur-md",
        variants[variant] || variants.neutral,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
