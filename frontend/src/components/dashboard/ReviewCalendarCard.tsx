import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo } from 'react'

import { GrungeOverlay } from '@/components/ui/GrungeOverlay'
import { REVIEW_PLAN_TYPE_STYLES, REVIEW_PLAN_TYPES } from '@/data/dashboard-data'
import { addDays, addMonths, dateKey } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { ReviewPlanEntry } from '@/lib/reviewPlanner'

export type CalendarViewMode = 'month' | 'week' | 'day'

interface ReviewCalendarCardProps {
  entries: ReviewPlanEntry[]
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  selectedDate: string
  onSelectedDateChange: (key: string) => void
  onDrillIntoDay: (key: string) => void
  onToggleDone: (id: string) => void
  onAddClick: () => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_PILLS_PER_CELL = 2

interface DayCell {
  dayNum: number
  key: string
  inCurrentMonth: boolean
}

function EntryPill({ entry, dense = false }: { entry: ReviewPlanEntry; dense?: boolean }) {
  const style = REVIEW_PLAN_TYPE_STYLES[entry.type]
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold',
        style.pill,
        entry.done && 'opacity-50 line-through',
        dense && 'py-1 text-xs',
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />
      <span className="truncate">{entry.title}</span>
    </span>
  )
}

export function ReviewCalendarCard({
  entries,
  viewMode,
  onViewModeChange,
  selectedDate,
  onSelectedDateChange,
  onDrillIntoDay,
  onToggleDone,
  onAddClick,
}: ReviewCalendarCardProps) {
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)
  const selected = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, ReviewPlanEntry[]>()
    for (const entry of entries) {
      map.set(entry.date, [...(map.get(entry.date) ?? []), entry])
    }
    return map
  }, [entries])

  const monthCells = useMemo<DayCell[]>(() => {
    const viewYear = selected.getFullYear()
    const viewMonth = selected.getMonth()
    const startOffset = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()

    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - startOffset + 1
      if (dayNum < 1) {
        const key = dateKey(new Date(viewYear, viewMonth - 1, prevMonthDays + dayNum))
        return { dayNum: prevMonthDays + dayNum, key, inCurrentMonth: false }
      }
      if (dayNum > daysInMonth) {
        const key = dateKey(new Date(viewYear, viewMonth + 1, dayNum - daysInMonth))
        return { dayNum: dayNum - daysInMonth, key, inCurrentMonth: false }
      }
      return { dayNum, key: dateKey(new Date(viewYear, viewMonth, dayNum)), inCurrentMonth: true }
    })
  }, [selected])

  const weekCells = useMemo<DayCell[]>(() => {
    const startOfWeek = addDays(selected, -selected.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfWeek, i)
      return { dayNum: date.getDate(), key: dateKey(date), inCurrentMonth: true }
    })
  }, [selected])

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return selected.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    if (viewMode === 'week') {
      const start = addDays(selected, -selected.getDay())
      const end = addDays(start, 6)
      const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      return `${startLabel} – ${endLabel}`
    }
    return selected.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  }, [selected, viewMode])

  function goPrev() {
    if (viewMode === 'month') onSelectedDateChange(dateKey(addMonths(selected, -1)))
    else if (viewMode === 'week') onSelectedDateChange(dateKey(addDays(selected, -7)))
    else onSelectedDateChange(dateKey(addDays(selected, -1)))
  }

  function goNext() {
    if (viewMode === 'month') onSelectedDateChange(dateKey(addMonths(selected, 1)))
    else if (viewMode === 'week') onSelectedDateChange(dateKey(addDays(selected, 7)))
    else onSelectedDateChange(dateKey(addDays(selected, 1)))
  }

  const dayEntries = entriesByDate.get(selectedDate) ?? []

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#7A2323]/10 text-[#7A2323]">
            <CalendarDays className="size-4.5" />
          </span>
          <p className="font-semibold text-[#3A2A1A]">Review Calendar</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous"
            className="rounded-md p-1.5 text-[#3A2A1A]/60 hover:bg-[#FBF3EA] hover:text-[#3A2A1A]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="min-w-32 text-center text-sm font-semibold text-[#3A2A1A]">{headerLabel}</p>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next"
            className="rounded-md p-1.5 text-[#3A2A1A]/60 hover:bg-[#FBF3EA] hover:text-[#3A2A1A]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-[#FBF3EA] p-1">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'relative overflow-hidden rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors',
                viewMode === mode
                  ? 'bg-[#7A2323] text-white'
                  : 'text-[#3A2A1A]/60 hover:text-[#3A2A1A]',
              )}
            >
              {viewMode === mode && <GrungeOverlay />}
              {mode}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="mt-5">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[#3A2A1A]/10 bg-[#3A2A1A]/10 text-center text-xs font-semibold text-[#3A2A1A]/50">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="bg-[#FBF3EA] py-2">
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border-x border-b border-[#3A2A1A]/10 bg-[#3A2A1A]/10">
            {monthCells.map((cell) => {
              const cellEntries = entriesByDate.get(cell.key) ?? []
              const visible = cellEntries.slice(0, MAX_PILLS_PER_CELL)
              const overflowCount = cellEntries.length - visible.length
              const isToday = cell.key === todayKey
              const isSelected = cell.key === selectedDate

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => onSelectedDateChange(cell.key)}
                  className={cn(
                    'flex min-h-20 flex-col items-start gap-1 bg-white p-1.5 text-left align-top transition-colors sm:min-h-24 sm:p-2',
                    !cell.inCurrentMonth && 'bg-[#FBF3EA]/60',
                    isSelected && 'ring-2 ring-inset ring-[#7A2323]',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                      isToday
                        ? 'bg-[#7A2323] text-white'
                        : cell.inCurrentMonth
                          ? 'text-[#3A2A1A]'
                          : 'text-[#3A2A1A]/35',
                    )}
                  >
                    {cell.dayNum}
                  </span>
                  <div className="flex w-full flex-col gap-1">
                    {visible.map((entry) => (
                      <span
                        key={entry.id}
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDrillIntoDay(cell.key)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation()
                            onDrillIntoDay(cell.key)
                          }
                        }}
                      >
                        <EntryPill entry={entry} />
                      </span>
                    ))}
                    {overflowCount > 0 && (
                      <span className="px-1 text-[10px] font-semibold text-[#3A2A1A]/45">
                        +{overflowCount} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-7">
          {weekCells.map((cell) => {
            const cellEntries = entriesByDate.get(cell.key) ?? []
            const isToday = cell.key === todayKey
            const isSelected = cell.key === selectedDate

            return (
              <div
                key={cell.key}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border p-2.5',
                  isSelected ? 'border-[#7A2323] bg-[#7A2323]/5' : 'border-[#3A2A1A]/10',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectedDateChange(cell.key)}
                  className="flex items-center justify-between text-left"
                >
                  <span className="text-xs font-semibold text-[#3A2A1A]/50">
                    {new Date(`${cell.key}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                      isToday ? 'bg-[#7A2323] text-white' : 'text-[#3A2A1A]',
                    )}
                  >
                    {cell.dayNum}
                  </span>
                </button>
                <div className="flex flex-col gap-1.5">
                  {cellEntries.length === 0 ? (
                    <p className="text-[11px] text-[#3A2A1A]/35">—</p>
                  ) : (
                    cellEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onDrillIntoDay(cell.key)}
                        className="w-full"
                      >
                        <EntryPill entry={entry} dense />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <div className="mt-5 flex flex-col gap-2">
          {dayEntries.length === 0 ? (
            <p className="font-reading rounded-lg bg-[#FBF3EA] p-4 text-center text-sm text-[#3A2A1A]/55">
              Nothing planned for this day yet.
            </p>
          ) : (
            dayEntries.map((entry) => {
              const style = REVIEW_PLAN_TYPE_STYLES[entry.type]
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-[#3A2A1A]/10 bg-[#FBF3EA] p-3"
                >
                  <button
                    type="button"
                    onClick={() => onToggleDone(entry.id)}
                    aria-label={entry.done ? 'Mark as not done' : 'Mark as done'}
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors',
                      entry.done
                        ? 'border-[#3A5A40] bg-[#3A5A40] text-white'
                        : 'border-[#3A2A1A]/25 text-transparent',
                    )}
                  >
                    ✓
                  </button>
                  <span className={cn('size-2.5 shrink-0 rounded-full', style.dot)} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm font-semibold text-[#3A2A1A]',
                        entry.done && 'text-[#3A2A1A]/45 line-through',
                      )}
                    >
                      {entry.title}
                    </p>
                    {entry.time && <p className="text-xs text-[#3A2A1A]/50">{entry.time}</p>}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
                      style.pill,
                    )}
                  >
                    {entry.type}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#3A2A1A]/10 pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {REVIEW_PLAN_TYPES.map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-xs font-medium text-[#3A2A1A]/60">
              <span className={cn('size-2 rounded-full', REVIEW_PLAN_TYPE_STYLES[type].dot)} />
              {type}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center gap-1.5 rounded-full bg-[#7A2323] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          <Plus className="size-4" />
          Add to Calendar
        </button>
      </div>
    </div>
  )
}
