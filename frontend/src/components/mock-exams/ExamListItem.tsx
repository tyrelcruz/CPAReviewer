import { Bookmark, Clock, FileText, Gauge, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ProgressRing } from '@/components/quiz/ProgressRing'
import type { MockExam } from '@/data/mock-exams-data'
import { scoreColor } from '@/lib/score'
import { cn } from '@/lib/utils'

function formatDuration(minutes: number) {
  if (minutes % 60 === 0) return `${minutes / 60} hours`
  if (minutes < 60) return `${minutes} mins`
  return `${(minutes / 60).toFixed(1)} hours`
}

function formatTakenDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function ordinal(n: number) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

interface ExamListItemProps {
  exam: MockExam
}

export function ExamListItem({ exam }: ExamListItemProps) {
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(false)
  const Icon = exam.icon
  const scorePct = exam.taken ? Math.round((exam.taken.score / exam.taken.total) * 100) : null
  const isAvailable = Boolean(exam.quizSetId)

  return (
    <motion.div
      whileHover={isAvailable ? { y: -3, boxShadow: '0 8px 20px -8px rgba(58,42,26,0.25)' } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn(
        'relative flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center',
        isAvailable
          ? 'border-[#3A2A1A]/10 bg-white'
          : 'cursor-not-allowed border-[#3A2A1A]/10 bg-[#F3ECDC]/40 opacity-60 grayscale',
      )}
    >
      <motion.button
        type="button"
        onClick={() => setBookmarked((v) => !v)}
        disabled={!isAvailable}
        whileTap={isAvailable ? { scale: 0.8 } : undefined}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this exam'}
        className="absolute top-4 right-4 text-[#3A2A1A]/40 enabled:hover:text-[#7A2323] disabled:cursor-not-allowed"
      >
        <Bookmark className={cn('size-4', bookmarked && 'fill-[#E0AC48] text-[#E0AC48]')} />
      </motion.button>

      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: isAvailable ? exam.iconBg : '#3A2A1A66' }}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {exam.recommended && (
            <span className="inline-block rounded-full bg-[#E0AC48] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#3A2A1A] uppercase">
              Recommended
            </span>
          )}
          {!isAvailable && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#3A2A1A]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#3A2A1A]/70 uppercase">
              <Lock className="size-2.5" />
              Coming Soon
            </span>
          )}
        </div>
        <p className="pr-6 text-base font-bold text-[#3A2A1A]">{exam.title}</p>
        <p className="font-reading text-sm text-[#3A2A1A]/70">
          {exam.itemCount} items · {exam.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#3A2A1A]/60">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDuration(exam.durationMinutes)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="size-3.5" />
            {exam.itemCount} MCQs
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="size-3.5" />
            {exam.difficulty}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-6 sm:w-auto">
        <div className="w-32 text-xs text-[#3A2A1A]/60">
          {!isAvailable
            ? 'Not available yet'
            : exam.taken
              ? `Taken: ${formatTakenDate(exam.taken.date)}`
              : 'Not taken yet'}
        </div>

        {isAvailable && exam.taken && scorePct !== null && (
          <>
            <ProgressRing
              size={64}
              thickness={6}
              centerColor="#FFFFFF"
              segments={[{ percent: scorePct, color: scoreColor(scorePct) }]}
            >
              <span className="text-sm font-bold text-[#3A2A1A]">{scorePct}%</span>
            </ProgressRing>

            <div className="text-xs">
              <p className="text-[#3A2A1A]/60">Score</p>
              <p className="font-semibold text-[#3A2A1A]">
                {exam.taken.score} / {exam.taken.total}
              </p>
            </div>
            {exam.taken.percentile !== undefined && (
              <div className="text-xs">
                <p className="text-[#3A2A1A]/60">Percentile</p>
                <p className="font-semibold text-[#3A2A1A]">{ordinal(exam.taken.percentile)}</p>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => {
            if (exam.quizSetId) navigate(`/app/practice/${exam.quizSetId}`)
          }}
          className={cn(
            'shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
            !isAvailable
              ? 'cursor-not-allowed border border-[#3A2A1A]/15 text-[#3A2A1A]/50'
              : exam.taken
                ? 'bg-[#7A2323] text-[#F3ECDC] hover:bg-[#7A2323]/90'
                : 'border border-[#E0AC48] text-[#B4791F] hover:bg-[#E0AC48]/10',
          )}
        >
          {!isAvailable ? 'Coming Soon' : exam.taken ? 'Review Results' : 'Start Exam'}
        </button>
      </div>
    </motion.div>
  )
}
