import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { CreditCard, MapPin, Smartphone, Banknote, Landmark } from 'lucide-react'
import { formatCurrency, formatCompactCurrency, formatINR } from '../../lib/utils'
import { usePreferences } from '../../context/PreferencesContext'

const PAYMENT_ICONS = {
  UPI: Smartphone,
  Cash: Banknote,
  'Credit Card': CreditCard,
  'Debit Card': CreditCard,
  'Net Banking': Landmark,
  'Bank Transfer': Landmark,
}

const CustomBarTooltip = ({ active, payload, label }) => {
  const { preferences } = usePreferences() || {}
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="glass-panel p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl text-xs space-y-1 bg-white/95 dark:bg-slate-900/95">
        <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
          {formatCurrency(data.amount, preferences?.currency)}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          {data.percentage}% share &bull; {data.count} transactions
        </p>
      </div>
    )
  }
  return null
}

export const PaymentAndLocationCard = ({
  paymentData = [],
  locationData = [],
  loading = false,
}) => {
  const { preferences } = usePreferences() || {}
  const [activeTab, setActiveTab] = useState('payment') // 'payment' | 'location'

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
            {activeTab === 'payment' ? (
              <CreditCard className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            ) : (
              <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            )}
            {activeTab === 'payment' ? 'Payment Channels' : 'Regional Analytics'}
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'payment'
              ? 'Volume by UPI, Cards, Net Banking & Cash'
              : 'Geographic distribution across Indian metro centers'}
          </p>
        </div>

        {/* Animated sliding pill toggle switch */}
        <div className="relative flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`relative px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
              activeTab === 'payment'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'payment' && (
              <motion.div
                layoutId="paymentLocationTogglePill"
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-md shadow-cyan-500/25 -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <CreditCard className="w-3.5 h-3.5" />
            Payment Modes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`relative px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer z-10 ${
              activeTab === 'location'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'location' && (
              <motion.div
                layoutId="paymentLocationTogglePill"
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-md shadow-amber-500/25 -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <MapPin className="w-3.5 h-3.5" />
            Locations
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-xs animate-pulse">
            Loading distribution analytics...
          </div>
        ) : activeTab === 'payment' ? (
          <div className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val, preferences?.currency)}
                  />
                  <YAxis
                    type="category"
                    dataKey="payment_mode"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill="#06b6d4"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {paymentData.slice(0, 6).map((pm) => {
                const Icon = PAYMENT_ICONS[pm.payment_mode] || CreditCard
                return (
                  <div
                    key={pm.payment_mode}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-200 truncate">
                        {pm.payment_mode}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatCurrency(pm.amount, preferences?.currency)} ({pm.percentage}%)
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={locationData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val, preferences?.currency)}
                  />
                  <YAxis
                    type="category"
                    dataKey="location"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {locationData.slice(0, 6).map((loc) => (
                <div
                  key={loc.location}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-200 truncate">
                      {loc.location}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {formatCurrency(loc.amount, preferences?.currency)} ({loc.percentage}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
