import React, { useState } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { PieChart as PieIcon } from 'lucide-react'
import { formatINR } from '../../lib/utils'

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#eab308', // Yellow
]

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="glass-panel p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl text-xs space-y-1 bg-white/95 dark:bg-slate-900/95">
        <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: data.fill }}
          />
          {data.category}
        </p>
        <p className="text-slate-700 dark:text-slate-300 font-mono font-semibold">
          {formatINR(data.amount)}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          {data.percentage}% of total expenses ({data.count} items)
        </p>
      </div>
    )
  }
  return null
}

export const CategoryDonutChart = ({ data = [], loading = false }) => {
  const [activeIndex, setActiveIndex] = useState(null)

  const totalExpense = data.reduce((acc, cur) => acc + (cur.amount || 0), 0)

  // Chart data formatted with fill colors
  const chartData = data.map((item, idx) => ({
    ...item,
    fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }))

  const activeItem = activeIndex !== null ? chartData[activeIndex] : null

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
            <PieIcon className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            Expenses by Category
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Breakdown across top expenditure categories
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Spent</span>
          <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{formatINR(totalExpense)}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-xs animate-pulse">
            Analyzing spending categories...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
            No expense records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Donut Chart with Center stats */}
            <div className="md:col-span-6 relative h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={68}
                    outerRadius={95}
                    paddingAngle={3}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke="transparent"
                        strokeWidth={2}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {activeItem ? activeItem.category : 'Top Spend'}
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono leading-tight">
                  {activeItem ? formatINR(activeItem.amount) : formatINR(chartData[0]?.amount || 0)}
                </span>
                <span className="text-[10px] text-pink-500 dark:text-pink-400 font-semibold">
                  {activeItem ? `${activeItem.percentage}%` : `${chartData[0]?.percentage || 0}%`}
                </span>
              </div>
            </div>

            {/* Category Progress Bars */}
            <div className="md:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {chartData.slice(0, 6).map((item, idx) => (
                <div
                  key={item.category}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeIndex === idx
                      ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      {item.category}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">{item.percentage}%</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatINR(item.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.fill,
                      }}
                    />
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
