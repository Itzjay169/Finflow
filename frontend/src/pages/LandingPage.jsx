import React, { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Cpu,
  Shield,
  PieChart,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle,
  IndianRupee,
  Calendar,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui'
import { HeroFallback } from '../components/3d/HeroFallback'
import { useAuth } from '../context/AuthContext'

const HeroScene = lazy(() => import('../components/3d/HeroScene'))

export default function LandingPage() {
  const navigate = useNavigate()
  const { signInWithDemo } = useAuth()

  const handleDemoLogin = () => {
    signInWithDemo()
    navigate('/dashboard')
  }

  const features = [
    {
      icon: Cpu,
      title: '95.8% AI Transaction Classifier',
      description: 'Random Forest ML engine predicts Income vs Expense from amount, date, payment mode, and location in real-time.',
      badge: 'Machine Learning',
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
    },
    {
      icon: IndianRupee,
      title: 'Indian Rupee Financial Engine',
      description: 'Full support for Indian number formatting (₹1,23,456), UPI, Net Banking, and regional business centers.',
      badge: 'Localized',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    },
    {
      icon: PieChart,
      title: 'Smart Budgeting & Alerts',
      description: 'Category monthly limits that turn yellow at 80% and red when exceeded, with automatic toast warning alerts.',
      badge: 'Budgeting',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    },
    {
      icon: Shield,
      title: 'Supabase Row Level Security',
      description: 'Enterprise PostgreSQL security where each user can only read and write their own financial records.',
      badge: 'Security',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
    },
    {
      icon: Calendar,
      title: 'GitHub-Style Expense Heatmap',
      description: 'Daily expense intensity matrix across the year to identify spending spikes, weekends, and patterns.',
      badge: 'Analytics',
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    },
    {
      icon: Zap,
      title: 'Sample Data Ingestion (1,200 Rows)',
      description: 'One-click ingestion of the entire benchmark dataset to immediately explore deep analytics and charts.',
      badge: 'Instant Setup',
      color: 'from-rose-500/20 to-red-500/10 border-rose-500/30',
    },
  ]

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-indigo-500/30">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Random Forest ML &bull; 95.8% Prediction Accuracy
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none">
              Take complete control of your <br />
              <span className="gradient-text">financial velocity.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              FinFlow delivers real-time wealth telemetry, automated AI transaction classification,
              category budgets, and predictive cash flow modeling engineered with Supabase and FastAPI.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="gradient"
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleDemoLogin}
              >
                Try Demo Account
              </Button>
            </div>

            {/* Micro proof badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>1,200 Benchmark Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero Latency Local Fallback</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Row Level Security (RLS)</span>
              </div>
            </div>
          </motion.div>

          {/* Right 3D Interactive Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <Suspense fallback={<HeroFallback />}>
              <HeroScene />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Model Performance Stats Banner */}
      <section className="glass-panel rounded-3xl p-8 border border-slate-700/60 shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-mono">95.8%</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Classification Accuracy</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">1.00</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expense Recall</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">18</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trained Feature Dimensions</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-400 font-mono">1,200+</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verified Dataset Rows</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="violet" size="md">Core Capabilities</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Engineered for modern personal wealth
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From predictive classification to real-time budget threshold warnings, everything you need to command your finances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card interactive glow className={`h-full bg-gradient-to-br ${feature.color}`}>
                <CardHeader>
                  <div className="flex items-center justify-between pb-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-indigo-400 border border-slate-700/60">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral" size="sm">{feature.badge}</Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-100">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to action section */}
      <section className="glass-panel rounded-3xl p-10 text-center space-y-6 border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-500/10 pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to track with precision?
          </h2>
          <p className="text-slate-400 text-sm">
            Experience FinFlow immediately with the pre-seeded demo account or register your private vault with Supabase Row Level Security.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="gradient"
              size="lg"
              onClick={handleDemoLogin}
              icon={Sparkles}
            >
              Launch Demo Workspace
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
