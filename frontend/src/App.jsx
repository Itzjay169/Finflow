import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Bell,
  Search,
  Lock,
  Mail,
  IndianRupee,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Badge,
  Toggle,
  ThemeToggle,
  Tabs,
  Skeleton,
  CardSkeleton,
  Modal,
  useToast,
} from './components/ui'
import { formatINR } from './lib/utils'

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toggleVal, setToggleVal] = useState(true)
  const [backendStatus, setBackendStatus] = useState({ status: 'checking', service: '', environment: '', model_available: false })
  const { toast } = useToast()

  // Apply dark class to document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Fetch backend health
  useEffect(() => {
    fetch('http://127.0.0.1:8000/health')
      .then((res) => res.json())
      .then((data) => setBackendStatus(data))
      .catch(() => setBackendStatus({ status: 'offline', error: 'Backend server offline or starting...' }))
  }, [])

  const sampleTabs = [
    { id: 'all', label: 'All Operations', count: 1200 },
    { id: 'income', label: 'Income', count: 280 },
    { id: 'expense', label: 'Expenses', count: 920 },
    { id: 'model', label: 'ML Insights' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Decorative ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Navigation Bar */}
        <header className="glass-panel rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight gradient-text">FinFlow</span>
                <Badge variant="primary" size="sm">Phase 1 Setup</Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Personal Finance Tracker & ML Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-xs">
              <span className={`w-2 h-2 rounded-full ${backendStatus.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                API: {backendStatus.status === 'healthy' ? 'Online (FastAPI)' : 'Checking...'}
              </span>
            </div>

            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            
            <Button
              variant="gradient"
              size="sm"
              icon={Sparkles}
              onClick={() => toast.success('FinFlow Phase 1 Design System & Architecture Active!')}
            >
              Test Notification
            </Button>
          </div>
        </header>

        {/* Hero Banner */}
        <section className="text-center space-y-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="violet" size="md" className="mb-3">
              ✦ Built with React 19, Tailwind CSS, Framer Motion & FastAPI
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Design System & Architecture <br />
              <span className="gradient-text">Complete & Verified</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
              Reusable atomic component library with glassmorphic cards, Indian Rupee currency tokens,
              Framer Motion spring physics, dark/light theme switching, and pinned scikit-learn 1.5.2 inference.
            </p>
          </motion.div>
        </section>

        {/* KPI Summary Cards Showcase */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              Live KPI Financial Cards
            </h2>
            <Tabs tabs={sampleTabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Income Card */}
            <Card interactive glow className="border-emerald-500/20">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Total Income
                </CardDescription>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  {formatINR(542800)}
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Badge variant="income" size="sm">+14.2%</Badge>
                  <span className="text-slate-400 text-[11px]">vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Expense Card */}
            <Card interactive glow className="border-rose-500/20">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Total Expenses
                </CardDescription>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  {formatINR(318450)}
                </div>
                <div className="flex items-center gap-2 text-xs text-rose-400">
                  <Badge variant="expense" size="sm">+6.8%</Badge>
                  <span className="text-slate-400 text-[11px]">vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Net Savings Card */}
            <Card interactive glow className="border-indigo-500/20">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Net Savings
                </CardDescription>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  {formatINR(224350)}
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <Badge variant="primary" size="sm">+24.5%</Badge>
                  <span className="text-slate-400 text-[11px]">net positive</span>
                </div>
              </CardContent>
            </Card>

            {/* Savings Rate Card */}
            <Card interactive glow className="border-cyan-500/20">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Savings Rate
                </CardDescription>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  41.3%
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full w-[41%]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* UI Components Verification Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Component Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Interactive UI Controls
              </CardTitle>
              <CardDescription>Buttons, Toggles, Badges & Inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buttons Row */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Buttons</span>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="primary" size="sm">Primary</Button>
                  <Button variant="gradient" size="sm">Gradient</Button>
                  <Button variant="secondary" size="sm">Secondary</Button>
                  <Button variant="income" size="sm">Income</Button>
                  <Button variant="danger" size="sm">Expense</Button>
                  <Button variant="outline" size="sm">Outline</Button>
                  <Button variant="primary" size="sm" isLoading>Loading</Button>
                </div>
              </div>

              {/* Badges Row */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Badges</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="income">Income Active</Badge>
                  <Badge variant="expense">Expense Alert</Badge>
                  <Badge variant="primary">AI Classified</Badge>
                  <Badge variant="violet">Machine Learning</Badge>
                  <Badge variant="cyan">95.8% Accuracy</Badge>
                  <Badge variant="warning">Budget 85%</Badge>
                </div>
              </div>

              {/* Form Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Search Transactions"
                  placeholder="e.g. Swiggy, Salary..."
                  icon={Search}
                />
                <Input
                  label="Secure Password"
                  type="password"
                  placeholder="Enter password..."
                  icon={Lock}
                />
              </div>

              {/* Toggles and Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Toggle checked={toggleVal} onChange={setToggleVal} />
                  <span className="text-xs font-medium text-slate-400">
                    Live Prediction Auto-trigger: {toggleVal ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  icon={ArrowRight}
                >
                  Open Dialog Modal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Toast and Skeletons Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                Toast Notifications & Skeletons
              </CardTitle>
              <CardDescription>Notification triggers and shimmer loaders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toast buttons */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Toast Triggers</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="income"
                    size="sm"
                    onClick={() => toast.success('Salary credit of ₹85,000 recorded!')}
                  >
                    Success
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => toast.error('Monthly Dining budget exceeded by ₹2,400!')}
                  >
                    Error
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.warning('Upcoming Bill: Electricity due tomorrow')}
                  >
                    Warning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('Model confidence 98.2% for UPI transaction')}
                  >
                    Info
                  </Button>
                </div>
              </div>

              {/* Skeleton Loader Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Shimmer Skeleton Loaders</span>
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal Verification */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Transaction"
          description="Test dialog modal with animated pop-in and Escape key closing."
        >
          <div className="space-y-4">
            <Input label="Amount (INR)" placeholder="e.g. 1500" icon={IndianRupee} />
            <Input label="Category" placeholder="e.g. Food, Groceries, Salary" />
            <Input label="Notes" placeholder="Dinner with team" />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsModalOpen(false)
                  toast.success('Transaction created successfully!')
                }}
              >
                Save Transaction
              </Button>
            </div>
          </div>
        </Modal>

        {/* Footer info */}
        <footer className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>FinFlow – Personal Finance Tracker &bull; Phase 1 Verified &bull; Python FastAPI Backend & React Vite Frontend</p>
        </footer>
      </div>
    </div>
  )
}
