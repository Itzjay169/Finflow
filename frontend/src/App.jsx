import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import PredictorPage from './pages/PredictorPage'
import BudgetsPage from './pages/BudgetsPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import DisclaimerPage from './pages/DisclaimerPage'
import CookiesPage from './pages/CookiesPage'
import { CommandPalette } from './components/layout/CommandPalette'
import { OnboardingTour } from './components/layout/OnboardingTour'
import { SiteFooter } from './components/layout/SiteFooter'


export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between">
            {/* Ambient Background Radial Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
              <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <Navbar
                isDark={isDark}
                onToggleTheme={() => setIsDark(!isDark)}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />

              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute>
                        <TransactionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/predictor"
                    element={
                      <ProtectedRoute>
                        <PredictorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/budgets"
                    element={
                      <ProtectedRoute>
                        <BudgetsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/disclaimer" element={<DisclaimerPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  {/* 404 Not Found Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>

            {/* Global Search / Command Palette (Ctrl+K) */}
            <CommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              onToggleTheme={() => setIsDark(!isDark)}
            />

            {/* Interactive Onboarding Tour for new users */}
            <OnboardingTour />

            {/* Production Reusable Site Footer (Full on Landing/Legal/404, Compact in App) */}
            <SiteFooter />
          </div>

        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
