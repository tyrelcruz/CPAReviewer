import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { getExamSession, submitExam } from '@/api/exams'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNavbar } from '@/components/dashboard/TopNavbar'
import { Quiz } from '@/components/quiz/Quiz'
import { useAuth } from '@/context/AuthContext'
import { clearInProgressSessionPointer } from '@/lib/examProgress'
import type { BankQuestion, GeneratedExamSession } from '@/types/bank'
import type { QuizQuestion } from '@/types/quiz'

function toQuizQuestion(q: BankQuestion): QuizQuestion {
  return {
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
    correctChoiceId: q.correctChoiceId,
    rationale: q.rationale,
    tosCode: q.tosCode,
    topicCategory: q.topicCategory,
    subTopic: q.subTopic,
    bankDifficulty: q.difficulty,
    answerMode: q.answerMode,
    acceptableAnswers: q.acceptableAnswers,
  }
}

export function BankExamApp() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [session, setSession] = useState<GeneratedExamSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(
    (location.state as { notice?: string | null } | null)?.notice ?? null,
  )
  const timeLimitSeconds = (location.state as { timeLimitSeconds?: number } | null)
    ?.timeLimitSeconds

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    getExamSession(sessionId)
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this exam session.')
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  function handleComplete(answers: Record<string, string>) {
    if (!sessionId) return
    // Per-question, not per-session — one exam can mix MCQ and
    // identification questions (see ExamSetupPage's questionTypeCounts).
    const answerModeById = new Map(session?.questions.map((q) => [q.id, q.answerMode]) ?? [])
    const payload = Object.entries(answers).map(([questionId, value]) =>
      answerModeById.get(questionId) === 'identification'
        ? { questionId, answerText: value }
        : { questionId, choiceId: value },
    )
    submitExam(sessionId, payload).catch(() => {
      // Score is already computed client-side by QuizResults from the answer
      // key it already has — a failed submit only means server-side history
      // (anti-repetition, cross-device score) won't reflect this attempt.
    })
    if (session) clearInProgressSessionPointer(userId, `${session.subject}-${session.mode}`)
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#FBF3EA] text-[#3A2A1A] lg:flex-row">
      <div className="lg:hidden">
        <TopNavbar />
      </div>
      <Sidebar showMobileMenu={false} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] px-6 py-10">
          {error ? (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="font-display text-2xl text-[#7A2323]">Exam not found</p>
              <p className="font-reading mt-2 text-sm text-[#3A2A1A]/70">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/app/exam-setup')}
                className="mt-6 rounded-full bg-[#7A2323] px-6 py-3 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
              >
                Back to Exam Setup
              </button>
            </div>
          ) : session ? (
            <div className="flex flex-col gap-4">
              {notice && (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#E0AC48]/40 bg-[#E0AC48]/10 p-4 text-sm text-[#3A2A1A]">
                  <p className="font-reading">{notice}</p>
                  <button
                    type="button"
                    onClick={() => setNotice(null)}
                    className="shrink-0 text-xs font-semibold text-[#3A2A1A]/60 hover:text-[#3A2A1A]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <Quiz
                quizSetId={`bank-${session.subject}-${session.mode}`}
                questions={session.questions.map(toQuizQuestion)}
                code={session.subject}
                onBack={() => navigate('/app')}
                onComplete={handleComplete}
                timeLimitSeconds={timeLimitSeconds}
                progressKey={`bank-${session.sessionId}`}
              />
            </div>
          ) : (
            <p className="font-reading py-16 text-center text-sm text-[#3A2A1A]/70">
              Loading exam…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
