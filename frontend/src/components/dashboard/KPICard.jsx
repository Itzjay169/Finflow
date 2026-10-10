import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardContent } from '../ui'
import { formatINR } from '../../lib/utils'

export const KPICard = ({
  title,
  value,
  formattedValue,
  subtitle,
  icon: Icon,
  variant = 'indigo', // 'emerald' | 'rose' | 'indigo' | 'cyan' | 'purple'
  trend, // { value: '+14.2%', positive: true }
  progress, // number 0 - 100 (for savings rate)
  onClick,
}) => {
  const variantStyles = {
    emerald: {
      border: 'hover:border-emerald-500/40 border-emerald-500/20',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      textGlow: 'text-emerald-400',
      gradient: 'from-emerald-500/10 to-transparent',
      progressFill: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    },
    rose: {
      border: 'hover:border-rose-500/40 border-rose-500/20',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      textGlow: 'text-rose-400',
      gradient: 'from-rose-500/10 to-transparent',
      progressFill: 'bg-gradient-to-r from-rose-500 to-pink-400',
    },
    indigo: {
      border: 'hover:border-indigo-500/40 border-indigo-500/20',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      textGlow: 'text-indigo-400',
      gradient: 'from-indigo-500/10 to-transparent',
      progressFill: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    },
    cyan: {
      border: 'hover:border-cyan-500/40 border-cyan-500/20',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      textGlow: 'text-cyan-400',
      gradient: 'from-cyan-500/10 to-transparent',
      progressFill: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    },
    purple: {
      border: 'hover:border-purple-500/40 border-purple-500/20',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      textGlow: 'text-purple-400',
      gradient: 'from-purple-500/10 to-transparent',
      progressFill: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
  }

  const currentStyle = variantStyles[variant] || variantStyles.indigo

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <Card
        glow
        className={`relative overflow-hidden transition-all duration-300 ${currentStyle.border} bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm`}
      >
        {/* Subtle background ambient corner glow */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${currentStyle.gradient} pointer-events-none rounded-full blur-2xl opacity-60`}
        />

        <CardHeader className="flex-row items-center justify-between pb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {Icon && (
            <div className={`p-2 rounded-xl border ${currentStyle.badgeBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {formattedValue !== undefined ? formattedValue : formatINR(value)}
            </h3>
          </div>

          {/* Progress bar if specified (e.g. for savings rate) */}
          {progress !== undefined && (
            <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden my-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${currentStyle.progressFill}`}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                {subtitle}
              </span>
            )}
            {trend && (
              <span
                className={`font-semibold text-[11px] ml-auto shrink-0 flex items-center gap-1 ${
                  trend.positive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
