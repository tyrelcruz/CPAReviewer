import { Flag } from 'lucide-react'

import { cn } from '@/lib/utils'

interface QuestionNavigatorProps {
  total: number
  currentIndex: number
  answeredIndices: Set<number>
  correctIndices: Set<number>
  flaggedIndices: Set<number>
  onJump: (index: number) => void
  onReviewFlagged: () => void
}

export function QuestionNavigator({
  total,
  currentIndex,
  answeredIndices,
  correctIndices,
  flaggedIndices,
  onJump,
  onReviewFlagged,
}: QuestionNavigatorProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <p className="text-sm font-bold text-[#7A2323]">Question Navigator</p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#3A2A1A]/70">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#3A5A40]" />
          Correct
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-600" />
          Incorrect
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-[#3A2A1A]/30" />
          Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <Flag className="size-3 text-[#E0AC48]" />
          Flagged
        </span>
      </div>

      <div className="mt-4 grid max-h-64 flex-1 grid-cols-7 content-start gap-1.5 overflow-y-auto pr-1 sm:max-h-80 sm:gap-2">
        {Array.from({ length: total }, (_, i) => {
          const isAnswered = answeredIndices.has(i)
          const isCorrect = correctIndices.has(i)
          const isCurrent = i === currentIndex
          const isFlagged = flaggedIndices.has(i)

          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                'relative flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-9',
                !isAnswered
                  ? 'border-[#3A2A1A]/20 bg-[#F3ECDC]/60 text-[#3A2A1A]/70 hover:bg-[#3A2A1A]/5'
                  : isCorrect
                    ? 'border-transparent bg-[#3A5A40] text-white'
                    : 'border-transparent bg-red-600 text-white',
                isCurrent && 'ring-2 ring-inset ring-[#E0AC48]',
              )}
            >
              {i + 1}
              {isFlagged && (
                <Flag className="absolute -top-1.5 -left-1.5 size-3 fill-[#E0AC48] text-[#E0AC48]" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#3A2A1A]/10 pt-4 text-center">
        <div>
          <p className="text-lg font-bold text-[#3A2A1A]">{total}</p>
          <p className="text-[11px] text-[#3A2A1A]/60">Total Questions</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[#3A5A40]">{answeredIndices.size}</p>
          <p className="text-[11px] text-[#3A2A1A]/60">Answered</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[#E0AC48]">{flaggedIndices.size}</p>
          <p className="text-[11px] text-[#3A2A1A]/60">Flagged</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onReviewFlagged}
        disabled={flaggedIndices.size === 0}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-[#7A2323]/30 px-4 py-2 text-xs font-semibold text-[#7A2323] transition-colors hover:bg-[#7A2323]/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Flag className="size-3.5" />
        Review flagged ({flaggedIndices.size})
      </button>
    </div>
  )
}
