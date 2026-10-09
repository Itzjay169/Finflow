import React from 'react'
import { cn } from '../../lib/utils'

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-300/40 dark:bg-slate-800/60 relative overflow-hidden",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export const CardSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-36" />
    <Skeleton className="h-3 w-20" />
  </div>
)

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card p-6 space-y-3">
    <Skeleton className="h-6 w-48 mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    ))}
  </div>
)
