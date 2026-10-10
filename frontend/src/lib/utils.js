import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format amounts into Indian Rupee representation (e.g. ₹1,23,456).
 * Handles rounding, sign prefixing, and absolute values.
 */
export function formatINR(amount, options = {}) {
  const { decimals = 0, sign = false } = options
  const numericAmount = Number(amount) || 0

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Math.abs(numericAmount))

  if (sign && numericAmount > 0) return `+${formatted}`
  if (sign && numericAmount < 0) return `-${formatted}`
  if (numericAmount < 0) return `-${formatted}`
  return formatted
}

/**
 * Compact Indian currency formatter (e.g. ₹1.2L, ₹50k).
 */
export function formatCompactINR(amount) {
  const num = Number(amount) || 0
  const abs = Math.abs(num)
  const prefix = num < 0 ? '-₹' : '₹'
  if (abs >= 10000000) {
    return `${prefix}${(abs / 10000000).toFixed(1)}Cr`
  }
  if (abs >= 100000) {
    return `${prefix}${(abs / 100000).toFixed(1)}L`
  }
  if (abs >= 1000) {
    return `${prefix}${(abs / 1000).toFixed(0)}k`
  }
  return `${prefix}${abs.toFixed(0)}`
}

/**
 * Safe date parser avoiding the ECMAScript UTC shift bug.
 * Parsing "YYYY-MM-DD" with `new Date("YYYY-MM-DD")` treats it as UTC midnight,
 * which shifts backwards by one day in negative/local timezone offsets.
 */
export function parseDate(dateInput) {
  if (!dateInput) return null
  if (dateInput instanceof Date) return dateInput
  if (typeof dateInput === 'string') {
    const clean = dateInput.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day)
      }
    }
  }
  return new Date(dateInput)
}

/**
 * Date formatter (e.g. "12 Oct 2026") using timezone-safe local date parsing.
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return ''
  const d = parseDate(dateString)
  if (!d || isNaN(d.getTime())) return String(dateString)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

/**
 * Percentage formatter (e.g. "95.8%", "100.0%").
 * Returns "-" on division by zero or invalid numbers when guardZero is true.
 */
export function formatPercent(value, decimals = 1, options = {}) {
  const { guardZero = false } = options
  const num = Number(value)
  if (isNaN(num)) return guardZero ? '—' : '0.0%'
  if (guardZero && num === 0) return '—'
  return `${num.toFixed(decimals)}%`
}
