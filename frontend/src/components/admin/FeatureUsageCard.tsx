import { BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getAdminAnalytics, type AdminFeatureUsageItem } from '@/api/admin'

// Same cadence as AccountUsageCard/AdminStatCards — this doesn't need to be
// as fresh as the Active Sessions view.
const POLL_INTERVAL_MS = 60_000

// Only two exam modes exist server-side today (tos_simulator, subject_drill)
// — classic quizzes/flashcards/AI variation mode have no backend telemetry,
// so they simply can't appear here. Extra colors are unused until more modes exist.
const BAR_COLORS = ['#7A2323', '#C4707A', '#E0AC48', '#E0AC48CC', '#E0C88A']

export function FeatureUsageCard() {
  const [featureUsage, setFeatureUsage] = useState<AdminFeatureUsageItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      getAdminAnalytics()
        .then((data) => {
          if (cancelled) return
          setFeatureUsage(data.featureUsage)
          setError(null)
        })
        .catch(() => {
          if (cancelled) return
          setError('Unable to load feature usage. Is the backend running?')
        })
    }

    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
          <BarChart3 className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-[#3A2A1A]">Feature Usage</p>
          <p className="font-reading text-xs text-[#3A2A1A]/60">Which exam modes are generated most.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-[#7A2323]">{error}</p>}

      {!error && featureUsage === null && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">Loading feature usage…</p>
      )}

      {!error && featureUsage !== null && featureUsage.length === 0 && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">No bank exams have been generated yet.</p>
      )}

      {!error && featureUsage !== null && featureUsage.length > 0 && (
        <div className="mt-5 flex flex-col gap-4">
          {featureUsage.map((feature, i) => (
            <div key={feature.mode}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-[#3A2A1A]">{feature.label}</span>
                <span className="font-semibold text-[#3A2A1A]">{feature.percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${feature.percent}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
