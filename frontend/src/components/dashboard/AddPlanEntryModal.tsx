import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { REVIEW_PLAN_TYPE_STYLES, REVIEW_PLAN_TYPES } from '@/data/dashboard-data'
import { cn } from '@/lib/utils'
import type { ReviewPlanEntryType } from '@/lib/reviewPlanner'

interface AddPlanEntryModalProps {
  open: boolean
  defaultType: ReviewPlanEntryType
  defaultDate: string
  onClose: () => void
  onSubmit: (entry: { title: string; type: ReviewPlanEntryType; date: string; time?: string }) => void
}

function formatTime(raw: string): string | undefined {
  if (!raw) return undefined
  return new Date(`1970-01-01T${raw}`).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AddPlanEntryModal({
  open,
  defaultType,
  defaultDate,
  onClose,
  onSubmit,
}: AddPlanEntryModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ReviewPlanEntryType>(defaultType)
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle('')
    setType(defaultType)
    setDate(defaultDate)
    setTime('')
    setError('')
  }, [open, defaultType, defaultDate])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give this entry a title.')
      return
    }
    if (!date) {
      setError('Pick a date.')
      return
    }
    onSubmit({ title: title.trim(), type, date, time: formatTime(time) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#3A2A1A]/40" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[#3A2A1A]">Add to Calendar</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-entry-title" className="text-xs font-semibold text-[#3A2A1A]/60">
            Title
          </label>
          <input
            id="plan-entry-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. FAR Review"
            className="rounded-lg border border-[#3A2A1A]/15 px-3 py-2 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#3A2A1A]/60">Type</span>
          <div className="flex flex-wrap gap-1.5">
            {REVIEW_PLAN_TYPES.map((t) => {
              const style = REVIEW_PLAN_TYPE_STYLES[t]
              const isSelected = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    isSelected ? 'border-transparent text-white' : 'border-[#3A2A1A]/15 text-[#3A2A1A]/70',
                  )}
                  style={isSelected ? { backgroundColor: style.hex } : undefined}
                >
                  <span className={cn('size-1.5 rounded-full', isSelected ? 'bg-white' : style.dot)} />
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-entry-date" className="text-xs font-semibold text-[#3A2A1A]/60">
              Date
            </label>
            <input
              id="plan-entry-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#3A2A1A]/15 px-3 py-2 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-entry-time" className="text-xs font-semibold text-[#3A2A1A]/60">
              Time (optional)
            </label>
            <input
              id="plan-entry-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-[#3A2A1A]/15 px-3 py-2 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/50"
            />
          </div>
        </div>

        {error && <p className="text-xs font-medium text-[#7A2323]">{error}</p>}

        <button
          type="submit"
          className="mt-1 rounded-full bg-[#7A2323] py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
        >
          Add to Calendar
        </button>
      </form>
    </div>
  )
}
