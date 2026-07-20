import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

interface Props {
  children: ReactNode
  pageName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Admin ErrorBoundary] ${this.props.pageName || 'Page'}:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoBack = () => {
    window.location.href = '/admin'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10 mb-6">
            <AlertTriangle size={32} className="text-[var(--danger)]" />
          </div>
          <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-1 max-w-md">
            The {this.props.pageName || 'page'} encountered an unexpected error.
          </p>
          {this.state.error && (
            <p className="text-[0.625rem] font-mono text-[var(--text-muted)]/60 mb-6 max-w-lg break-all">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleGoBack}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-xs font-extrabold text-navy-deep hover:bg-[var(--gold-light)] transition-colors"
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
