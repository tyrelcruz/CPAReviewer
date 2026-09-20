import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Calculator,
  Check,
  ClipboardList,
  Droplet,
  FileText,
  Gauge,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  ListChecks,
  Loader2,
  Microscope,
  Scale,
  ScrollText,
  Settings2,
  Shuffle,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { generateExam, listSubjectCounts, listTosTopics } from '@/api/exams'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { GrungeOverlay } from '@/components/ui/GrungeOverlay'
import { Switch } from '@/components/ui/switch'
import { WizardHeader } from '@/components/quiz/WizardHeader'
import mountainHeader from '@/assets/images/carabao_repia.png'
import { useAuth } from '@/context/AuthContext'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ExamMode, TosTopic } from '@/types/bank'

function defaultTopicCounts(topics: TosTopic[], total: number): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const t of topics) {
    counts[t.category] = Math.min(t.available, Math.round(total * t.weightPct))
  }
  return counts
}

interface QuestionTypeCounts {
  mcq: number
  identification: number
}

interface DifficultyCounts {
  Easy: number
  Moderate: number
  Difficult: number
}

/** All-MCQ by default — matches this app's behavior before the mix feature existed. */
function defaultQuestionTypeCounts(total: number): QuestionTypeCounts {
  return { mcq: total, identification: 0 }
}

/** Rounds to a 30/40/30 split (this app's long-standing default difficulty
 * ratio), then nudges the largest bucket to absorb any rounding remainder so
 * the three counts always sum to exactly `total`. */
function defaultDifficultyCounts(total: number): DifficultyCounts {
  const easy = Math.round(total * 0.3)
  const moderate = Math.round(total * 0.4)
  const difficult = total - easy - moderate
  return { Easy: easy, Moderate: moderate, Difficult: difficult }
}

const ITEM_COUNT_OPTIONS = [70, 80, 90, 100, 110]

interface SubjectDef {
  code: string
  name: string
  icon: typeof BookOpen
  /** Only subjects with ingested content can actually be generated — the rest render as "Coming Soon". */
  subjectKey?: string
}

// Mirrors the full CPALE-style subject lineup so the picker reads the same
// as the reference design — only FAR/TCP... err, only the subjects we've
// actually ingested content for (RFBT, TAX) are selectable; the rest are
// honestly marked "Coming Soon" rather than faking a question count.
const CPA_SUBJECT_DEFS: SubjectDef[] = [
  { code: 'FAR', name: 'Financial Accounting & Reporting', icon: BookOpen },
  { code: 'AUD', name: 'Auditing & Attestation', icon: Scale },
  { code: 'REG', name: 'Regulation', icon: Gauge },
  { code: 'TCP', name: 'Taxation', icon: Calculator, subjectKey: 'TAX' },
  { code: 'MAS', name: 'Management Advisory Services', icon: BarChart3 },
  { code: 'AFAR', name: 'Agricultural & Fisheries', icon: Leaf },
  { code: 'RFBT', name: 'Regulatory Framework for Business Transactions', icon: Landmark, subjectKey: 'RFBT' },
]

// RMT (Registered Medical Technologist) board-exam subject lineup — a
// separate track from CPALE. Only the subjects we've actually ingested
// content for get a subjectKey; same "Coming Soon" convention as CPA_SUBJECT_DEFS.
const RMT_SUBJECT_DEFS: SubjectDef[] = [
  { code: 'IS', name: 'Immunology & Serology', icon: Microscope, subjectKey: 'IS' },
  { code: 'BB', name: 'Blood Banking', icon: Droplet, subjectKey: 'BB' },
  { code: 'MTAP', name: 'MTAP Comprehensive Exam', icon: ClipboardList, subjectKey: 'MTAP' },
]

export function ExamSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const requestedState = location.state as { subject?: string; mode?: ExamMode } | null
  const requestedSubject = requestedState?.subject
  const [examType, setExamType] = useState<'standard' | 'timed'>('standard')
  // Kept as a raw string (not a clamped number) so the field can actually be
  // cleared while typing — clamping on every keystroke made it impossible to
  // delete existing digits, since the input snapped straight back to the min.
  // Clamping happens on blur instead; `timedMinutes` below is always a valid
  // derived number regardless of what's mid-edit in the field.
  const [timedMinutesInput, setTimedMinutesInput] = useState('90')
  const timedMinutes = Math.max(10, Math.min(480, Number(timedMinutesInput) || 10))

  const activeSubjectDefs = user?.course === 'rmt' ? RMT_SUBJECT_DEFS : CPA_SUBJECT_DEFS
  const [subject, setSubject] = useState(
    requestedSubject && activeSubjectDefs.some((d) => d.subjectKey === requestedSubject)
      ? requestedSubject
      : (activeSubjectDefs.find((d) => d.subjectKey)?.subjectKey ?? 'RFBT'),
  )
  const [mode, setMode] = useState<ExamMode>(
    requestedState?.mode === 'subject_drill' ? 'subject_drill' : 'tos_simulator',
  )
  // Arrived from ChooseStrategyPage with a valid subject already chosen —
  // render as step 2 of that wizard (WizardHeader, no subject re-picker)
  // instead of the standalone "Create New Exam" entry point.
  const cameFromWizard = Boolean(requestedSubject) && requestedSubject === subject
  const [itemCount, setItemCount] = useState(70)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({})
  const [topics, setTopics] = useState<TosTopic[]>([])
  const [customizeTopics, setCustomizeTopics] = useState(false)
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})

  // 'variant' is the only choice that exposes the customizable mix panels
  // (question-type split + difficulty split) — picking Multiple Choice or
  // Identification directly commits a simple 100%-one-type exam instead.
  const [questionTypeSelection, setQuestionTypeSelection] = useState<
    'mcq' | 'identification' | 'variant'
  >('mcq')
  const isVariant = questionTypeSelection === 'variant'
  const [questionTypeCounts, setQuestionTypeCounts] = useState<QuestionTypeCounts>(() =>
    defaultQuestionTypeCounts(70),
  )
  const [difficultyCounts, setDifficultyCounts] = useState<DifficultyCounts>(() =>
    defaultDifficultyCounts(70),
  )
  // Mirrors the raw-string trick used for `timedMinutesInput` above, but for
  // the mix/topic number inputs: each field is keyed (e.g. "qt:mcq",
  // "topic:Corporation Code") and holds whatever the user is mid-typing, so a
  // field showing "0" can actually be cleared instead of snapping back to "0"
  // on every keystroke. Cleared on blur so the display reverts to the
  // clamped numeric value; also cleared whenever the underlying counts are
  // reset programmatically (item count change, topic customize toggle, etc.)
  // so stale drafts don't linger.
  const [rawFieldInputs, setRawFieldInputs] = useState<Record<string, string>>({})

  function fieldValue(key: string, numericValue: number): string {
    return rawFieldInputs[key] ?? String(numericValue)
  }

  function clearRawField(key: string) {
    setRawFieldInputs((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  /** Caps what actually gets echoed back into the field's raw draft at `max`
   * (e.g. the current question count) — typing "999" into a field capped at
   * 70 shows "70", not "999" until blur. Empty string stays empty so the
   * field can still be cleared mid-edit. */
  function capRawInput(rawValue: string, max: number): string {
    if (rawValue === '') return rawValue
    const raw = Number(rawValue)
    if (!Number.isFinite(raw)) return rawValue
    return raw > max ? String(max) : rawValue
  }

  useEffect(() => {
    listSubjectCounts()
      .then(setSubjectCounts)
      .catch(() => {})
  }, [])

  // Refetched per subject rather than once: each subject has its own PRC
  // table, or none at all, which comes back as an empty list.
  useEffect(() => {
    let cancelled = false
    listTosTopics(subject)
      .then((next) => {
        if (!cancelled) setTopics(next)
      })
      .catch(() => {
        if (!cancelled) setTopics([])
      })
    return () => {
      cancelled = true
    }
  }, [subject])

  const hasTosTopics = topics.length > 0 && mode === 'tos_simulator'
  const usingCustomTopics = customizeTopics && hasTosTopics
  const topicTotal = Object.values(topicCounts).reduce((sum, n) => sum + n, 0)
  const effectiveItemCount = usingCustomTopics ? topicTotal : itemCount
  const activeSubjectDef = activeSubjectDefs.find((s) => s.subjectKey === subject)

  // Both mixes reset whenever the effective total or the mcq/identification/
  // variant choice changes. Multiple Choice / Identification commit a simple
  // 100%-one-type split directly (no manual editing); Variant resets to the
  // same proportional defaults as before and leaves them freely editable —
  // mirrors how the TOS topic customization already works
  // (defaultTopicCounts is recomputed fresh on toggle-on rather than trying
  // to preserve ratios across changes).
  useEffect(() => {
    if (questionTypeSelection === 'mcq') {
      setQuestionTypeCounts({ mcq: effectiveItemCount, identification: 0 })
    } else if (questionTypeSelection === 'identification') {
      setQuestionTypeCounts({ mcq: 0, identification: effectiveItemCount })
    } else {
      setQuestionTypeCounts(defaultQuestionTypeCounts(effectiveItemCount))
    }
    setDifficultyCounts(defaultDifficultyCounts(effectiveItemCount))
    setRawFieldInputs({})
  }, [effectiveItemCount, questionTypeSelection])

  const questionTypeTotal = questionTypeCounts.mcq + questionTypeCounts.identification
  const difficultyTotal = difficultyCounts.Easy + difficultyCounts.Moderate + difficultyCounts.Difficult

  function updateQuestionTypeCount(key: keyof QuestionTypeCounts, rawValue: string) {
    setRawFieldInputs((prev) => ({ ...prev, [`qt:${key}`]: capRawInput(rawValue, effectiveItemCount) }))
    const raw = Number(rawValue)
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(effectiveItemCount, Math.round(raw))) : 0
    setQuestionTypeCounts((prev) => ({ ...prev, [key]: clamped }))
  }

  function updateDifficultyCount(key: keyof DifficultyCounts, rawValue: string) {
    setRawFieldInputs((prev) => ({ ...prev, [`diff:${key}`]: capRawInput(rawValue, effectiveItemCount) }))
    const raw = Number(rawValue)
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(effectiveItemCount, Math.round(raw))) : 0
    setDifficultyCounts((prev) => ({ ...prev, [key]: clamped }))
  }

  function handleToggleCustomizeTopics() {
    if (!customizeTopics) {
      setTopicCounts(defaultTopicCounts(topics, itemCount))
      setRawFieldInputs({})
    }
    setCustomizeTopics((v) => !v)
  }

  function updateTopicCount(category: string, available: number, rawValue: string) {
    setRawFieldInputs((prev) => ({ ...prev, [`topic:${category}`]: capRawInput(rawValue, available) }))
    const raw = Number(rawValue)
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(available, Math.round(raw))) : 0
    setTopicCounts((prev) => ({ ...prev, [category]: clamped }))
  }

  function handleSelectSubject(def: SubjectDef) {
    if (!def.subjectKey || def.subjectKey === subject) return
    setSubject(def.subjectKey)
    // Topic names are per-subject, so a customization carried over from the
    // previous subject would be rejected by the backend as unknown topics.
    setCustomizeTopics(false)
    setTopicCounts({})
    setRawFieldInputs({})
  }

  async function handleGenerate() {
    if (usingCustomTopics && topicTotal <= 0) {
      setError('Set at least one topic count above 0 before generating.')
      return
    }
    if (questionTypeTotal !== effectiveItemCount) {
      setError(`Multiple Choice + Identification must add up to ${effectiveItemCount} (currently ${questionTypeTotal}).`)
      return
    }
    if (difficultyTotal !== effectiveItemCount) {
      setError(`Easy + Moderate + Difficult must add up to ${effectiveItemCount} (currently ${difficultyTotal}).`)
      return
    }

    setError(null)
    setIsGenerating(true)
    try {
      const session = await generateExam({
        subject,
        mode,
        itemCount: usingCustomTopics ? undefined : itemCount,
        topicCounts: usingCustomTopics ? topicCounts : undefined,
        questionTypeCounts,
        difficultyCounts,
      })
      navigate(`/app/exam/${session.sessionId}`, {
        state: {
          notice: session.notice ?? null,
          timeLimitSeconds: examType === 'timed' ? timedMinutes * 60 : undefined,
        },
      })
    } catch {
      setError('Could not generate an exam right now. Please try again.')
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar showMobileMenu={false} />

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
            {cameFromWizard ? (
              <motion.div variants={fadeUpItem}>
                <WizardHeader
                  subjectCode={activeSubjectDef?.code ?? subject}
                  subjectFullName={activeSubjectDef?.name ?? subject}
                  activeStepIndex={1}
                  onBack={() => navigate(`/app/choose-strategy/${subject}`)}
                />
              </motion.div>
            ) : (
              <motion.div variants={fadeUpItem} className="relative overflow-hidden rounded-2xl">
                <img
                  src={mountainHeader}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 bottom-0 hidden h-full w-80 object-contain object-right-bottom sm:block md:w-112 lg:w-136"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
                  >
                    <ArrowLeft className="size-4" />
                    Back to Mock Exams
                  </button>
                  <h1 className="font-serif mt-3 text-3xl font-bold text-[#7A2323] sm:text-4xl lg:text-5xl">
                    Create New Exam
                  </h1>
                  <p className="font-reading mt-3 max-w-lg text-sm text-[#3A2A1A]/70 sm:text-base">
                    Build your own practice exam using the knowledge bank. Customize the subjects,
                    question count, and difficulty level to match your study goals.
                  </p>
                </div>
              </motion.div>
            )}

            {cameFromWizard && (
              <motion.div variants={fadeUpItem}>
                <div className="mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-[#3A2A1A]/50 uppercase">
                  <span>Step 2 of 2</span>
                  <span className="h-px flex-1 bg-[#3A2A1A]/15" />
                </div>
                <h1 className="font-display text-4xl leading-[1.05] uppercase sm:text-5xl">
                  <span className="text-[#3A2A1A]">Set Quiz</span>{' '}
                  <span className="text-[#E0AC48]">Details</span>
                </h1>
                <p className="font-reading mt-4 max-w-xl text-[#3A2A1A]/70">
                  Customize your exam based on your preferred settings. You can adjust the name,
                  question count, and difficulty level.
                </p>
              </motion.div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="flex min-w-0 flex-col gap-6">
                <motion.div
                  variants={fadeUpItem}
                  className="flex flex-col gap-4 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
                >
                  <SectionHeading
                    icon={Bookmark}
                    title="Exam Details"
                    subtitle="Choose the exam type."
                  />

                  <div>
                    <p className="text-xs font-semibold text-[#3A2A1A]/60">Exam Type</p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setExamType('standard')}
                        className={cn(
                          'relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                          examType === 'standard'
                            ? 'border-transparent bg-[#7A2323] text-[#F3ECDC]'
                            : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                        )}
                      >
                        {examType === 'standard' && <GrungeOverlay />}
                        <FileText className="size-4" />
                        Standard Exam
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamType('timed')}
                        className={cn(
                          'relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                          examType === 'timed'
                            ? 'border-transparent bg-[#7A2323] text-[#F3ECDC]'
                            : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                        )}
                      >
                        {examType === 'timed' && <GrungeOverlay />}
                        <Timer className="size-4" />
                        Timed Exam
                      </button>
                    </div>
                    {examType === 'timed' && (
                      <div className="mt-3 flex items-center gap-2">
                        <label htmlFor="timedMinutes" className="text-xs font-semibold text-[#3A2A1A]/60">
                          Duration
                        </label>
                        <input
                          id="timedMinutes"
                          type="number"
                          min={10}
                          max={480}
                          value={timedMinutesInput}
                          onChange={(e) => setTimedMinutesInput(e.target.value)}
                          onBlur={() => setTimedMinutesInput(String(timedMinutes))}
                          className="w-20 rounded-lg border border-[#3A2A1A]/15 px-2.5 py-1.5 text-right text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                        />
                        <span className="text-xs text-[#3A2A1A]/60">minutes</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {!cameFromWizard && (
                <motion.div
                  variants={fadeUpItem}
                  className="flex flex-col gap-4 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
                >
                  <SectionHeading
                    icon={Layers}
                    title="Subjects"
                    subtitle="Choose which subject to include in your exam."
                  />

                  <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(4,minmax(0,1fr))]">
                    {activeSubjectDefs.map((def) => {
                      const isReal = Boolean(def.subjectKey)
                      const isSelected = isReal && def.subjectKey === subject
                      const count = def.subjectKey ? subjectCounts[def.subjectKey] : undefined

                      return (
                        <button
                          key={def.code}
                          type="button"
                          disabled={!isReal}
                          onClick={() => handleSelectSubject(def)}
                          className={cn(
                            'relative flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors',
                            !isReal && 'cursor-not-allowed opacity-50 grayscale',
                            isReal && isSelected
                              ? 'border-[#7A2323] bg-[#7A2323]/5'
                              : isReal
                                ? 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5'
                                : 'border-[#3A2A1A]/15',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-3 right-3 flex size-4 shrink-0 items-center justify-center rounded-[4px] border-2',
                              isSelected ? 'border-[#7A2323] bg-[#7A2323]' : 'border-[#3A2A1A]/25',
                            )}
                          >
                            {isSelected && <Check className="size-3 text-white" />}
                          </span>
                          <span
                            className={cn(
                              'flex size-9 items-center justify-center rounded-lg',
                              isSelected ? 'bg-[#7A2323]/15 text-[#7A2323]' : 'bg-[#3A2A1A]/5 text-[#3A2A1A]/60',
                            )}
                          >
                            <def.icon className="size-4.5" />
                          </span>
                          <div className="w-full min-w-0">
                            <p className="text-sm font-bold text-[#3A2A1A]">{def.code}</p>
                            <p className="truncate text-[11px] text-[#3A2A1A]/60">{def.name}</p>
                            <p className="mt-0.5 text-[11px] font-semibold text-[#3A2A1A]/50">
                              {isReal ? `${count ?? 0} items` : 'Coming soon'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid gap-3 border-t border-[#3A2A1A]/10 pt-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode('tos_simulator')}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                        mode === 'tos_simulator'
                          ? 'border-[#7A2323] bg-[#7A2323]/5'
                          : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                      )}
                    >
                      <ClipboardList className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
                      <div>
                        <p className="text-sm font-bold text-[#3A2A1A]">TOS Simulator Mode</p>
                        <p className="font-reading mt-1 text-xs text-[#3A2A1A]/70">
                          Assembled to match the official PRC TOS topic and difficulty ratios.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('subject_drill')}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                        mode === 'subject_drill'
                          ? 'border-[#7A2323] bg-[#7A2323]/5'
                          : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                      )}
                    >
                      <Landmark className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
                      <div>
                        <p className="text-sm font-bold text-[#3A2A1A]">Subject Drill Mode</p>
                        <p className="font-reading mt-1 text-xs text-[#3A2A1A]/70">
                          Plain practice across the whole subject — no TOS blueprint weighting.
                        </p>
                      </div>
                    </button>
                  </div>
                </motion.div>
                )}

                <motion.div
                  variants={fadeUpItem}
                  className="flex flex-col gap-5 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
                >
                  <SectionHeading
                    icon={Settings2}
                    title="Question Count & Mix"
                    subtitle="Set how many questions you want and what type."
                  />

                  <div className={cn('grid gap-5 sm:grid-cols-2', usingCustomTopics && 'opacity-50')}>
                    <div>
                      <label htmlFor="itemCount" className="text-xs font-semibold text-[#3A2A1A]/60">
                        Total Questions
                      </label>
                      <select
                        id="itemCount"
                        disabled={usingCustomTopics}
                        value={itemCount}
                        onChange={(e) => setItemCount(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-[#3A2A1A]/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40 disabled:cursor-not-allowed"
                      >
                        {ITEM_COUNT_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      {usingCustomTopics && (
                        <p className="font-reading mt-1 text-xs text-[#3A2A1A]/60">
                          Using the per-topic counts below instead.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#3A2A1A]/60">Question Types</p>
                      <div className="mt-1.5 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setQuestionTypeSelection('mcq')}
                          className={cn(
                            'rounded-xl border px-2 py-2.5 text-center transition-colors',
                            questionTypeSelection === 'mcq'
                              ? 'border-[#7A2323] bg-[#7A2323]/5'
                              : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                          )}
                        >
                          <p className="text-xs font-bold text-[#3A2A1A]">Multiple Choice</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionTypeSelection('identification')}
                          className={cn(
                            'rounded-xl border px-2 py-2.5 text-center transition-colors',
                            questionTypeSelection === 'identification'
                              ? 'border-[#7A2323] bg-[#7A2323]/5'
                              : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                          )}
                        >
                          <p className="text-xs font-bold text-[#3A2A1A]">Identification</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionTypeSelection('variant')}
                          title="Customize your own mix of question types and difficulty"
                          className={cn(
                            'rounded-xl border px-2 py-2.5 text-center transition-colors',
                            questionTypeSelection === 'variant'
                              ? 'border-[#7A2323] bg-[#7A2323]/5'
                              : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                          )}
                        >
                          <p className="text-xs font-bold text-[#3A2A1A]">Variant</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isVariant && (
                    <>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#3A2A1A]/60">Question Type Mix</p>
                          <p
                            className={cn(
                              'text-[10px] font-bold whitespace-nowrap',
                              questionTypeTotal === effectiveItemCount ? 'text-[#3A5A40]' : 'text-[#7A2323]',
                            )}
                          >
                            {questionTypeTotal} / {effectiveItemCount}
                          </p>
                        </div>
                        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#3A2A1A]/15 px-3 py-2">
                            <span className="text-xs font-semibold text-[#3A2A1A]">Multiple Choice</span>
                            <input
                              type="number"
                              min={0}
                              max={effectiveItemCount}
                              value={fieldValue('qt:mcq', questionTypeCounts.mcq)}
                              onChange={(e) => updateQuestionTypeCount('mcq', e.target.value)}
                              onBlur={() => clearRawField('qt:mcq')}
                              className="w-16 shrink-0 rounded-lg border border-[#3A2A1A]/15 px-2 py-1 text-right text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#3A2A1A]/15 px-3 py-2">
                            <span className="text-xs font-semibold text-[#3A2A1A]">Identification</span>
                            <input
                              type="number"
                              min={0}
                              max={effectiveItemCount}
                              value={fieldValue('qt:identification', questionTypeCounts.identification)}
                              onChange={(e) => updateQuestionTypeCount('identification', e.target.value)}
                              onBlur={() => clearRawField('qt:identification')}
                              className="w-16 shrink-0 rounded-lg border border-[#3A2A1A]/15 px-2 py-1 text-right text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#3A2A1A]/60">Difficulty Mix</p>
                          <p
                            className={cn(
                              'text-[10px] font-bold whitespace-nowrap',
                              difficultyTotal === effectiveItemCount ? 'text-[#3A5A40]' : 'text-[#7A2323]',
                            )}
                          >
                            {difficultyTotal} / {effectiveItemCount}
                          </p>
                        </div>
                        <div className="mt-1.5 grid grid-cols-3 gap-2">
                          {(['Easy', 'Moderate', 'Difficult'] as const).map((level) => (
                            <div
                              key={level}
                              className="flex flex-col items-center gap-1.5 rounded-xl border border-[#3A2A1A]/15 px-2 py-2.5"
                            >
                              <span className="text-xs font-semibold text-[#3A2A1A]">{level}</span>
                              <input
                                type="number"
                                min={0}
                                max={effectiveItemCount}
                                value={fieldValue(`diff:${level}`, difficultyCounts[level])}
                                onChange={(e) => updateDifficultyCount(level, e.target.value)}
                                onBlur={() => clearRawField(`diff:${level}`)}
                                className="w-full rounded-lg border border-[#3A2A1A]/15 px-2 py-1 text-center text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {hasTosTopics && (
                    <div className="flex flex-col gap-3 border-t border-[#3A2A1A]/10 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#3A2A1A]/60">
                            Customize {activeSubjectDef?.code ?? subject} Topics
                          </p>
                          <p className="font-reading mt-0.5 text-xs text-[#3A2A1A]/60">
                            Override the default PRC topic split with your own count per topic.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleCustomizeTopics}
                          className={cn(
                            'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
                            customizeTopics
                              ? 'border-transparent bg-[#3A5A40] text-white'
                              : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                          )}
                        >
                          {customizeTopics ? 'Customizing' : 'Customize'}
                        </button>
                      </div>

                      {customizeTopics && (
                        <div className="flex flex-col gap-2 border-t border-[#3A2A1A]/10 pt-3">
                          {topics.map((t) => (
                            <div key={t.category} className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#3A2A1A]">{t.category}</p>
                                <p className="text-xs text-[#3A2A1A]/50">
                                  {Math.round(t.weightPct * 100)}% default
                                  {t.theory !== null && t.problem !== null && (
                                    <> · {t.theory} theory / {t.problem} problem</>
                                  )}{' '}
                                  · {t.available} available
                                </p>
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={t.available}
                                value={fieldValue(`topic:${t.category}`, topicCounts[t.category] ?? 0)}
                                onChange={(e) => updateTopicCount(t.category, t.available, e.target.value)}
                                onBlur={() => clearRawField(`topic:${t.category}`)}
                                className="w-20 shrink-0 rounded-lg border border-[#3A2A1A]/15 px-2.5 py-1.5 text-right text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                              />
                            </div>
                          ))}
                          <div className="mt-1 flex items-center justify-between border-t border-[#3A2A1A]/10 pt-3 text-sm font-semibold text-[#3A2A1A]">
                            <span>Total items</span>
                            <span>{topicTotal}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  variants={fadeUpItem}
                  className="flex flex-col gap-4 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
                >
                  <SectionHeading
                    icon={Settings2}
                    title="Advanced Options"
                    subtitle="Fine-tune your exam (optional)."
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <AdvancedOptionRow
                      icon={Shuffle}
                      label="Randomize Questions"
                      description="Shuffle the order of questions."
                      checked
                    />
                    <AdvancedOptionRow
                      icon={ListChecks}
                      label="Show Explanation"
                      description="Reveal correct answers after each question."
                      checked
                    />
                    <AdvancedOptionRow
                      icon={ScrollText}
                      label="Include Rationale"
                      description="Show brief explanations for each option."
                      checked
                    />
                  </div>
                  <p className="font-reading -mt-1 text-xs text-[#3A2A1A]/50">
                    These are always on in the current build — per-exam control is coming soon.
                  </p>
                </motion.div>

                {error && (
                  <motion.p variants={fadeUpItem} className="text-sm font-semibold text-[#7A2323]">
                    {error}
                  </motion.p>
                )}
              </div>

              <motion.aside variants={fadeUpItem} className="flex flex-col gap-6 lg:sticky lg:top-8">
                <div className="flex flex-col gap-1 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[#E0AC48]/20 text-[#B4791F]">
                      <ClipboardList className="size-4.5" />
                    </span>
                    <p className="text-sm font-bold text-[#7A2323]">Your Exam Summary</p>
                  </div>

                  <SummaryRow
                    label="Exam Name"
                    value={`${activeSubjectDef?.code ?? subject} Practice Exam`}
                  />
                  <SummaryRow label="Subject" value={activeSubjectDef?.code ?? subject} />
                  <SummaryRow label="Total Questions" value={String(effectiveItemCount)} />
                  <SummaryRow
                    label="Question Types"
                    value={
                      isVariant
                        ? `MCQ ${questionTypeCounts.mcq} · Identification ${questionTypeCounts.identification}`
                        : questionTypeSelection === 'identification'
                          ? 'Identification (100%)'
                          : 'MCQ (100%)'
                    }
                  />
                  <SummaryRow
                    label="Difficulty Level"
                    value={
                      isVariant
                        ? `Easy ${difficultyCounts.Easy} · Moderate ${difficultyCounts.Moderate} · Difficult ${difficultyCounts.Difficult}`
                        : 'All Levels'
                    }
                    last
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#7A2323] px-6 py-3.5 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GrungeOverlay />
                    {isGenerating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {isGenerating ? 'Generating…' : 'Create Exam'}
                    {!isGenerating && <ArrowRight className="size-4" />}
                  </motion.button>
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-[#3A2A1A]/15 bg-white px-6 py-3 text-sm font-semibold text-[#3A2A1A]/50 transition-colors"
                  >
                    <Bookmark className="size-4" />
                    Save as Template
                  </button>
                </div>

                <div className="rounded-2xl border border-[#E0AC48]/30 bg-[#FBEED2] p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#7A2323]">
                    <Lightbulb className="size-4" />
                    Pro Tip
                  </p>
                  <p className="font-reading mt-2 text-sm text-[#3A2A1A]/80">
                    Answering under a timed setting closer to actual exam conditions helps build
                    the pacing and stamina the real board exam demands.
                  </p>
                </div>
              </motion.aside>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

interface SectionHeadingProps {
  icon: typeof Bookmark
  title: string
  subtitle: string
}

function SectionHeading({ icon: Icon, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3ECDC] text-[#7A2323]">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-[#7A2323]">{title}</p>
        <p className="font-reading text-xs text-[#3A2A1A]/60">{subtitle}</p>
      </div>
    </div>
  )
}

interface AdvancedOptionRowProps {
  icon: typeof Shuffle
  label: string
  description: string
  checked: boolean
}

function AdvancedOptionRow({ icon: Icon, label, description, checked }: AdvancedOptionRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#3A2A1A]/10 p-4">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-[#7A2323]" />
        <div>
          <p className="text-sm font-semibold text-[#3A2A1A]">{label}</p>
          <p className="font-reading mt-0.5 text-xs text-[#3A2A1A]/60">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={() => {}} disabled className="shrink-0" />
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  last?: boolean
}

function SummaryRow({ label, value, last }: SummaryRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5',
        !last && 'border-b border-[#3A2A1A]/10',
      )}
    >
      <div className="min-w-0">
        <p className="text-xs text-[#3A2A1A]/50">{label}</p>
        <p className="truncate text-sm font-semibold text-[#3A2A1A]">{value}</p>
      </div>
    </div>
  )
}
