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
  FileText,
  Gauge,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  ListChecks,
  Loader2,
  Scale,
  ScrollText,
  Settings2,
  Shuffle,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { generateExam, listRfbtTopics, listSubjectCounts } from '@/api/exams'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Switch } from '@/components/ui/switch'
import mountainHeader from '@/assets/images/carabao_repia.png'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ExamMode, RfbtTopic } from '@/types/bank'

function defaultTopicCounts(topics: RfbtTopic[], total: number): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const t of topics) {
    counts[t.category] = Math.min(t.available, Math.round(total * t.weightPct))
  }
  return counts
}

const MIN_ITEM_COUNT = 10
const MAX_ITEM_COUNT = 200

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
const SUBJECT_DEFS: SubjectDef[] = [
  { code: 'FAR', name: 'Financial Accounting & Reporting', icon: BookOpen },
  { code: 'AUD', name: 'Auditing & Attestation', icon: Scale },
  { code: 'REG', name: 'Regulation', icon: Gauge },
  { code: 'TCP', name: 'Taxation', icon: Calculator, subjectKey: 'TAX' },
  { code: 'MAS', name: 'Management Advisory Services', icon: BarChart3 },
  { code: 'AFAR', name: 'Agricultural & Fisheries', icon: Leaf },
  { code: 'RFBT', name: 'Regulatory Framework for Business Transactions', icon: Landmark, subjectKey: 'RFBT' },
]

const DIFFICULTY_OPTIONS = ['All Levels', 'Easy', 'Moderate', 'Difficult']

export function ExamSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const requestedState = location.state as { subject?: string; mode?: ExamMode } | null
  const requestedSubject = requestedState?.subject
  const [examName, setExamName] = useState('')
  const [examType, setExamType] = useState<'standard' | 'timed'>('standard')
  const [timedMinutes, setTimedMinutes] = useState(90)

  const [subject, setSubject] = useState(
    requestedSubject && SUBJECT_DEFS.some((d) => d.subjectKey === requestedSubject)
      ? requestedSubject
      : 'RFBT',
  )
  const [mode, setMode] = useState<ExamMode>(
    requestedState?.mode === 'subject_drill' ? 'subject_drill' : 'tos_simulator',
  )
  const [itemCount, setItemCount] = useState(70)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({})
  const [topics, setTopics] = useState<RfbtTopic[]>([])
  const [customizeTopics, setCustomizeTopics] = useState(false)
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    listSubjectCounts()
      .then(setSubjectCounts)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (subject !== 'RFBT') return
    listRfbtTopics()
      .then(setTopics)
      .catch(() => {})
  }, [subject])

  const usingCustomTopics = customizeTopics && subject === 'RFBT' && mode === 'tos_simulator'
  const topicTotal = Object.values(topicCounts).reduce((sum, n) => sum + n, 0)
  const effectiveItemCount = usingCustomTopics ? topicTotal : itemCount
  const activeSubjectDef = SUBJECT_DEFS.find((s) => s.subjectKey === subject)

  function handleToggleCustomizeTopics() {
    if (!customizeTopics) {
      setTopicCounts(defaultTopicCounts(topics, itemCount))
    }
    setCustomizeTopics((v) => !v)
  }

  function updateTopicCount(category: string, available: number, rawValue: string) {
    const raw = Number(rawValue)
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(available, Math.round(raw))) : 0
    setTopicCounts((prev) => ({ ...prev, [category]: clamped }))
  }

  function handleSelectSubject(def: SubjectDef) {
    if (!def.subjectKey) return
    setSubject(def.subjectKey)
  }

  async function handleGenerate() {
    if (usingCustomTopics && topicTotal <= 0) {
      setError('Set at least one topic count above 0 before generating.')
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
                  onClick={() => navigate('/app/dashboard')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
                >
                  <ArrowLeft className="size-4" />
                  Back to dashboard
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

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="flex min-w-0 flex-col gap-6">
                <motion.div
                  variants={fadeUpItem}
                  className="flex flex-col gap-4 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
                >
                  <SectionHeading
                    icon={Bookmark}
                    title="Exam Details"
                    subtitle="Give your exam a name and choose the type."
                  />

                  <div>
                    <label htmlFor="examName" className="text-xs font-semibold text-[#3A2A1A]/60">
                      Exam Name (optional)
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#3A2A1A]/15 bg-white px-3.5 py-2.5">
                      <input
                        id="examName"
                        type="text"
                        maxLength={50}
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="e.g. FAR Practice Exam - Week 3"
                        className="w-full bg-transparent text-sm text-[#3A2A1A] outline-none placeholder:text-[#3A2A1A]/40"
                      />
                      <span className="shrink-0 text-xs text-[#3A2A1A]/40">{examName.length}/50</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#3A2A1A]/60">Exam Type</p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setExamType('standard')}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                          examType === 'standard'
                            ? 'border-transparent bg-[#7A2323] text-[#F3ECDC]'
                            : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                        )}
                      >
                        <FileText className="size-4" />
                        Standard Exam
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamType('timed')}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                          examType === 'timed'
                            ? 'border-transparent bg-[#7A2323] text-[#F3ECDC]'
                            : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                        )}
                      >
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
                          value={timedMinutes}
                          onChange={(e) =>
                            setTimedMinutes(Math.max(10, Math.min(480, Number(e.target.value) || 0)))
                          }
                          className="w-20 rounded-lg border border-[#3A2A1A]/15 px-2.5 py-1.5 text-right text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                        />
                        <span className="text-xs text-[#3A2A1A]/60">minutes</span>
                      </div>
                    )}
                  </div>
                </motion.div>

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
                    {SUBJECT_DEFS.map((def) => {
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
                      <input
                        id="itemCount"
                        type="number"
                        min={MIN_ITEM_COUNT}
                        max={MAX_ITEM_COUNT}
                        disabled={usingCustomTopics}
                        value={itemCount}
                        onChange={(e) =>
                          setItemCount(
                            Math.max(
                              MIN_ITEM_COUNT,
                              Math.min(MAX_ITEM_COUNT, Number(e.target.value) || MIN_ITEM_COUNT),
                            ),
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-[#3A2A1A]/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#3A2A1A] outline-none focus:border-[#7A2323]/40 disabled:cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-[#3A2A1A]/50">
                        ({MIN_ITEM_COUNT} - {MAX_ITEM_COUNT})
                      </p>
                      {usingCustomTopics && (
                        <p className="font-reading mt-1 text-xs text-[#3A2A1A]/60">
                          Using the per-topic counts below instead.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#3A2A1A]/60">Question Types</p>
                      <div className="mt-1.5 grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-[#7A2323] bg-[#7A2323]/5 px-2 py-2.5 text-center">
                          <p className="text-xs font-bold text-[#3A2A1A]">Multiple Choice</p>
                          <p className="text-[10px] text-[#3A2A1A]/50">(100%)</p>
                        </div>
                        <div
                          title="Coming soon"
                          className="cursor-not-allowed rounded-xl border border-[#3A2A1A]/15 px-2 py-2.5 text-center opacity-50"
                        >
                          <p className="text-xs font-bold text-[#3A2A1A]">True or False</p>
                          <p className="text-[10px] text-[#3A2A1A]/50">(0%)</p>
                        </div>
                        <div
                          title="Coming soon"
                          className="cursor-not-allowed rounded-xl border border-[#3A2A1A]/15 px-2 py-2.5 text-center opacity-50"
                        >
                          <p className="text-xs font-bold text-[#3A2A1A]">Problem Solving</p>
                          <p className="text-[10px] text-[#3A2A1A]/50">(0%)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#3A2A1A]/60">Difficulty Level</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DIFFICULTY_OPTIONS.map((label) => {
                        const isAllLevels = label === 'All Levels'
                        return (
                          <button
                            key={label}
                            type="button"
                            disabled={!isAllLevels}
                            title={isAllLevels ? undefined : 'Coming soon — exams currently blend all difficulty levels'}
                            className={cn(
                              'rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                              isAllLevels
                                ? 'border-transparent bg-[#7A2323] text-[#F3ECDC]'
                                : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80',
                            )}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {subject === 'RFBT' && mode === 'tos_simulator' && topics.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-[#3A2A1A]/10 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#3A2A1A]/60">
                            Customize RFBT Topics
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
                                <p className="truncate text-sm font-semibold text-[#3A2A1A]">
                                  {t.category}
                                </p>
                                <p className="text-xs text-[#3A2A1A]/50">
                                  {Math.round(t.weightPct * 100)}% default · {t.available} available
                                </p>
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={t.available}
                                value={topicCounts[t.category] ?? 0}
                                onChange={(e) => updateTopicCount(t.category, t.available, e.target.value)}
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
                    value={examName || `${activeSubjectDef?.code ?? subject} Practice Exam`}
                  />
                  <SummaryRow label="Subject" value={activeSubjectDef?.code ?? subject} />
                  <SummaryRow label="Total Questions" value={String(effectiveItemCount)} />
                  <SummaryRow label="Question Types" value="MCQ (100%)" />
                  <SummaryRow label="Difficulty Level" value="All Levels" last />
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#7A2323] px-6 py-3.5 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
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
