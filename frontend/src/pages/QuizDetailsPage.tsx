import {
  ClipboardList,
  Gauge,
  Landmark,
  Lightbulb,
  Settings2,
  Target,
  Timer,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { WizardAside } from '@/components/quiz/WizardAside'
import { WizardHeader } from '@/components/quiz/WizardHeader'
import { GrungeOverlay } from '@/components/ui/GrungeOverlay'
import { Switch } from '@/components/ui/switch'
import { quizSets } from '@/data/quiz-data'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

type QuizMode = 'tos_simulator' | 'subject_drill'

const ITEM_COUNT_OPTIONS = [25, 50, 70, 100]
const TIME_LIMIT_OPTIONS = [
  { seconds: 30 * 60, label: '00:30:00' },
  { seconds: 60 * 60, label: '01:00:00' },
  { seconds: 90 * 60, label: '01:30:00' },
  { seconds: 120 * 60, label: '02:00:00' },
  { seconds: 180 * 60, label: '03:00:00' },
]

export function QuizDetailsPage() {
  const { quizSetId } = useParams()
  const navigate = useNavigate()

  const [mode, setMode] = useState<QuizMode>('tos_simulator')
  const [itemCount, setItemCount] = useState(70)
  const [customRatio, setCustomRatio] = useState(false)
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(true)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(90 * 60)

  const quizSet = quizSetId ? quizSets.find((set) => set.id === quizSetId) : undefined

  if (!quizSet) {
    return (
      <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="mx-auto max-w-lg text-center">
            <p className="font-display text-2xl text-[#7A2323]">Exam not found</p>
            <p className="font-reading mt-2 text-sm text-[#3A2A1A]/70">
              We couldn&rsquo;t find that exam. It may have been moved or renamed.
            </p>
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="mt-6 rounded-full bg-[#7A2323] px-6 py-3 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
            >
              Back to Mock Exams
            </button>
          </div>
        </div>
      </div>
    )
  }

  const subjectCode = quizSet.code ?? quizSet.title
  const subjectFullName = quizSet.description.split(' — ')[0]

  function handleContinue() {
    navigate(`/app/practice/${quizSet!.id}`, {
      state: {
        itemCount,
        // Quiz has no untimed mode — disabling the toggle just falls back to
        // its default questions.length * SECONDS_PER_QUESTION pacing.
        timeLimitSeconds: timeLimitEnabled ? timeLimitSeconds : undefined,
      },
    })
  }

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <WizardHeader
            subjectCode={subjectCode}
            subjectFullName={subjectFullName}
            activeStepIndex={1}
            onBack={() => navigate(`/app/choose-strategy/${quizSet.id}`)}
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <motion.div
                initial="hidden"
                animate="show"
                variants={staggerContainer}
                className="flex flex-col gap-6"
              >
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
                    Customize your quiz based on your preferred settings. You can adjust the
                    number of questions, difficulty, and time limit.
                  </p>
                </motion.div>

                <motion.div
                  variants={fadeUpItem}
                  className="divide-y divide-[#3A2A1A]/10 overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white"
                >
                  <SettingRow
                    icon={ClipboardList}
                    label="Quiz Mode"
                    description="Choose how you want to take your quiz."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ModeCard
                        selected={mode === 'tos_simulator'}
                        onClick={() => setMode('tos_simulator')}
                        title="TOS Simulator Mode"
                        badge="Recommended"
                        description="70-item exam with PRC TOS weights and difficulty ratios (30% Easy, 40% Moderate, 30% Difficult)."
                        Icon={Target}
                      />
                      <ModeCard
                        selected={mode === 'subject_drill'}
                        onClick={() => setMode('subject_drill')}
                        title="Subject Drill Mode"
                        description="Plain practice across the whole subject, no TOS blueprint weighting."
                        Icon={Landmark}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={ClipboardList}
                    label="Number of Questions"
                    description="How many questions do you want to answer?"
                  >
                    <select
                      value={itemCount}
                      onChange={(e) => setItemCount(Number(e.target.value))}
                      className="w-full max-w-xs rounded-xl border border-[#3A2A1A]/15 bg-white py-2.5 px-3.5 text-sm font-medium text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                    >
                      {ITEM_COUNT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} Questions
                        </option>
                      ))}
                    </select>
                  </SettingRow>

                  <SettingRow
                    icon={Gauge}
                    label="Difficulty Ratio"
                    description="Use the default TOS ratio or set your own (Drill Mode)."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RadioCard
                        selected={!customRatio}
                        onClick={() => setCustomRatio(false)}
                        title="TOS Default"
                        description="30% / 40% / 30%"
                      />
                      <RadioCard
                        selected={customRatio}
                        onClick={() => setCustomRatio(true)}
                        title="Custom Ratio"
                        description="Set your own ratio"
                        trailingIcon={Settings2}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={Timer}
                    label="Time Limit"
                    description="Set a time limit for your quiz (optional)."
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Switch checked={timeLimitEnabled} onCheckedChange={setTimeLimitEnabled} />
                      <select
                        value={timeLimitSeconds}
                        disabled={!timeLimitEnabled}
                        onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                        className="rounded-xl border border-[#3A2A1A]/15 bg-white py-2.5 px-3.5 text-sm font-medium text-[#3A2A1A] outline-none focus:border-[#7A2323]/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {TIME_LIMIT_OPTIONS.map((opt) => (
                          <option key={opt.seconds} value={opt.seconds}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {timeLimitEnabled && (
                        <span className="text-xs text-[#3A2A1A]/50">
                          ({Math.round(timeLimitSeconds / 60)} minutes)
                        </span>
                      )}
                    </div>
                  </SettingRow>
                </motion.div>

                <motion.div
                  variants={fadeUpItem}
                  className="flex flex-col gap-4 rounded-2xl border border-[#E0AC48]/40 bg-[#E0AC48]/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#B4791F]" />
                    <div>
                      <p className="text-xs font-bold tracking-wide text-[#3A2A1A] uppercase">
                        Quick Tip
                      </p>
                      <p className="font-reading mt-0.5 text-sm text-[#3A2A1A]/80">
                        TOS Simulator Mode is best for exam simulation, while Drill Mode helps you
                        practice a subject without worrying about the official topic weighting.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#7A2323] px-6 py-3 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
                  >
                    Start Exam
                    <Target className="size-4" />
                  </button>
                </motion.div>
              </motion.div>
            </div>

            <WizardAside
              subjectCode={subjectCode}
              subjectFullName={subjectFullName}
              ctaLabel="Start Exam"
              onCta={handleContinue}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

interface SettingRowProps {
  icon: typeof ClipboardList
  label: string
  description: string
  children: ReactNode
}

function SettingRow({ icon: Icon, label, description, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
      <div className="flex items-start gap-3 sm:w-60 sm:shrink-0">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3ECDC] text-[#7A2323]">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#3A2A1A]">{label}</p>
          <p className="font-reading mt-0.5 text-xs text-[#3A2A1A]/60">{description}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

interface ModeCardProps {
  selected: boolean
  onClick: () => void
  title: string
  description: string
  badge?: string
  Icon: typeof Target
}

function ModeCard({ selected, onClick, title, description, badge, Icon }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors',
        selected ? 'border-[#7A2323] bg-[#7A2323]/5' : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
      )}
    >
      <span
        className={cn(
          'absolute top-3.5 right-3.5 flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full border-2',
          selected ? 'border-[#7A2323] bg-[#7A2323]' : 'border-[#3A2A1A]/25',
        )}
      >
        {selected && <GrungeOverlay />}
        {selected && <span className="relative size-1.5 rounded-full bg-white" />}
      </span>
      <div className="flex flex-wrap items-center gap-2 pr-6">
        <Icon className="size-4 shrink-0 text-[#7A2323]" />
        <span className="text-sm font-bold text-[#3A2A1A]">{title}</span>
        {badge && (
          <span className="rounded-full bg-[#E0AC48] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#3A2A1A] uppercase">
            {badge}
          </span>
        )}
      </div>
      <p className="font-reading text-xs text-[#3A2A1A]/70">{description}</p>
    </button>
  )
}

interface RadioCardProps {
  selected: boolean
  onClick: () => void
  title: string
  description: string
  trailingIcon?: typeof Settings2
}

function RadioCard({ selected, onClick, title, description, trailingIcon: TrailingIcon }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-between gap-2 rounded-xl border p-4 text-left transition-colors',
        selected ? 'border-[#7A2323] bg-[#7A2323]/5' : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
      )}
    >
      <div>
        <p className="text-sm font-bold text-[#3A2A1A]">{title}</p>
        <p className="font-reading mt-0.5 text-xs text-[#3A2A1A]/70">{description}</p>
      </div>
      {TrailingIcon && <TrailingIcon className="size-4 shrink-0 text-[#3A2A1A]/40" />}
    </button>
  )
}
