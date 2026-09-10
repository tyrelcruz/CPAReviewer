import { useState } from 'react'

import { GrungeOverlay } from '@/components/ui/GrungeOverlay'
import { cn } from '@/lib/utils'

const OTHER_OPTION = '__other__'

interface FlagReasonPopoverProps {
  choices: { id: string; text: string }[]
  /** Throws (or rejects) on failure — the popover stays open and shows an
   * error so the report isn't silently lost, unlike this app's usual
   * fire-and-forget submit pattern (which is fine for things like exam score
   * that also persist locally; a flag has no local fallback at all). */
  onSubmit: (input: { reason: string; suggestedChoiceId?: string; suggestedAnswerText?: string }) => Promise<void>
  onCancel: () => void
}

export function FlagReasonPopover({ choices, onSubmit, onCancel }: FlagReasonPopoverProps) {
  const [reason, setReason] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [customAnswer, setCustomAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOther = selectedOption === OTHER_OPTION

  async function handleSubmit() {
    const trimmedReason = reason.trim()
    if (!trimmedReason || isSubmitting) return
    if (isOther && !customAnswer.trim()) {
      setError('Type the answer you believe is correct, or pick a different option.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        reason: trimmedReason,
        suggestedChoiceId: selectedOption && !isOther ? selectedOption : undefined,
        suggestedAnswerText: isOther ? customAnswer.trim() : undefined,
      })
    } catch {
      setError('Could not submit this flag — please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-h-[80vh] w-80 overflow-y-auto rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-[#3A2A1A]/70">Why are you flagging this question?</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. the answer key looks wrong, the wording is confusing…"
        rows={3}
        autoFocus
        disabled={isSubmitting}
        className="w-full resize-none rounded-lg border border-[#3A2A1A]/15 bg-[#F3ECDC]/60 p-2.5 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/40 disabled:opacity-60"
      />

      <p className="mt-3 mb-1.5 text-xs font-semibold text-[#3A2A1A]/70">
        What do you think the correct answer is? <span className="font-normal text-[#3A2A1A]/45">(optional)</span>
      </p>
      <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
        {choices.map((choice, i) => (
          <button
            key={choice.id}
            type="button"
            disabled={isSubmitting}
            onClick={() => setSelectedOption((v) => (v === choice.id ? null : choice.id))}
            className={cn(
              'flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              selectedOption === choice.id
                ? 'border-[#7A2323]/40 bg-[#7A2323]/10 text-[#3A2A1A]'
                : 'border-transparent text-[#3A2A1A]/75 hover:bg-[#3A2A1A]/5',
            )}
          >
            <span className="font-bold text-[#3A2A1A]/50">{String.fromCharCode(65 + i)}.</span>
            <span className="min-w-0 flex-1">{choice.text}</span>
          </button>
        ))}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setSelectedOption((v) => (v === OTHER_OPTION ? null : OTHER_OPTION))}
          className={cn(
            'rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            isOther
              ? 'border-[#7A2323]/40 bg-[#7A2323]/10 text-[#3A2A1A]'
              : 'border-transparent text-[#3A2A1A]/75 hover:bg-[#3A2A1A]/5',
          )}
        >
          Other — not listed here
        </button>
      </div>

      {isOther && (
        <input
          type="text"
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          placeholder="Type what you think the correct answer is…"
          disabled={isSubmitting}
          className="mt-1.5 w-full rounded-lg border border-[#3A2A1A]/15 bg-[#F3ECDC]/60 p-2 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/40 disabled:opacity-60"
        />
      )}

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
          className="relative overflow-hidden rounded-full bg-[#7A2323] px-3.5 py-1.5 text-xs font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GrungeOverlay />
          {isSubmitting ? 'Submitting…' : 'Submit flag'}
        </button>
      </div>
    </div>
  )
}
