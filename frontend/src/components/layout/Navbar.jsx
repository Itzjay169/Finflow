import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  LayoutDashboard,
  Receipt,
  Cpu,
  PieChart,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle, Button, Badge } from '../ui'

export const Navbar = ({ isDark, onToggleTheme }) => {
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
    <nav className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight gradient-text">FinFlow</span>
              {isDemo && <Badge variant="warning" size="sm">Demo</Badge>}
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Personal Finance & ML</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-300/40 dark:border-slate-800">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm z-[-1]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-indigo-600/20">
                  {userInitial}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <span className="font-semibold block leading-tight">{userName}</span>
                  <span className="text-[10px] text-slate-400 block leading-tight">{user.email}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl p-2 z-50 border border-slate-700/60"
                  >
                    <div className="p-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-slate-200">{userName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      {isDemo && (
                        <span className="inline-block mt-1 text-[10px] text-amber-400 font-semibold">
                          Demo Account Active
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-indigo-400" />
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setDropdownOpen(false)
                          await signOut()
                          navigate('/')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile hamburger button */}
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

      {/* Mobile Drawer */}
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
  )
}
