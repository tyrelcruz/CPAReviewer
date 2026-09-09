import { AlertTriangle, BookOpen, CalendarDays, ChevronRight, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

import { REVIEW_PLAN_TYPE_STYLES } from '@/data/dashboard-data'
import { dateKey } from '@/lib/time'
import type { ReviewPlanEntry, ReviewPlanEntryType } from '@/lib/reviewPlanner'

interface UpcomingPanelProps {
  entries: ReviewPlanEntry[]
  onSelect: (dateKey: string) => void
}

const TYPE_ICONS: Record<ReviewPlanEntryType, LucideIcon> = {
  Review: BookOpen,
  Exam: CalendarDays,
  Quiz: Target,
  Deadline: AlertTriangle,
}

const COLLAPSED_LIMIT = 5

export function UpcomingPanel({ entries, onSelect }: UpcomingPanelProps) {
  const [showAll, setShowAll] = useState(false)
  const todayKey = dateKey(new Date())

  const upcoming = useMemo(
    () =>
      entries
        .filter((entry) => entry.date >= todayKey)
        .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
    [entries, todayKey],
  )

  const visible = showAll ? upcoming : upcoming.slice(0, COLLAPSED_LIMIT)

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#7A2323]/10 text-[#7A2323]">
            <CalendarDays className="size-4" />
          </span>
          <p className="font-semibold text-[#3A2A1A]">Upcoming</p>
        </div>
        {upcoming.length > COLLAPSED_LIMIT && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-[#7A2323] hover:underline"
          >
            {showAll ? 'Show less' : 'View All'}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <p className="font-reading mt-4 text-sm text-[#3A2A1A]/55">
          Nothing scheduled yet — add a review, exam, or quiz to your calendar.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {visible.map((entry) => {
            const Icon = TYPE_ICONS[entry.type]
            const style = REVIEW_PLAN_TYPE_STYLES[entry.type]
            const dateLabel = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.date)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#FBF3EA]"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${style.hex}1A`, color: style.hex }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#3A2A1A]">{entry.title}</p>
                    <p className="font-reading mt-0.5 truncate text-xs text-[#3A2A1A]/55">
                      {dateLabel}
                      {entry.time ? ` · ${entry.time}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
                    {entry.type}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[#3A2A1A]/30" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
