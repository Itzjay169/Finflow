import React from 'react'
import { motion } from 'framer-motion'
import { Cookie, CheckCircle2, ShieldCheck, Database, RefreshCw } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Cookie className="w-3.5 h-3.5" /> Browser Storage & State
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cookie & Storage Notice
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          FinFlow uses strictly essential browser storage to power authentication and user interface preferences.
        </p>
      </motion.div>

      {/* Main Content Panels */}
      <div className="space-y-6">
        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Zero Tracking Cookies
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            FinFlow does not use advertising cookies, marketing tracking pixels, behavioral telemetry cookies, or cross-site fingerprinting scripts. We believe your financial activity should remain completely invisible to ad networks.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Essential Local Storage Items
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Our application utilizes HTML5 Web Storage (localStorage) exclusively for these functional purposes:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold">
                  <th className="py-2.5 px-3">Storage Key</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Purpose & Lifespan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-mono text-indigo-400">sb-session</td>
                  <td className="py-2.5 px-3">Essential / Auth</td>
                  <td className="py-2.5 px-3">Maintains encrypted Supabase JWT session across page reloads. Cleared on sign out.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-indigo-400">finflow_demo_session</td>
                  <td className="py-2.5 px-3">Essential / Auth</td>
                  <td className="py-2.5 px-3">Retains the benchmark demo user session token in offline or local mode.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-indigo-400">finflow_onboarding_completed</td>
                  <td className="py-2.5 px-3">Preference</td>
                  <td className="py-2.5 px-3">Prevents the welcome product tour modal from re-triggering once dismissed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Managing Your Browser Storage
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            You can clear locally stored session keys at any time via your browser’s developer tools or settings ("Clear Browsing Data" &gt; "Cookies and site data"). Signing out of FinFlow automatically removes your active session tokens from the browser.
          </p>
        </section>
      </div>
    </div>
  )
}
