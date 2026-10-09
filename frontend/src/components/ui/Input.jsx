import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  icon: Icon,
  className,
  id,
  required,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none",
            "bg-slate-100/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
            "border border-slate-300 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400",
            "focus:ring-2 focus:ring-indigo-500/20",
            Icon && "pl-10",
            isPassword && "pr-10",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium pl-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
