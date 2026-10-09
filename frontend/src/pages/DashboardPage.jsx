import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui'
import { LayoutDashboard, Sparkles, TrendingUp, TrendingDown, IndianRupee, Activity } from 'lucide-react'
import { formatINR } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good evening, <span className="gradient-text">{userName}</span> 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            FinFlow Financial Dashboard &bull; Phase 2 Auth Verified
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="income">RLS Isolated</Badge>
          <Badge variant="primary">Demo Session Active</Badge>
        </div>
      </div>

      {/* KPI Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card glow className="border-emerald-500/20">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase">Total Income</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-100 font-mono">{formatINR(542800)}</div>
            <p className="text-xs text-emerald-400 mt-1">+14.2% vs last month</p>
          </CardContent>
        </Card>

        <Card glow className="border-rose-500/20">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-rose-400 uppercase">Total Expenses</span>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-100 font-mono">{formatINR(318450)}</div>
            <p className="text-xs text-rose-400 mt-1">+6.8% vs last month</p>
          </CardContent>
        </Card>

        <Card glow className="border-indigo-500/20">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase">Net Savings</span>
            <IndianRupee className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-100 font-mono">{formatINR(224350)}</div>
            <p className="text-xs text-indigo-400 mt-1">41.3% savings rate</p>
          </CardContent>
        </Card>

        <Card glow className="border-cyan-500/20">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-cyan-400 uppercase">Model Status</span>
            <Activity className="w-5 h-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-100 font-mono">95.8% Acc</div>
            <p className="text-xs text-cyan-400 mt-1">18 feature pipeline active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication & Protected Workspace Verified</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            You are securely authenticated in the FinFlow protected route environment.
            Phase 3 will connect the data ingestion layer and analytical endpoints.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
