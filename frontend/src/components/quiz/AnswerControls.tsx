import { motion } from 'framer-motion'
import { Check, XCircle } from 'lucide-react'

import { promptReferencesChoices } from '@/lib/answerMatch'
import { cn } from '@/lib/utils'
import type { QuizChoice } from '@/types/quiz'

interface AnswerControlsProps {
  prompt: string
  answerMode: 'mcq' | 'identification'
  choices: QuizChoice[]
  selectedChoiceId: string | undefined
  isAnswered: boolean
  isCorrect: boolean
  draftAnswer: string
  onDraftChange: (value: string) => void
  onSelectChoice: (choiceId: string) => void
  onSubmitTypedAnswer: () => void
}

/** The actual answer-taking UI (MCQ choice buttons or the identification
 * type-in field) — shared between the main quiz view and the maximized
 * Canvas Notes view (see DrawingNotesPanel), which restates the question and
 * needs to let the learner answer without leaving that view. */
export function AnswerControls({
  prompt,
  answerMode,
  choices,
  selectedChoiceId,
  isAnswered,
  isCorrect,
  draftAnswer,
  onDraftChange,
  onSelectChoice,
  onSubmitTypedAnswer,
}: AnswerControlsProps) {
  if (answerMode === 'identification') {
    return (
      <div className="flex flex-col gap-3">
        {promptReferencesChoices(prompt) && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-[#3A2A1A]/10 bg-[#3A2A1A]/[0.03] px-4 py-3">
            <p className="text-[10px] font-bold tracking-wide text-[#3A2A1A]/50 uppercase">
              Reference choices — type your answer below
            </p>
            {choices.map((choice, i) => (
              <p key={choice.id} className="font-reading text-sm text-[#3A2A1A]/75">
                <span className="font-bold text-[#3A2A1A]/50">{String.fromCharCode(65 + i)}.</span>{' '}
                {choice.text}
              </p>
            ))}
          </div>
        )}
        <input
          type="text"
          value={isAnswered ? (selectedChoiceId ?? '') : draftAnswer}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || isAnswered) return
            e.preventDefault()
            onSubmitTypedAnswer()
            e.currentTarget.blur()
          }}
          disabled={isAnswered}
          placeholder="Type your answer…"
          autoComplete="off"
          className={cn(
            'w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-colors',
            isAnswered
              ? isCorrect
                ? 'border-[#3A5A40] bg-[#3A5A40]/5 text-[#3A2A1A]'
                : 'border-red-600/40 bg-red-600/5 text-[#3A2A1A]'
              : 'border-[#3A2A1A]/15 text-[#3A2A1A] focus:border-[#7A2323]/40',
          )}
        />
        {!isAnswered && (
          <button
            type="button"
            onClick={onSubmitTypedAnswer}
            disabled={!draftAnswer.trim()}
            className="self-start rounded-full bg-[#7A2323] px-5 py-2.5 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit answer
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice, i) => {
        const letter = String.fromCharCode(65 + i)
        const isSelected = choice.id === selectedChoiceId

        return (
          <motion.button
            key={choice.id}
            type="button"
            onClick={() => onSelectChoice(choice.id)}
            disabled={isAnswered}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            whileHover={!isAnswered ? { scale: 1.01 } : undefined}
            whileTap={!isAnswered ? { scale: 0.99 } : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors',
              isSelected
                ? 'border-[#E0AC48] bg-[#F7E7C4] text-[#3A2A1A]'
                : 'border-[#3A2A1A]/10 text-[#3A2A1A]/85',
              !isAnswered && !isSelected && 'cursor-pointer hover:bg-[#3A2A1A]/5',
              isAnswered && !isSelected && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                isSelected ? 'bg-[#E0AC48] text-[#3A2A1A]' : 'border border-[#3A2A1A]/20 text-[#3A2A1A]/60',
              )}
            >
              {letter}
            </span>
            <span className="font-reading flex-1">{choice.text}</span>
            {isSelected && (
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-white',
                  isCorrect ? 'bg-[#3A5A40]' : 'bg-red-600',
                )}
              >
                {isCorrect ? <Check className="size-3.5" /> : <XCircle className="size-3.5" />}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
