import { motion } from 'framer-motion'
import { Shield, Lock, Database, UserCheck, Trash2, Cookie } from 'lucide-react'
import { siteConfig } from '../config/site'


export default function PrivacyPage() {
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
          <Shield className="w-3.5 h-3.5" /> Privacy & Data Governance
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          How FinFlow protects your personal records, enforces zero-knowledge tenancy, and keeps your finances strictly private.
        </p>
      </motion.div>

      {/* Main Content Panels */}
      <div className="space-y-6">
        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. What Information We Store
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            FinFlow stores only the minimum operational records necessary to compute your financial dashboards, ML predictions, and budgeting goals:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-2">
            <li><strong>User Profile:</strong> Your account email, optional display name, preferred currency (default INR ₹), and interface theme preference.</li>
            <li><strong>Transactions:</strong> Amount, transaction date, category, transaction type (Income or Expense), payment mode, city location, and optional personal notes.</li>
            <li><strong>Budgets & Goals:</strong> Monthly category expense limits, designated savings targets, target dates, and accumulated contributions.</li>
            <li><strong>Recurring Items:</strong> Scheduled recurring bills, subscription cadences, and projected due dates.</li>
            <li><strong>Prediction History:</strong> Inference logs containing amount, payment mode, city, and model confidence scores for your audit trail.</li>
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Data Processor & Row Level Security (RLS)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Our cloud persistence layer is powered by <strong>Supabase Postgres</strong> as the primary data processor. Every database table enforces PostgreSQL <strong>Row Level Security (RLS)</strong> with strict tenant isolation:
          </p>
          <div className="bg-slate-100 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-500 dark:text-indigo-400">
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            This guarantees cryptographic database-level isolation: User A cannot read, query, update, or delete any ledger record belonging to User B under any circumstances.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Zero Data Selling or Third-Party Sharing
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            We operate under a strict zero-monetization-of-data pledge: <strong>we never sell, license, rent, or transfer your personal data, transaction history, or spending habits</strong> to marketing networks, brokers, credit rating bureaus, or advertising aggregators.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Cookie className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Essential Browser Storage Only
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            FinFlow uses local browser storage exclusively for necessary functionality:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-2">
            <li><strong>Session Authentication:</strong> JWT bearer tokens required to verify your encrypted API requests.</li>
            <li><strong>UI Theme Preference:</strong> Remembering your selection between luxury dark obsidian and crisp light canvas modes.</li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            We load zero third-party cross-site trackers or ad cookies.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. Data Deletion & Account Erasure
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            You retain absolute ownership over your financial records. You can delete individual transactions, purge monthly budgets, or clear your entire history directly from the Transactions interface or Settings. To request immediate permanent deletion of your account and all associated database records, visit <strong>Settings &gt; Delete Account</strong> or email our privacy desk at{' '}
            {siteConfig.contactEmail ? (
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-indigo-400 underline hover:text-indigo-300">
                {siteConfig.contactEmail}
              </a>
            ) : (
              <span>our support address</span>
            )}.
          </p>
        </section>
      </div>
    </div>
  )
}
