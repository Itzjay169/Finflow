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

export default function App() {
  const [isDark, setIsDark] = useState(true)

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
          <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between">
            {/* Ambient Background Radial Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
              <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <Navbar isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />

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
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>

            <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/60 py-6 text-center text-xs text-slate-500">
              <p>FinFlow – Personal Finance Tracker &bull; Built with FastAPI, Supabase & React &bull; 95.8% ML Accuracy</p>
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
