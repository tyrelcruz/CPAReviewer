import { ClipboardList, Plus, SquarePen } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import illustrationBg from '@/assets/images/illustration_bg.png'
import { Sidebar } from '@/components/dashboard/Sidebar'
import {
  ExamFilters,
  type SortOption,
  type TypeFilter,
} from '@/components/mock-exams/ExamFilters'
import { ExamListItem } from '@/components/mock-exams/ExamListItem'
import { PromoPanel } from '@/components/mock-exams/PromoPanel'
import { StatsPanel } from '@/components/mock-exams/StatsPanel'
import { MOCK_EXAMS, type MockExam } from '@/data/mock-exams-data'
import { quizSets } from '@/data/quiz-data'
import { getAggregatedExamStats, getExamHistory } from '@/lib/examHistory'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { peekStudyStreak } from '@/lib/streak'
import { SECONDS_PER_QUESTION } from '@/lib/time'

function matchesDuration(exam: MockExam, filter: string) {
  if (filter === 'All Durations') return true
  if (filter === 'Under 1 hour') return exam.durationMinutes < 60
  if (filter === '1–4 hours') return exam.durationMinutes >= 60 && exam.durationMinutes <= 240
  if (filter === '4+ hours') return exam.durationMinutes > 240
  return true
}

// The actual playable practice sets, so Mock Exams can launch real content —
// not just the illustrative sample cards above. Scores/dates come from each
// set's real attempt history; nothing here is fabricated.
function buildRealExams(): MockExam[] {
  return quizSets.map((set) => {
    const history = getExamHistory(set.id)
    const last = history[history.length - 1]
    return {
      id: `real-${set.id}`,
      title: set.title,
      description: set.description,
      type: 'subject',
      subject: set.code ?? 'General',
      difficulty: 'Mixed',
      durationMinutes: Math.round((set.questions.length * SECONDS_PER_QUESTION) / 60),
      itemCount: set.questions.length,
      icon: ClipboardList,
      iconBg: '#3A5A40',
      quizSetId: set.id,
      taken: last ? { date: last.date, score: last.correct, total: last.total } : undefined,
    }
  })
}

export function MockExamsPage() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [difficultyFilter, setDifficultyFilter] = useState('All Levels')
  const [durationFilter, setDurationFilter] = useState('All Durations')
  const [sort, setSort] = useState<SortOption>('recent')

  const allExams = useMemo(() => [...buildRealExams(), ...MOCK_EXAMS], [])

  const subjectOptions = useMemo(() => {
    const distinct = new Set(allExams.map((e) => e.subject))
    distinct.delete('All Subjects')
    return ['All Subjects', ...distinct]
  }, [allExams])

  const exams = useMemo(() => {
    const filtered = allExams.filter((exam) => {
      if (typeFilter !== 'all' && exam.type !== typeFilter) return false
      if (subjectFilter !== 'All Subjects' && exam.subject !== subjectFilter) return false
      if (difficultyFilter !== 'All Levels' && exam.difficulty !== difficultyFilter) return false
      if (!matchesDuration(exam, durationFilter)) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      // Temporary: always surface the currently playable exams first, ahead
      // of "Coming Soon" cards, regardless of sort mode.
      const aAvailable = Boolean(a.quizSetId)
      const bAvailable = Boolean(b.quizSetId)
      if (aAvailable !== bAvailable) return aAvailable ? -1 : 1

      if (sort === 'alphabetical') return a.title.localeCompare(b.title)
      if (sort === 'score') {
        const scoreA = a.taken ? a.taken.score / a.taken.total : -1
        const scoreB = b.taken ? b.taken.score / b.taken.total : -1
        return scoreB - scoreA
      }
      if (!a.taken && !b.taken) return 0
      if (!a.taken) return 1
      if (!b.taken) return -1
      return new Date(b.taken.date).getTime() - new Date(a.taken.date).getTime()
    })
  }, [allExams, typeFilter, subjectFilter, difficultyFilter, durationFilter, sort])

  const { examsTaken, averageScore, bestScore } = getAggregatedExamStats(
    quizSets.map((s) => s.id),
  )
  const studyStreak = peekStudyStreak()

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-[1400px] px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-cover bg-right px-8 py-8"
            style={{ backgroundImage: `url(${illustrationBg})` }}
          >
            <div className="absolute inset-0 bg-[#FBF3EA]/20" />
            <div className="relative">
              <div className="flex items-center justify-center gap-3 text-[#3A5A40]">
                <span className="h-px w-16 bg-[#7A2323]/40" />
                <span className="text-lg" aria-hidden="true">
                  〜◡〜
                </span>
                <span className="h-px w-16 bg-[#7A2323]/40" />
              </div>
              <h1 className="font-serif mt-2 text-5xl font-bold text-[#7A2323]">Mock Exams</h1>
              <p className="font-reading mt-2 text-[#3A2A1A]/75">
                Practice with exam-like simulations and track your progress.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]"
          >
            <motion.div variants={fadeUpItem} className="flex flex-col gap-5">
              <ExamFilters
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                subjectFilter={subjectFilter}
                onSubjectChange={setSubjectFilter}
                subjectOptions={subjectOptions}
                difficultyFilter={difficultyFilter}
                onDifficultyChange={setDifficultyFilter}
                durationFilter={durationFilter}
                onDurationChange={setDurationFilter}
                sort={sort}
                onSortChange={setSort}
              />

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[#3A2A1A]/20 bg-white/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#E0AC48]/20 text-[#B4791F]">
                      <SquarePen className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#3A2A1A]">Create your own exam</p>
                      <p className="text-sm text-[#3A2A1A]/60">
                        Customize subjects, topics, difficulty, and number of items.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/app/exam-setup')}
                    className="flex items-center gap-1.5 rounded-full border border-[#3A2A1A]/20 px-5 py-2.5 text-sm font-semibold text-[#3A2A1A] hover:bg-[#3A2A1A]/5"
                  >
                    Create Custom Exam
                    <Plus className="size-4" />
                  </button>
                </div>

                {exams.length === 0 ? (
                  <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-10 text-center text-sm text-[#3A2A1A]/60">
                    No exams match these filters yet.
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {exams.map((exam, index) => (
                      <motion.div
                        key={exam.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: 'easeOut', delay: index * 0.03 }}
                      >
                        <ExamListItem exam={exam} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>

            <motion.div variants={fadeUpItem} className="flex flex-col gap-6">
              <StatsPanel
                examsTaken={examsTaken}
                averageScore={averageScore}
                bestScore={bestScore}
                studyStreak={studyStreak}
              />
              <PromoPanel />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
