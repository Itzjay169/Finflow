import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center animate-fade-in">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-700/60 shadow-2xl space-y-5">
        <motion.div
          initial={{ rotate: -20, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl mx-auto bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30"
        >
          <Compass className="w-8 h-8 animate-spin-slow" />
        </motion.div>

        <div>
          <span className="text-4xl font-black text-indigo-400 block font-mono">404</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            The destination you requested doesn't exist or has moved to another location.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Return Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="gradient" size="sm" className="gap-1.5">
              <Home className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
