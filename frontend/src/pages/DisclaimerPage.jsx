import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Cpu, Database, ShieldAlert } from 'lucide-react'


export default function DisclaimerPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <ShieldAlert className="w-3.5 h-3.5" /> Financial & Model Disclaimers
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Financial & ML Disclaimer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Please read this essential advisory concerning financial information, automated machine learning inferences, and demonstration benchmarks.
        </p>
      </motion.div>

      {/* Main Content Panels */}
      <div className="space-y-6">
        <section className="glass-card p-6 sm:p-8 space-y-4 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Not Financial, Tax, or Investment Advice
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            All analytics, cashflow aggregations, budgeting recommendations, savings rate calculations, and visual telemetry provided across FinFlow are for <strong>informational and educational purposes only</strong>.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            FinFlow does not provide certified financial advisory services, tax planning advice, legal counsel, or investment recommendations. Always consult a licensed Chartered Accountant (CA) or certified financial planner before making significant financial commitments or tax decisions.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Best-Effort Machine Learning Predictions
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The income and expense prediction engine utilizes a trained <strong>RandomForest classifier</strong>. Inferences produced by this model represent probabilistic, best-effort statistical estimations.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Because the pipeline consumes strictly four feature inputs (<strong>transaction amount, date string, payment mode, and city location</strong>), the model does not possess visibility into transaction counterparty, merchant category code (MCC), or invoice context. Inferences should always be reviewed and confirmed by the user before committing to personal ledgers.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Synthetic Demonstration Data
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The benchmark dataset containing 1,200 transactions across 14 categories, 6 payment modes, and 10 Indian metropolitan cities is <strong>fully synthetic and computer-generated</strong>.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            It does not reflect any actual individual’s financial records, real bank statements, or live account balances. It is supplied purely to validate inference models, render benchmark charts, and facilitate seamless evaluation of FinFlow’s telemetry tools.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. User Responsibility
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            By utilizing FinFlow, you acknowledge that you remain exclusively responsible for verifying the completeness, accuracy, and categorizations of your transaction entries and budget allocations.
          </p>
        </section>
      </div>
    </div>
  )
}
