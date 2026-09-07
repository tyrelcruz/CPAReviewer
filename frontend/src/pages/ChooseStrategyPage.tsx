import { Lock, Sparkle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { CrossCenterTaggingCard } from '@/components/quiz/CrossCenterTaggingCard'
import { DualQuizModesCard } from '@/components/quiz/DualQuizModesCard'
import { COMING_SOON_KEYS, STRATEGY_CARDS } from '@/components/quiz/StrategyOptions'
import { VariantsDisplayCard } from '@/components/quiz/VariantsDisplayCard'
import { WizardAside } from '@/components/quiz/WizardAside'
import { WizardHeader } from '@/components/quiz/WizardHeader'
import { quizSets } from '@/data/quiz-data'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function ChooseStrategyPage() {
  const { quizSetId } = useParams()
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState<(typeof STRATEGY_CARDS)[number]['key']>(
    STRATEGY_CARDS.find((card) => !COMING_SOON_KEYS.includes(card.key))?.key ??
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
          <WizardHeader
            subjectCode={subjectCode}
            subjectFullName={subjectFullName}
            activeStepIndex={0}
            onBack={() => navigate('/app')}
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
                    <span>Step 1 of 2</span>
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
                    const isComingSoon = COMING_SOON_KEYS.includes(card.key)

                    if (card.key === 'tagging') {
                      return (
                        <motion.div key={card.key} variants={fadeUpItem}>
                          <CrossCenterTaggingCard />
                        </motion.div>
                      )
                    }

                    if (card.key === 'modes' && selected) {
                      return (
                        <motion.div key={card.key} variants={fadeUpItem}>
                          <DualQuizModesCard
                            selected={selected}
                            onSelect={() => setSelectedKey(card.key)}
                          />
                        </motion.div>
                      )
                    }

                    if (card.key === 'variants' && selected) {
                      return (
                        <motion.div key={card.key} variants={fadeUpItem}>
                          <VariantsDisplayCard
                            selected={selected}
                            onSelect={() => setSelectedKey(card.key)}
                          />
                        </motion.div>
                      )
                    }

                    return (
                      <motion.label
                        key={card.key}
                        variants={fadeUpItem}
                        className={cn(
                          'flex items-center gap-5 rounded-2xl border p-5 transition-colors sm:p-6',
                          isComingSoon
                            ? 'cursor-not-allowed border-[#3A2A1A]/10 bg-[#F3ECDC]/40 opacity-60 grayscale'
                            : cn(
                                'cursor-pointer',
                                selected
                                  ? 'border-[#3A5A40] bg-white shadow-[0_0_0_1px_rgba(58,90,64,0.35)]'
                                  : 'border-[#3A2A1A]/10 bg-white hover:border-[#3A2A1A]/20',
                              ),
                        )}
                      >
                        <input
                          type="radio"
                          name="strategy"
                          value={card.key}
                          checked={selected}
                          disabled={isComingSoon}
                          onChange={() => setSelectedKey(card.key)}
                          className="sr-only"
                        />
                        <div className="hidden shrink-0 sm:block">
                          <card.Icon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-lg font-bold text-[#7A2323] uppercase">
                              {card.title}
                            </h3>
                            {isComingSoon && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#3A2A1A]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#3A2A1A]/70 uppercase">
                                <Lock className="size-2.5" />
                                Coming Soon
                              </span>
                            )}
                          </div>
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
                        {!isComingSoon && (
                          <span
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                              selected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-[#3A2A1A]/20',
                            )}
                          >
                            {selected && <span className="size-2 rounded-full bg-white" />}
                          </span>
                        )}
                      </motion.label>
                    )
                  })}
                </div>
              </motion.div>
            </div>

            <WizardAside
              subjectCode={subjectCode}
              subjectFullName={subjectFullName}
              ctaLabel="Continue"
              onCta={() => navigate(`/app/choose-strategy/${quizSet.id}/details`)}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
