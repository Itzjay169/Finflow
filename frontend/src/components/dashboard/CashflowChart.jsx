import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui'
import { TrendingUp, BarChart3, LineChart, Calendar } from 'lucide-react'
import { formatINR } from '../../lib/utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">Monthly Inflow/Outflow</span>
        </p>
        {payload.map((entry, index) => {
          const isIncome = entry.name.toLowerCase().includes('income')
          const isExpense = entry.name.toLowerCase().includes('expense')
          const colorClass = isIncome
            ? 'text-emerald-400'
            : isExpense
            ? 'text-rose-400'
            : 'text-indigo-400'

          return (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className={`font-mono font-bold ${colorClass}`}>
                {formatINR(entry.value)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

export const CashflowChart = ({ data = [], loading = false }) => {
  const [chartType, setChartType] = useState('area') // 'area' | 'bar'
  const [timeRange, setTimeRange] = useState('12m') // '6m' | '12m' | 'all'

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    if (timeRange === '6m') return data.slice(-6)
    if (timeRange === '12m') return data.slice(-12)
    return data
  }, [data, timeRange])

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
            <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Monthly Cashflow Telemetry
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare monthly income inflows vs expense outflows across financial cycles
          </p>
        </div>

        {/* Controls: Chart Type & Time Range Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Type Toggle */}
          <div className="relative flex items-center bg-slate-200/80 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`relative px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer z-10 active:scale-95 ${
                chartType === 'area'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {chartType === 'area' && (
                <motion.div
                  layoutId="chartTypeTogglePill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 shadow-[0_2px_12px_rgba(99,102,241,0.45)] border border-indigo-400/30 z-[-1]"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <LineChart className="w-3.5 h-3.5" />
              Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`relative px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer z-10 active:scale-95 ${
                chartType === 'bar'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {chartType === 'bar' && (
                <motion.div
                  layoutId="chartTypeTogglePill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 shadow-[0_2px_12px_rgba(99,102,241,0.45)] border border-indigo-400/30 z-[-1]"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <BarChart3 className="w-3.5 h-3.5" />
              Bar
            </button>
          </div>

          {/* Time range pills */}
          <div className="relative flex items-center bg-slate-200/80 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-300/80 dark:border-slate-800 text-xs shadow-inner">
            {['6m', '12m', 'all'].map((range) => {
              const isSelected = timeRange === range
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`relative px-2.5 py-1.5 rounded-xl uppercase text-[10px] font-bold transition-colors cursor-pointer z-10 active:scale-95 ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="chartRangeTogglePill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 shadow-[0_2px_10px_rgba(6,182,212,0.4)] border border-cyan-400/30 z-[-1]"
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    />
                  )}
                  {range}
                </button>
              )
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-xs animate-pulse">
            Loading cashflow telemetry...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
            <Calendar className="w-8 h-8 text-slate-600" />
            <p>No transaction history recorded yet.</p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={filteredData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={filteredData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
