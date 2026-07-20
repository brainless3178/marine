import { useState, useEffect } from 'react'
import { Monitor, Cpu, HardDrive, Clock, Zap, AlertTriangle } from 'lucide-react'

interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstPaint: number
  bundleSize: string
  memoryUsage: string
  jsHeapUsed: string
  cssSheetCount: number
  jsScriptCount: number
  errorCount: number
  resourceCount: number
  totalTransferSize: string
}

export function SystemPerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  useEffect(() => {
    const collect = () => {
      const perf = performance
      const nav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const resources = perf.getEntriesByType('resource') as PerformanceResourceTiming[]
      const paint = perf.getEntriesByType('paint')

      const loadTime = nav ? nav.loadEventEnd - nav.startTime : 0
      const domContentLoaded = nav ? nav.domContentLoadedEventEnd - nav.startTime : 0
      const firstPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0

      const totalTransfer = resources.reduce((s, r) => s + (r.transferSize || 0), 0)
      const cssCount = resources.filter(r => r.initiatorType === 'css' || r.name.endsWith('.css')).length
      const jsCount = resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js')).length

      const mem = (performance as any).memory
      const memoryUsage = mem ? `${Math.round(mem.usedJSHeapSize / 1048576)}MB / ${Math.round(mem.totalJSHeapSize / 1048576)}MB` : 'N/A'
      const jsHeapUsed = mem ? `${Math.round(mem.usedJSHeapSize / 1048576)}MB` : 'N/A'

      // Estimate bundle from JS resources
      const jsSize = resources.filter(r => r.name.endsWith('.js')).reduce((s, r) => s + (r.transferSize || 0), 0)

      setMetrics({
        loadTime: Math.round(loadTime),
        domContentLoaded: Math.round(domContentLoaded),
        firstPaint: Math.round(firstPaint),
        bundleSize: formatBytes(jsSize),
        memoryUsage, jsHeapUsed,
        cssSheetCount: cssCount,
        jsScriptCount: jsCount,
        errorCount: 0,
        resourceCount: resources.length,
        totalTransferSize: formatBytes(totalTransfer),
      })
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') collect()
    else window.addEventListener('load', collect)

    // Listen for JS errors
    const errorHandler = () => setMetrics(prev => prev ? { ...prev, errorCount: prev.errorCount + 1 } : prev)
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

  if (!metrics) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={16} className="text-[var(--accent-blue)]" />
          <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">System Performance</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] text-center py-6">Collecting performance data...</p>
      </div>
    )
  }

  const getScore = (ms: number, good: number, bad: number) => {
    if (ms <= good) return { label: 'Good', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' }
    if (ms <= bad) return { label: 'Needs Work', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' }
    return { label: 'Poor', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10' }
  }

  const loadScore = getScore(metrics.loadTime, 3000, 6000)
  const paintScore = getScore(metrics.firstPaint, 1800, 3000)
  const domScore = getScore(metrics.domContentLoaded, 2000, 4000)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Monitor size={16} className="text-[var(--accent-blue)]" />
        <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">System Performance Dashboard</h2>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Load Time', value: `${metrics.loadTime}ms`, score: loadScore, icon: Clock },
          { label: 'First Paint', value: `${metrics.firstPaint}ms`, score: paintScore, icon: Zap },
          { label: 'DOM Ready', value: `${metrics.domContentLoaded}ms`, score: domScore, icon: Cpu },
        ].map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="rounded-xl bg-[var(--surface-soft)] p-3 text-center">
              <Icon size={14} className={`mx-auto mb-1 ${m.score.color}`} />
              <p className="font-mono text-sm font-extrabold text-[var(--text-primary)]">{m.value}</p>
              <p className="text-[0.5rem] text-[var(--text-muted)] font-bold uppercase">{m.label}</p>
              <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[0.4rem] font-bold ${m.score.bg} ${m.score.color}`}>{m.score.label}</span>
            </div>
          )
        })}
      </div>

      {/* Resource metrics */}
      <div className="space-y-2">
        {[
          { label: 'Bundle Size (JS)', value: metrics.bundleSize, icon: HardDrive },
          { label: 'Total Transfer', value: metrics.totalTransferSize, icon: HardDrive },
          { label: 'Memory Usage', value: metrics.memoryUsage, icon: Cpu },
          { label: 'JS Heap', value: metrics.jsHeapUsed, icon: Cpu },
          { label: 'Resources Loaded', value: metrics.resourceCount.toString(), icon: Monitor },
          { label: 'JS Scripts', value: metrics.jsScriptCount.toString(), icon: Zap },
          { label: 'CSS Stylesheets', value: metrics.cssSheetCount.toString(), icon: Zap },
          { label: 'JS Errors', value: metrics.errorCount.toString(), icon: AlertTriangle },
        ].map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="flex items-center justify-between rounded-lg bg-[var(--surface-soft)] px-3 py-1.5">
              <div className="flex items-center gap-2">
                <Icon size={10} className="text-[var(--text-muted)]" />
                <span className="text-[0.625rem] text-[var(--text-secondary)]">{m.label}</span>
              </div>
              <span className={`font-mono text-[0.625rem] font-bold ${m.label.includes('Error') && metrics.errorCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>{m.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
