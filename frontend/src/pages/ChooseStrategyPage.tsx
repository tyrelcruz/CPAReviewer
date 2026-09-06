import { ArrowLeft, ArrowRight, Layers, Sparkle, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import mountainLandscape from '@/assets/images/mountain_landscape.png'
import kabisEmblem from '@/assets/logo/kabis_emblem.png'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { STRATEGY_CARDS } from '@/components/quiz/StrategyOptions'
import { quizSets } from '@/data/quiz-data'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

const WIZARD_STEPS = ['Choose Strategy', 'Set Quiz Details', 'Start Exam']

export function ChooseStrategyPage() {
  const { quizSetId } = useParams()
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState<(typeof STRATEGY_CARDS)[number]['key']>(
    STRATEGY_CARDS[0].key,
  )

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

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#3A2A1A]/70 transition-colors hover:text-[#7A2323]"
          >
            <ArrowLeft className="size-4" />
            Back to Subjects
          </button>

          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="font-display text-2xl text-[#7A2323]">{subjectCode}</p>
              <p className="font-reading mt-0.5 text-xs font-semibold tracking-wide text-[#3A2A1A]/60 uppercase">
                {subjectFullName}
              </p>
            </div>

            <ol className="flex flex-wrap items-center gap-2">
              {WIZARD_STEPS.map((step, i) => (
                <li
                  key={step}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    i === 0 ? 'bg-[#530b08] text-white' : 'bg-[#3A2A1A]/5 text-[#3A2A1A]/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      i === 0
                        ? 'bg-white text-[#530b08]'
                        : 'border border-[#3A2A1A]/20 text-[#3A2A1A]/40',
                    )}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

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
                    <span>Step 1 of 3</span>
                    <span className="h-px flex-1 bg-[#3A2A1A]/15" />
                  </div>
                  <h1 className="font-display text-4xl leading-[1.05] uppercase sm:text-5xl">
                    <span className="text-[#3A2A1A]">Choose your</span>
                    <br />
                    <span className="text-[#E0AC48]">Strategy</span>
                  </h1>
                  <p className="font-reading mt-4 max-w-xl text-[#3A2A1A]/70">
                    Select a strategy that fits your study goals. Each strategy is designed to
                    give you a smarter, more focused way to prepare.
                  </p>
                </motion.div>

                <div role="radiogroup" aria-label="Exam strategy" className="flex flex-col gap-4">
                  {STRATEGY_CARDS.map((card) => {
                    const selected = card.key === selectedKey
                    return (
                      <motion.label
                        key={card.key}
                        variants={fadeUpItem}
                        className={cn(
                          'flex cursor-pointer items-start gap-5 rounded-2xl border p-5 transition-colors sm:p-6',
                          selected
                            ? 'border-[#E0AC48] bg-white shadow-[0_0_0_1px_rgba(224,172,72,0.4)]'
                            : 'border-[#3A2A1A]/10 bg-white hover:border-[#3A2A1A]/20',
                        )}
                      >
                        <input
                          type="radio"
                          name="strategy"
                          value={card.key}
                          checked={selected}
                          onChange={() => setSelectedKey(card.key)}
                          className="sr-only"
                        />
                        <div className="hidden shrink-0 sm:block">
                          <card.Icon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-lg font-bold text-[#7A2323] uppercase">
                            {card.title}
                          </h3>
                          <p className="font-reading mt-1.5 text-sm text-[#3A2A1A]/75">
                            {card.description}
                          </p>
                          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#3A2A1A]/5 px-3 py-2.5">
                            <Sparkle className="mt-0.5 size-3.5 shrink-0 text-[#B4791F]" />
                            <p className="font-reading text-xs text-[#3A2A1A]/70">
                              {card.whyText}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            selected ? 'border-[#E0AC48] bg-[#E0AC48]' : 'border-[#3A2A1A]/20',
                          )}
                        >
                          {selected && <span className="size-2 rounded-full bg-white" />}
                        </span>
                      </motion.label>
                    )
                  })}
                </div>
              </motion.div>
            </div>

            <aside className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-[#530b08] p-6 text-[#F3ECDC] lg:sticky lg:top-8">
              <img
                src={kabisEmblem}
                alt=""
                aria-hidden="true"
                className="mx-auto h-28 w-28 shrink-0 object-contain"
              />

              <div>
                <p className="font-serif text-2xl font-bold text-white">{subjectCode}</p>
                <p className="font-reading mt-1 text-xs font-semibold tracking-wide text-[#E0AC48] uppercase">
                  {subjectFullName}
                </p>
              </div>

              <div className="h-px bg-[#E0AC48]/40" />

              <div className="flex items-start gap-3">
                <Layers className="size-5 shrink-0 text-[#E0AC48]" />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#E0AC48] uppercase">
                    Strategy Component
                  </p>
                  <p className="font-reading mt-0.5 text-sm text-[#F3ECDC]">
                    {STRATEGY_CARDS.length} Options Available
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#E0AC48]/40" />

              <div className="flex items-start gap-3">
                <Target className="size-5 shrink-0 text-[#E0AC48]" />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#E0AC48] uppercase">
                    Your Goal
                  </p>
                  <p className="font-reading mt-0.5 text-sm text-[#F3ECDC]">
                    Build smarter. Pass stronger.
                  </p>
                </div>
              </div>

              <div className="relative -mx-6 mt-2 h-36 w-[calc(100%+3rem)] shrink-0 sm:h-44">
                <img
                  src={mountainLandscape}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom opacity-90"
                />
              </div>

              <button
                type="button"
                onClick={() => navigate(`/app/practice/${quizSet.id}`)}
                className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-[#E0AC48] px-6 py-3.5 text-sm font-bold tracking-wide text-[#3A2A1A] uppercase transition-transform hover:scale-[1.02]"
              >
                Continue
                <ArrowRight className="size-4" />
              </button>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
