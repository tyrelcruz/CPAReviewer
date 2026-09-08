import { Clock, FileCheck, LogIn, UserPlus, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getAdminAnalytics, type AdminRecentActivityItem } from '@/api/admin'
import { formatRelativeTime } from '@/lib/time'

const POLL_INTERVAL_MS = 60_000

const TYPE_STYLE: Record<AdminRecentActivityItem['type'], { icon: LucideIcon; color: string; bg: string }> = {
  registration: { icon: UserPlus, color: '#3A5A40', bg: '#3A5A401A' },
  login: { icon: LogIn, color: '#3A6B8A', bg: '#3A6B8A1A' },
  exam_generated: { icon: FileCheck, color: '#B4791F', bg: '#E0AC481A' },
  exam_submitted: { icon: FileCheck, color: '#7A2323', bg: '#7A23231A' },
}

export function RecentActivityCard() {
  const [activity, setActivity] = useState<AdminRecentActivityItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      getAdminAnalytics()
        .then((data) => {
          if (cancelled) return
          setActivity(data.recentActivity)
          setError(null)
        })
        .catch(() => {
          if (cancelled) return
          setError('Unable to load recent activity. Is the backend running?')
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
          <Clock className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-[#3A2A1A]">Recent Activity</p>
          <p className="font-reading text-xs text-[#3A2A1A]/60">Latest platform events and user actions.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-[#7A2323]">{error}</p>}

      {!error && activity === null && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">Loading recent activity…</p>
      )}

      {!error && activity !== null && activity.length === 0 && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">Nothing has happened yet.</p>
      )}

      {!error && activity !== null && activity.length > 0 && (
        <ul className="mt-5 flex flex-col gap-4">
          {activity.map((entry) => {
            const style = TYPE_STYLE[entry.type]
            return (
              <li key={entry.id} className="flex items-start gap-3">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: style.bg, color: style.color }}
                >
                  <style.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#3A2A1A]">{entry.title}</p>
                  <p className="truncate text-xs text-[#3A2A1A]/60">{entry.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-[#3A2A1A]/50">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
