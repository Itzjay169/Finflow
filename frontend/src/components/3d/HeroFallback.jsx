import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Sparkles, Shield, Coins } from 'lucide-react'

export const HeroFallback = () => {
  return (
    <div className="relative w-full h-[360px] sm:h-[440px] flex items-center justify-center">
      {/* Radial backlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Animated 2.5D Financial Isometric Illustration */}
      <div className="relative z-10 w-full max-w-sm p-6 glass-card border border-indigo-500/30 text-center space-y-4">
        <motion.div
          animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/40 border border-indigo-500/30 p-1 bg-slate-900/40 backdrop-blur-md"
        >
          <img src="/logo.png" alt="FinFlow Logo" className="w-full h-full object-cover rounded-2xl" />
        </motion.div>

        <div>
          <h3 className="font-extrabold text-xl tracking-tight gradient-text">FinFlow 3D Intelligence</h3>
          <p className="text-xs text-slate-400 mt-1">Real-time dynamic financial tracking & AI classification</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="glass-panel p-3 rounded-xl border-emerald-500/30 text-left">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Income Mode</span>
            <span className="text-base font-bold text-slate-100 font-mono">₹85,000</span>
          </div>
          <div className="glass-panel p-3 rounded-xl border-rose-500/30 text-left">
            <span className="text-[10px] text-rose-400 font-bold uppercase block">Expenses</span>
            <span className="text-base font-bold text-slate-100 font-mono">₹24,300</span>
          </div>
        </div>
      </div>
    </div>
  )
}
