import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Check, X, LayoutDashboard, Cpu, Target } from 'lucide-react'
import { Button } from '../ui'

const TOUR_STEPS = [
  {
    title: 'Welcome to FinFlow',
    subtitle: 'Next-Gen Financial Intelligence',
    description:
      'Track your personal cashflow, manage transactions with bank-level security, and harness machine learning.',
    icon: LayoutDashboard,
    badge: 'Step 1 of 3',
  },
  {
    title: '99.2% Accurate ML Inference',
    subtitle: 'Random Forest Transaction Classifier',
    description:
      'Classify inflows and expenses in real-time based on amount, date, payment mode, and location vectors.',
    icon: Cpu,
    badge: 'Step 2 of 3',
  },
  {
    title: 'Budgets & Financial Milestones',
    subtitle: 'Stay on Track Every Month',
    description:
      'Set category caps with visual alerts, monitor upcoming recurring bills, and fund your long-term savings goals.',
    icon: Target,
    badge: 'Step 3 of 3',
  },
]

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('finflow_onboarding_completed')
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('finflow_onboarding_completed', 'true')
    setIsOpen(false)
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-indigo-500/30 relative overflow-hidden text-center"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={handleComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4 pt-2">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Icon className="w-7 h-7" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            {step.badge}
          </span>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-cyan-400 mt-0.5">
              {step.subtitle}
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
            {step.description}
          </p>

          {/* Stepper dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Skip Tour
            </button>
            <Button variant="gradient" size="sm" onClick={handleNext} className="gap-1.5 px-5">
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4" /> Get Started
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
