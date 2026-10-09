import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = {
      id,
      duration: 4000,
      ...toast,
    }
    setToasts((prev) => [...prev, newToast])

    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, newToast.duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', title, message }),
    info: (message, title = 'Note') => addToast({ type: 'info', title, message }),
  }

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto p-4 rounded-xl glass-panel shadow-xl flex items-start gap-3 border",
                t.type === 'success' && "border-emerald-500/40 bg-slate-900/90 text-emerald-300",
                t.type === 'error' && "border-rose-500/40 bg-slate-900/90 text-rose-300",
                t.type === 'warning' && "border-amber-500/40 bg-slate-900/90 text-amber-300",
                t.type === 'info' && "border-indigo-500/40 bg-slate-900/90 text-indigo-300"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <h5 className="font-semibold text-xs text-slate-100">{t.title}</h5>}
                <p className="text-xs text-slate-300 mt-0.5 break-words">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      toast: {
        success: console.log,
        error: console.error,
        warning: console.warn,
        info: console.info,
      }
    }
  }
  return context
}
