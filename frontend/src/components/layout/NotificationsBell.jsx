import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Clock, AlertTriangle, Target, Info, Sparkles } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api'

export function NotificationsBell() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadNotifs()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifs() {
    try {
      const data = await getNotifications()
      setNotifications(data || [])
    } catch (err) {
      console.warn('Failed to load notifications:', err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {}
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {}
  }

  const getIcon = (type) => {
    switch (type) {
      case 'recurring':
        return <Clock className="w-4 h-4 text-cyan-400" />
      case 'budget':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      case 'goal':
        return <Target className="w-4 h-4 text-emerald-400" />
      default:
        return <Info className="w-4 h-4 text-indigo-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel shadow-2xl p-3 z-50 border border-slate-700/60"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                    {unreadCount}
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-start gap-2.5 ${
                      !n.is_read
                        ? 'bg-slate-800/40 hover:bg-slate-800/70'
                        : 'hover:bg-slate-800/30 opacity-70'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {getIcon(n.notification_type)}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
