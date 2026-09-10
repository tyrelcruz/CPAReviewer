import { useState } from 'react'

interface FlagReasonPopoverProps {
  /** Throws (or rejects) on failure — the popover stays open and shows an
   * error so the report isn't silently lost, unlike this app's usual
   * fire-and-forget submit pattern (which is fine for things like exam score
   * that also persist locally; a flag has no local fallback at all). */
  onSubmit: (reason: string) => Promise<void>
  onCancel: () => void
}

export function FlagReasonPopover({ onSubmit, onCancel }: FlagReasonPopoverProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = reason.trim()
    if (!trimmed || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
    } catch {
      setError('Could not submit this flag — please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-72 rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-[#3A2A1A]/70">Why are you flagging this question?</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. the answer key looks wrong, the wording is confusing…"
        rows={4}
        autoFocus
        disabled={isSubmitting}
        className="w-full resize-none rounded-lg border border-[#3A2A1A]/15 bg-[#F3ECDC]/60 p-2.5 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/40 disabled:opacity-60"
      />
      {error && <p className="mt-1.5 text-xs font-medium text-[#7A2323]">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!reason.trim() || isSubmitting}
          className="rounded-full bg-[#7A2323] px-3.5 py-1.5 text-xs font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Submit flag'}
        </button>
      </div>
    </div>
  )
}
