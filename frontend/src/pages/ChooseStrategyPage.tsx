import { AnimatePresence, motion } from 'framer-motion'
import { Info, Sparkle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { AiVariationModeCard } from '@/components/quiz/AiVariationModeCard'
import { DualQuizModesCard } from '@/components/quiz/DualQuizModesCard'
import { getComingSoonKeys, STRATEGY_CARDS, STRATEGY_MODE_TEMPLATE } from '@/components/quiz/StrategyOptions'
import { VariantsDisplayCard } from '@/components/quiz/VariantsDisplayCard'
import { WizardAside } from '@/components/quiz/WizardAside'
import { WizardHeader } from '@/components/quiz/WizardHeader'
import { useAuth } from '@/context/AuthContext'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

// Full display name per subject code, ingested-content subjects only — the
// same lineup ExamSetupPage's SUBJECT_DEFS selects from.
const SUBJECT_LABELS: Record<string, string> = {
  RFBT: 'Regulatory Framework for Business Transactions',
  TAX: 'Taxation',
  IS: 'Immunology & Serology',
}

export function ChooseStrategyPage() {
  const { subject } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedKey, setSelectedKey] = useState<(typeof STRATEGY_CARDS)[number]['key']>(
    STRATEGY_CARDS[0].key,
  )
  const [showComingSoonNotice, setShowComingSoonNotice] = useState(false)

  const comingSoonKeys = getComingSoonKeys(user?.course)
  const isComingSoon = (key: (typeof STRATEGY_CARDS)[number]['key']) =>
    comingSoonKeys.includes(key)

  useEffect(() => {
    if (!showComingSoonNotice) return
    const timeout = setTimeout(() => setShowComingSoonNotice(false), 3200)
    return () => clearTimeout(timeout)
  }, [showComingSoonNotice])

  const subjectFullName = subject ? SUBJECT_LABELS[subject] : undefined

  if (!subject || !subjectFullName) {
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

  const subjectCode = subject

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

                    if (card.key === 'tagging' && selected) {
                      return (
                        <motion.div key={card.key} variants={fadeUpItem}>
                          <AiVariationModeCard
                            selected={selected}
                            onSelect={() => setSelectedKey(card.key)}
                            comingSoon={isComingSoon(card.key)}
                          />
                        </motion.div>
                      )
                    }

                    if (card.key === 'modes' && selected) {
                      return (
                        <motion.div key={card.key} variants={fadeUpItem}>
                          <DualQuizModesCard
                            selected={selected}
                            onSelect={() => setSelectedKey(card.key)}
                            comingSoon={isComingSoon(card.key)}
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

                    const comingSoon = isComingSoon(card.key)

                    return (
                      <motion.label
                        key={card.key}
                        variants={fadeUpItem}
                        className={cn(
                          'flex cursor-pointer items-center gap-5 rounded-2xl border p-5 transition-colors sm:p-6',
                          comingSoon && 'opacity-60 grayscale',
                          selected
                            ? 'border-[#3A5A40] bg-white shadow-[0_0_0_1px_rgba(58,90,64,0.35)]'
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
                            {comingSoon && (
                              <span className="ml-2 inline-block rounded-full bg-[#3A2A1A]/10 px-2 py-0.5 align-middle text-[10px] font-bold tracking-wide text-[#3A2A1A]/60 uppercase">
                                Coming Soon
                              </span>
                            )}
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
                            'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            selected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-[#3A2A1A]/20',
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

            <WizardAside
              subjectCode={subjectCode}
              subjectFullName={subjectFullName}
              ctaLabel="Continue"
              onCta={() => {
                if (isComingSoon(selectedKey)) {
                  setShowComingSoonNotice(true)
                  return
                }
                navigate('/app/exam-setup', {
                  state: { subject, mode: STRATEGY_MODE_TEMPLATE[selectedKey] },
                })
              }}
            />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showComingSoonNotice && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl bg-[#3A2A1A] px-5 py-4 text-sm font-semibold text-[#F3ECDC] shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
          >
            <Info className="size-5 shrink-0 text-[#E0AC48]" />
            <span>This strategy is coming soon — pick another one to continue for now.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
