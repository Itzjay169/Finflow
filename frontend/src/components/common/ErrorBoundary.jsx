import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '../ui'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[FinFlow ErrorBoundary Caught]:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl mx-auto bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Something unexpected occurred
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                An application error was caught by the FinFlow safety boundary.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-900 text-rose-400 font-mono text-[11px] text-left overflow-x-auto border border-slate-800">
                {this.state.error.message}
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => (window.location.href = '/dashboard')}
                className="gap-1.5"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
