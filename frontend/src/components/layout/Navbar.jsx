import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  Cpu,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle, Button, Badge } from '../ui'
import { NotificationsBell } from './NotificationsBell'

export const Navbar = ({ isDark, onToggleTheme, onOpenCommandPalette }) => {
  const { user, isAuthenticated, isDemo, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'ML Predictor', path: '/predictor', icon: Cpu },
    { label: 'Budgets & Goals', path: '/budgets', icon: PieChart },
  ]

  const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 px-4 pt-3 pb-1 max-w-7xl mx-auto">
        <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
          {/* Brand */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0 border border-indigo-500/30">
              <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Fin<span className="text-gradient">Flow</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Cashflow &amp; Machine Learning
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavPill"
                        className="absolute inset-0 bg-indigo-600 rounded-lg -z-10 shadow-md shadow-indigo-600/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Command Palette Button */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <kbd className="hidden lg:inline-block text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Bell */}
            {isAuthenticated && <NotificationsBell />}

            {/* Dark/Light Luxury Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            {/* User Dropdown / Auth CTA */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                    {userInitial.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">
                      {userName}
                    </div>
                    {isDemo && (
                      <Badge variant="amber" size="sm" className="text-[9px] py-0 px-1 mt-0.5">
                        Demo
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 space-y-1"
                    >
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {userName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-indigo-400 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings & Preferences
                      </Link>

                      <div className="border-t border-slate-200 dark:border-slate-800/80 my-1" />

                      <button
                        type="button"
                        onClick={async () => {
                          setDropdownOpen(false)
                          await signOut()
                          navigate('/')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="gradient" size="sm" className="text-xs">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl md:hidden text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Top Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-panel rounded-2xl mt-2 p-4 shadow-xl space-y-2 overflow-hidden"
            >
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    location.pathname === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false)
                    await signOut()
                    navigate('/')
                  }}
                  className="text-xs text-rose-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Feature M: Mobile Fixed Bottom Navigation Bar */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
          {[
            { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Ledger', path: '/transactions', icon: Receipt },
            { label: 'Predict', path: '/predictor', icon: Cpu },
            { label: 'Budgets', path: '/budgets', icon: PieChart },
            { label: 'Settings', path: '/settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
