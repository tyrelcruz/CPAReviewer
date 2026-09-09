import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { REVIEW_PLAN_TYPE_STYLES } from '@/data/dashboard-data'
import { dateKey } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { StudyCalendarEntry } from '@/data/dashboard-data'
import type { ReviewPlanEntry } from '@/lib/reviewPlanner'

interface StudyPlanCardProps {
  entriesByDate: Record<string, StudyCalendarEntry[]>
  planEntries: ReviewPlanEntry[]
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface DayCell {
  dayNum: number
  key: string
}

export function StudyPlanCard({ entriesByDate, planEntries }: StudyPlanCardProps) {
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedKey, setSelectedKey] = useState(todayKey)

  const planByDate = useMemo(() => {
    const map = new Map<string, ReviewPlanEntry[]>()
    for (const entry of planEntries) {
      map.set(entry.date, [...(map.get(entry.date) ?? []), entry])
    }
    return map
  }, [planEntries])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const cells = useMemo<(DayCell | null)[]>(() => {
    const startOffset = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - startOffset + 1
      if (dayNum < 1 || dayNum > daysInMonth) return null
      return { dayNum, key: dateKey(new Date(viewYear, viewMonth, dayNum)) }
    })
  }, [viewYear, viewMonth])

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const selectedEntries = entriesByDate[selectedKey] ?? []
  const selectedPlanEntries = planByDate.get(selectedKey) ?? []
  const selectedLabel = new Date(`${selectedKey}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#3A2A1A]">Study Plan Calendar</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="rounded-md p-1 text-[#3A2A1A]/60 hover:bg-[#FBF3EA] hover:text-[#3A2A1A]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="w-28 text-center text-xs font-semibold text-[#3A2A1A]/70">{monthLabel}</p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="rounded-md p-1 text-[#3A2A1A]/60 hover:bg-[#FBF3EA] hover:text-[#3A2A1A]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <Link
        to="/app/review-planner"
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#7A2323] hover:underline"
      >
        Open Review Planner
        <span aria-hidden="true">→</span>
      </Link>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#3A2A1A]/45">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <span key={`pad-${i}`} />
          const hasActivity = (entriesByDate[cell.key]?.length ?? 0) > 0
          const cellPlanEntries = planByDate.get(cell.key) ?? []
          const hasPlan = cellPlanEntries.length > 0
          const isToday = cell.key === todayKey
          const isSelected = cell.key === selectedKey
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelectedKey(cell.key)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-[#7A2323] text-white'
                  : isToday
                    ? 'border border-[#7A2323]/50 text-[#3A2A1A]'
                    : 'text-[#3A2A1A]/80 hover:bg-[#FBF3EA]',
              )}
            >
              {cell.dayNum}
              {(hasActivity || hasPlan) && (
                <span className="absolute bottom-1 flex items-center gap-0.5">
                  {hasPlan && (
                    <span
                      className={cn(
                        'size-1 rounded-full',
                        isSelected ? 'bg-white' : REVIEW_PLAN_TYPE_STYLES[cellPlanEntries[0].type].dot,
                      )}
                    />
                  )}
                  {hasActivity && (
                    <span className={cn('size-1 rounded-full', isSelected ? 'bg-white' : 'bg-[#3A5A40]')} />
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl bg-[#FBF3EA] p-3">
        <p className="text-xs font-semibold text-[#3A2A1A]/60">{selectedLabel}</p>

        {selectedPlanEntries.length === 0 && selectedEntries.length === 0 && (
          <p className="font-reading mt-1 text-sm text-[#3A2A1A]/55">Nothing planned or studied on this day.</p>
        )}

        {selectedPlanEntries.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {selectedPlanEntries.map((entry) => {
              const style = REVIEW_PLAN_TYPE_STYLES[entry.type]
              return (
                <li key={entry.id} className="flex items-center gap-2 text-sm">
                  <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate font-semibold text-[#3A2A1A]',
                      entry.done && 'text-[#3A2A1A]/45 line-through',
                    )}
                  >
                    {entry.title}
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', style.pill)}>
                    {entry.type}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {selectedEntries.length > 0 && (
          <ul className={cn('flex flex-col gap-2', selectedPlanEntries.length > 0 ? 'mt-3' : 'mt-2')}>
            {selectedEntries.map((entry, i) => {
              const percent = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0
              return (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-semibold text-[#3A2A1A]">
                    {entry.subjectLabel}
                  </span>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#3A2A1A]/60">
                    {percent}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
