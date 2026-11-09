import React, { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { CommandPalette } from './components/layout/CommandPalette'
import { OnboardingTour } from './components/layout/OnboardingTour'
import { SiteFooter } from './components/layout/SiteFooter'
import { Skeleton } from './components/ui/Skeleton'

// Code-split route components for optimized bundle delivery
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const PredictorPage = lazy(() => import('./pages/PredictorPage'))
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'))
const CookiesPage = lazy(() => import('./pages/CookiesPage'))

function PageFallback() {
  return (
    <div className="py-12 space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  )
}

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
        <PreferencesProvider>
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
              <Suspense fallback={<PageFallback />}>
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
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
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
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
