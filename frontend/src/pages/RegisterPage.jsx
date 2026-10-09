import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react'
import { Button, Input, Badge, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { signUp, signInWithDemo } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-slate-700' }
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (score === 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' }
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' }
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-indigo-500' }
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' }
  }, [password])

  const validate = () => {
    const errs = {}
    if (!fullName) errs.fullName = 'Full name is required'
    if (!email) errs.email = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email address'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (!agreeTerms) errs.terms = 'You must agree to the Terms of Service'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await signUp(email, password, fullName)
      toast.success('Registration successful! Welcome to FinFlow.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSignIn = () => {
    signInWithDemo()
    toast.success('Signed in with Demo Account!')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden glass-panel border border-slate-700/60 shadow-2xl"
      >
        {/* Left Side Feature Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/80 p-8 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-700/60">
          <div className="space-y-4 relative z-10 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Create Account</h2>
              <p className="text-xs text-slate-300 mt-1">Join FinFlow with Supabase Row Level Security</p>
            </div>
          </div>

          <div className="my-8 space-y-3 relative z-10 text-left">
            <div className="glass-panel p-3 rounded-xl border-cyan-500/30 flex items-center gap-3">
              <Database className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">Personal Data Vault</span>
                <span className="text-slate-400 text-[11px]">User-scoped tables with RLS isolation</span>
              </div>
            </div>

            <div className="glass-panel p-3 rounded-xl border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">1,200 Benchmark Records</span>
                <span className="text-slate-400 text-[11px]">Instant sample dataset ingestion</span>
              </div>
            </div>
          </div>

          <div className="text-left text-[11px] text-slate-400 relative z-10">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Sign in here
            </Link>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6 text-left">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-100">Get Started</h3>
            <p className="text-xs text-slate-400 mt-1">
              Set up your profile or jump straight into the demo workspace.
            </p>
          </div>

          {/* Quick Demo Trigger */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Skip Registration</span>
                <span className="text-[10px] text-slate-400">One-click test access</span>
              </div>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleDemoSignIn}
            >
              Try Demo Account
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Alex Mercer"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              required
            />

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

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                placeholder="Create strong password..."
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />

              {/* Password strength meter */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-semibold text-slate-200">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password..."
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              required
            />

            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                I agree to the Terms of Service & Privacy Vault
              </label>
              {errors.terms && (
                <p className="text-xs text-rose-500 font-medium pl-1">{errors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={loading}
              icon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
