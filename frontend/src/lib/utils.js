import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format amounts into Indian Rupee representation (e.g. ₹1,23,456)
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
 * Date formatter (e.g. "12 Oct 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
