import type { ExamSessionSummary } from '@/api/exams'
import type {
  ActivityItem,
  PerformancePoint,
  StrengthLevel,
  StudyCalendarEntry,
  SubjectProgress,
  SubjectStrength,
} from '@/data/dashboard-data'
import { getExamHistory } from '@/lib/examHistory'
import { dateKey } from '@/lib/time'
import type { QuizSet } from '@/types/quiz'

export const SUBJECT_LABELS: Record<string, string> = {
  AT: 'Auditing Theory',
  RFBT: 'RFBT',
  TAX: 'Taxation',
  IS: 'Immunology & Serology',
  BB: 'Blood Banking',
  MTAP: 'MTAP Comprehensive Exam',
}

const SUBJECT_COLORS: Record<string, string> = {
  AT: '#E0AC48',
  RFBT: '#3A5A40',
  TAX: '#7A2323',
  IS: '#3A5A40',
  BB: '#7A2323',
  MTAP: '#E0AC48',
}

export interface CombinedAttempt {
  /** Stable per-attempt identity — distinct from `title`, which is a derived
   * display label that collides across repeat attempts of the same quiz
   * set/subject+mode (e.g. two "RFBT TOS Simulator" sessions). */
  id: string
  subjectCode: string
  subjectLabel: string
  title: string
  correct: number
  total: number
  date: Date
}

/** Merges real localStorage practice history (legacy quiz sets) with real
 * backend bank-exam session history into one chronological attempt log —
 * no fabricated entries. */
export function buildCombinedAttempts(
  userId: string,
  quizSets: QuizSet[],
  bankSessions: ExamSessionSummary[],
): CombinedAttempt[] {
  const legacy: CombinedAttempt[] = quizSets.flatMap((set) => {
    const code = set.code ?? set.title
    return getExamHistory(userId, set.id).map((attempt) => ({
      id: `legacy:${set.id}:${attempt.date}`,
      subjectCode: code,
      subjectLabel: SUBJECT_LABELS[code] ?? code,
      title: `Completed ${set.title}`,
      correct: attempt.correct,
      total: attempt.total,
      date: new Date(attempt.date),
    }))
  })

  const bank: CombinedAttempt[] = bankSessions.map((session) => ({
    id: `bank:${session.sessionId}`,
    subjectCode: session.subject,
    subjectLabel: SUBJECT_LABELS[session.subject] ?? session.subject,
    title: `Completed ${session.subject} ${
      session.mode === 'tos_simulator' ? 'TOS Simulator' : 'Subject Drill'
    } Exam`,
    correct: session.score,
    total: session.itemCount,
    date: new Date(session.submittedAt),
  }))

  return [...legacy, ...bank].sort((a, b) => b.date.getTime() - a.date.getTime())
}

interface SubjectAggregate {
  code: string
  label: string
  percent: number
  attempts: number
}

export function aggregateBySubject(attempts: CombinedAttempt[]): SubjectAggregate[] {
  const bySubject = new Map<string, { label: string; correct: number; total: number; attempts: number }>()
  for (const attempt of attempts) {
    const entry = bySubject.get(attempt.subjectCode) ?? {
      label: attempt.subjectLabel,
      correct: 0,
      total: 0,
      attempts: 0,
    }
    entry.correct += attempt.correct
    entry.total += attempt.total
    entry.attempts += 1
    bySubject.set(attempt.subjectCode, entry)
  }
  return [...bySubject.entries()].map(([code, v]) => ({
    code,
    label: v.label,
    percent: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    attempts: v.attempts,
  }))
}

export function overallAveragePercent(attempts: CombinedAttempt[]): number | null {
  if (attempts.length === 0) return null
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0)
  const totalItems = attempts.reduce((sum, a) => sum + a.total, 0)
  return totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : null
}

/** Average score of attempts within the last `windowDays` vs. everything
 * before that — null when there isn't at least one attempt on each side to
 * compare (a fresh account, or one whose whole history is within the window). */
export function scoreDeltaVsPrevious(
  attempts: CombinedAttempt[],
  windowDays = 7,
): number | null {
  const cutoff = Date.now() - windowDays * 86_400_000
  const recent = attempts.filter((a) => a.date.getTime() >= cutoff)
  const older = attempts.filter((a) => a.date.getTime() < cutoff)
  if (recent.length === 0 || older.length === 0) return null

  const avgPercent = (list: CombinedAttempt[]) => {
    const correct = list.reduce((sum, a) => sum + a.correct, 0)
    const total = list.reduce((sum, a) => sum + a.total, 0)
    return total > 0 ? (correct / total) * 100 : 0
  }

  return Math.round(avgPercent(recent) - avgPercent(older))
}

export function toSubjectProgress(aggregates: SubjectAggregate[]): SubjectProgress[] {
  return aggregates.map((a) => ({
    code: a.code,
    label: a.label,
    percent: a.percent,
    color: SUBJECT_COLORS[a.code] ?? '#3A5A40',
  }))
}

function strengthLevel(percent: number): StrengthLevel {
  if (percent >= 80) return 'Strong'
  if (percent >= 65) return 'Good'
  if (percent >= 50) return 'Average'
  return 'Needs Work'
}

export function toSubjectStrengths(aggregates: SubjectAggregate[]): SubjectStrength[] {
  return [...aggregates]
    .sort((a, b) => b.percent - a.percent)
    .map((a) => ({
      code: a.code,
      percent: a.percent,
      level: strengthLevel(a.percent),
      color: SUBJECT_COLORS[a.code] ?? '#3A5A40',
    }))
}

// The icon is a display concern attached by the page component (keeps this
// module free of React/component imports, per lib/ conventions).
export function toRecentActivity(
  attempts: CombinedAttempt[],
  limit = 5,
): Omit<ActivityItem, 'icon'>[] {
  return attempts.slice(0, limit).map((attempt) => {
    const percent = attempt.total > 0 ? Math.round((attempt.correct / attempt.total) * 100) : 0
    return {
      id: attempt.id,
      title: attempt.title,
      description: `Score: ${percent}% · ${attempt.correct} / ${attempt.total}`,
      date: attempt.date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: attempt.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    }
  })
}

export function toPerformanceTrend(attempts: CombinedAttempt[], limit = 7): PerformancePoint[] {
  const chronological = [...attempts]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-limit)
  return chronological.map((attempt) => ({
    date: attempt.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: attempt.total > 0 ? Math.round((attempt.correct / attempt.total) * 100) : 0,
  }))
}

/** Groups real attempt history by local calendar day so the dashboard can
 * render an actual activity calendar, not a fabricated schedule. */
export function toStudyCalendar(attempts: CombinedAttempt[]): Record<string, StudyCalendarEntry[]> {
  const byDay: Record<string, StudyCalendarEntry[]> = {}
  for (const attempt of attempts) {
    const key = dateKey(attempt.date)
    const entry: StudyCalendarEntry = {
      subjectLabel: attempt.subjectLabel,
      correct: attempt.correct,
      total: attempt.total,
    }
    byDay[key] = [...(byDay[key] ?? []), entry]
  }
  return byDay
}
