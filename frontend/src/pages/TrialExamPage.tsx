import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { startTrialExam, type TrialExam } from '@/api/trial'
import { Navbar } from '@/components/landing/Navbar'
import { Quiz } from '@/components/quiz/Quiz'
import { getTrialAttempt, recordTrialAttempt } from '@/lib/trialAttempt'

export function TrialExamPage() {
  const { subject = '' } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState<TrialExam | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The free exam is one per browser; a bookmarked /try/exam/IS shouldn't be a
  // way around the picker's own check.
  const alreadyUsed = getTrialAttempt() !== null
  // React 18 StrictMode runs this effect twice in dev, which would draw (and
  // throw away) a second exam and spend two of the IP's rate-limit slots.
  const requestedSubject = useRef<string | null>(null)

  useEffect(() => {
    if (alreadyUsed || !subject) {
      navigate('/try', { replace: true })
      return
    }
    if (requestedSubject.current === subject) return
    requestedSubject.current = subject

    // No in-flight cancellation here on purpose: the ref above already stops
    // the duplicate StrictMode run, so discarding the first response in the
    // cleanup would leave nothing to render.
    startTrialExam(subject)
      .then(setExam)
      .catch((err: unknown) => {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined
        setError(
          status === 429
            ? "You've started a few free exams already. Create a free account to keep going."
            : status === 400
              ? "That subject isn't available for the free exam."
              : "Couldn't start the free exam. Please try again.",
        )
      })
  }, [subject, alreadyUsed, navigate])

  function handleComplete(answers: Record<string, string>) {
    if (!exam) return
    const correct = exam.questions.filter((q) => answers[q.id] === q.correctChoiceId).length
    recordTrialAttempt({
      subject: exam.subject,
      correct,
      total: exam.questions.length,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Navbar />
      <div className="mx-auto max-w-[1600px] px-6 py-10">
        {error ? (
          <div className="mx-auto max-w-lg py-16 text-center">
            <p className="font-display text-2xl text-[#7A2323]">Free exam unavailable</p>
            <p className="font-reading mt-2 text-sm text-[#3A2A1A]/70">{error}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="rounded-full bg-[#7A2323] px-6 py-3 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
              >
                Create a free account
              </Link>
              <Link
                to="/try"
                className="rounded-full border border-[#3A2A1A]/25 px-6 py-3 text-sm font-semibold text-[#3A2A1A] transition-colors hover:bg-[#3A2A1A]/5"
              >
                Back to free exams
              </Link>
            </div>
          </div>
        ) : exam ? (
          <Quiz
            quizSetId={`trial-${exam.subject}`}
            questions={exam.questions}
            code={exam.subject}
            onBack={() => navigate('/try')}
            onComplete={handleComplete}
            trialMode
          />
        ) : (
          <p className="font-reading py-16 text-center text-sm text-[#3A2A1A]/70">
            Preparing your free exam…
          </p>
        )}
      </div>
    </div>
  )
}
