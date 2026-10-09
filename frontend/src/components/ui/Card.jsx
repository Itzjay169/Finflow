import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export const Card = ({
  children,
  className,
  glow = false,
  interactive = false,
  ...props
}) => {
  const Component = interactive ? motion.div : 'div'
  const motionProps = interactive ? {
    whileHover: { y: -3, transition: { duration: 0.2 } },
  } : {}

  return (
    <Component
      className={cn(
        "glass-card p-6 relative overflow-hidden",
        glow && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-indigo-500/10 before:to-transparent before:pointer-events-none",
        interactive && "cursor-pointer",
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
}

export const CardHeader = ({ children, className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ children, className, ...props }) => (
  <h3 className={cn("font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight", className)} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className, ...props }) => (
  <p className={cn("text-xs text-slate-500 dark:text-slate-400", className)} {...props}>
    {children}
  </p>
)

export const CardContent = ({ children, className, ...props }) => (
  <div className={cn("pt-0", className)} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ children, className, ...props }) => (
  <div className={cn("flex items-center pt-4 border-t border-slate-200/50 dark:border-slate-800/50", className)} {...props}>
    {children}
  </div>
)
