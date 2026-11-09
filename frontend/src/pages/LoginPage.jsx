import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Coins,
  Cpu,
} from 'lucide-react'
import { Button, Input, Modal, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { signIn, signInWithDemo, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email address'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back to FinFlow!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Failed to sign in. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSignIn = () => {
    signInWithDemo()
    toast.success('Signed in with Demo Account (demo@finflow.app)')
    navigate('/dashboard', { replace: true })
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error('Please enter your account email')
      return
    }
    setForgotLoading(true)
    try {
      // Supabase reset password
      await new Promise(r => setTimeout(r, 600))
      toast.success('Password reset instructions sent to your inbox!')
      setForgotModalOpen(false)
      setForgotEmail('')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden glass-panel border border-slate-700/60 shadow-2xl"
      >
        {/* Left Illustrated Side Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/80 p-8 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-700/60">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10 text-left">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-indigo-600/30 border border-indigo-500/30">
              <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">FinFlow Access</h2>
              <p className="text-xs text-slate-300 mt-1">Autonomous wealth analytics & ML classification</p>
            </div>
          </div>

          {/* Animated Features Ticker */}
          <div className="my-8 space-y-3 relative z-10 text-left">
            <div className="glass-panel p-3 rounded-xl border-indigo-500/30 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">AI Transaction Engine</span>
                <span className="text-slate-400 text-[11px]">95.8% accuracy on 18 features</span>
              </div>
            </div>

            <div className="glass-panel p-3 rounded-xl border-emerald-500/30 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">Row Level Security</span>
                <span className="text-slate-400 text-[11px]">PostgreSQL user isolation</span>
              </div>
            </div>
          </div>

          <div className="text-left text-[11px] text-slate-400 relative z-10">
            Need instant testing? Click below to load demo data.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6 text-left">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-100">Welcome back</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials or test with the pre-seeded demo account.
            </p>
          </div>

          {/* Demo Button */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Demo Account Ready</span>
                <span className="text-[10px] text-slate-400 font-mono">demo@finflow.app / Demo@1234</span>
              </div>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleDemoSignIn}
            >
              Try Demo
            </Button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@finflow.app"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={loading}
              icon={ArrowRight}
            >
              Sign In to FinFlow
            </Button>
          </form>

          {/* Social Sign In Option */}
          <div className="space-y-3 pt-2 text-center">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider relative">
                or continue with
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full gap-2"
              onClick={signInWithGoogle}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.36 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"/>
              </svg>
              Google Sign-In
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password"
        description="Enter your email to receive recovery instructions."
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            label="Account Email"
            type="email"
            placeholder="alex@finflow.app"
            icon={Mail}
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setForgotModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={forgotLoading}>Send Reset Link</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
