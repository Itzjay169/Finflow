import { motion } from 'framer-motion'
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, Scale } from 'lucide-react'
import { siteConfig } from '../config/site'


export default function TermsPage() {
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
          <Scale className="w-3.5 h-3.5" /> Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Use
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Terms governing your access to and usage of the FinFlow personal finance tracker and ML services.
        </p>
      </motion.div>

      {/* Main Content Panels */}
      <div className="space-y-6">
        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            By creating an account, accessing the application, or interacting with the FinFlow API, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, you must discontinue use of the platform immediately.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Permitted Use & Account Integrity
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            FinFlow is granted to you solely for lawful personal finance management, budget planning, and predictive analysis. You are responsible for safeguarding your credentials, password, and session access tokens. You agree not to attempt reverse engineering, denial-of-service, or automated extraction of platform resources.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Intellectual Property
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            FinFlow, including its underlying software architecture, design tokens, graphics, interactive visual charts, and documentation, is the proprietary property of {siteConfig.ownerName}. All rights are strictly reserved. Third-party open-source libraries and typography packages incorporated into the project remain governed by their respective licenses.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Availability & Warranty Disclaimer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The platform is provided on an "as is" and "as available" basis without warranties of any kind. While we strive for high uptime and resilient data isolation via Supabase RLS, we do not warrant that service will be uninterrupted or error-free.
          </p>
        </section>
      </div>
    </div>
  )
}
