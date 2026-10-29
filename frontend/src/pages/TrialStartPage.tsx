import { motion } from 'framer-motion'
import { ArrowRight, ClipboardList, Droplet, Lock, Microscope, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { listTrialSubjects, type TrialSubject } from '@/api/trial'
import carabaoRepia from '@/assets/images/carabao_repia.png'
import smallMountain from '@/assets/images/small_mountain.png'
import heroQuizLoopVideo from '@/assets/videos/hero-quiz-loop.mp4'
import { Navbar } from '@/components/landing/Navbar'
import { GrungeOverlay } from '@/components/ui/GrungeOverlay'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { getTrialAttempt } from '@/lib/trialAttempt'

interface SubjectCard {
  Icon: LucideIcon
  title: string
  description: string
  color: string
}

// Same RMT lineup as SubjectsSection / ExamSetupPage — the trial offers the
// subjects that actually have an ingested bank, nothing aspirational.
const SUBJECT_CARDS: Record<string, SubjectCard> = {
  IS: {
    Icon: Microscope,
    title: 'Immunology & Serology',
    description: 'Antigen-antibody reactions, the complement system, serologic testing.',
    color: '#3A5A40',
  },
  BB: {
    Icon: Droplet,
    title: 'Blood Banking',
    description: 'Blood typing, compatibility testing, transfusion medicine.',
    color: '#7A2323',
  },
  MTAP: {
    Icon: ClipboardList,
    title: 'MTAP Comprehensive',
    description: 'A mixed draw across every subject in the bank.',
    color: '#E0AC48',
  },
}

export function TrialStartPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<TrialSubject[] | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [loadFailed, setLoadFailed] = useState(false)
  const previousAttempt = getTrialAttempt()

  useEffect(() => {
    let cancelled = false
    listTrialSubjects()
      .then((data) => {
        if (cancelled) return
        setSubjects(data.subjects.filter((s) => s.code in SUBJECT_CARDS))
        setQuestionCount(data.questionCount)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-[#F3ECDC] text-[#3A2A1A]">
      <Navbar />

      {/* Same decorative stack as the landing page's SubjectsSection: a faint
          full-bleed texture for atmosphere, mountains anchored to the bottom
          corners, and the hero loop filling the gutter beside the headline.
          overflow-hidden is what keeps their negative offsets from widening
          the page. */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={carabaoRepia}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-10 mix-blend-overlay"
        />
        <img
          src={smallMountain}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-40px] left-0 h-32 w-auto object-contain object-bottom-left opacity-30 sm:h-48 lg:h-64"
        />
        <img
          src={smallMountain}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-[-40px] h-32 w-auto -scale-x-100 object-contain object-bottom-right opacity-20 sm:h-48 lg:h-64"
        />

        <main className="relative mx-auto max-w-7xl px-6 py-12 sm:py-16">
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center">
              <div className="min-w-0">
                <motion.p
                  variants={fadeUpItem}
                  className="text-xs font-semibold tracking-widest text-[#7A2323] uppercase"
                >
                  No account needed
                </motion.p>
                <motion.h1
                  variants={fadeUpItem}
                  className="font-display mt-3 text-3xl leading-tight text-[#7A2323] sm:text-4xl"
                >
                  Try a real exam, free
                </motion.h1>
                <motion.p
                  variants={fadeUpItem}
                  className="font-reading mt-3 text-sm text-[#3A2A1A]/75 sm:text-base"
                >
                  {questionCount} questions pulled straight from the same bank our reviewers use.
                  Timed, scored, with two explanations unlocked — no signup until you want to keep
                  going.
                </motion.p>
              </div>

              {/* Its own column rather than an absolute overlay — the loop
                  carries an opaque backdrop, so floating it over the page read
                  as a stray panel colliding with the banner below. */}
              <video
                src={heroQuizLoopVideo}
                autoPlay
                muted
                loop
                playsInline
                className="pointer-events-none hidden aspect-[1320/740] w-full rounded-2xl border border-[#3A2A1A]/10 object-cover shadow-sm lg:block"
              />
            </div>

            {previousAttempt && (
              <motion.div
                variants={fadeUpItem}
                className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#E0AC48]/50 bg-[#E0AC48]/10 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-serif text-lg font-bold text-[#7A2323]">
                    <Lock className="size-4 shrink-0 text-[#B4791F]" />
                    You've used your free exam
                  </p>
                  <p className="font-reading mt-1 text-sm text-[#3A2A1A]/75">
                    You scored {previousAttempt.correct}/{previousAttempt.total} on{' '}
                    {SUBJECT_CARDS[previousAttempt.subject]?.title ?? previousAttempt.subject}.
                    Create a free account to keep practising and unlock every explanation.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end lg:flex-row lg:items-center lg:gap-4">
                  <Link
                    to="/signup"
                    className="relative flex items-center justify-center gap-1.5 overflow-hidden rounded-full bg-[#7A2323] px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
                  >
                    <GrungeOverlay />
                    Create a free account
                  </Link>
                  <Link
                    to="/login"
                    className="text-sm font-semibold whitespace-nowrap text-[#3A2A1A] hover:text-[#7A2323] hover:underline"
                  >
                    I already have one
                  </Link>
                </div>
              </motion.div>
            )}

            <motion.div variants={fadeUpItem} className="mt-10">
              <h2 className="font-serif text-xl font-bold text-[#3A2A1A]">Pick a subject</h2>
            </motion.div>

            {loadFailed ? (
              <motion.p
                variants={fadeUpItem}
                className="font-reading mt-4 text-sm text-[#3A2A1A]/70"
              >
                Couldn't load the question bank right now. Please refresh and try again.
              </motion.p>
            ) : subjects === null ? (
              <motion.p
                variants={fadeUpItem}
                className="font-reading mt-4 text-sm text-[#3A2A1A]/70"
              >
                Loading subjects…
              </motion.p>
            ) : subjects.length === 0 ? (
              <motion.p
                variants={fadeUpItem}
                className="font-reading mt-4 text-sm text-[#3A2A1A]/70"
              >
                No subjects are available for the free exam yet. Check back soon.
              </motion.p>
            ) : (
              <motion.div
                variants={staggerContainer}
                className="mt-4 grid items-stretch gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]"
              >
                {subjects.map(({ code, available }) => {
                  const card = SUBJECT_CARDS[code]
                  const locked = previousAttempt !== null

                  return (
                    <motion.button
                      key={code}
                      variants={fadeUpItem}
                      type="button"
                      disabled={locked}
                      onClick={() => navigate(`/try/exam/${code}`)}
                      className="group flex h-full min-w-0 flex-col items-start rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 text-left transition-colors hover:border-[#7A2323]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#3A2A1A]/10"
                    >
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: card.color }}
                      >
                        <card.Icon className="size-5" />
                      </span>
                      <span className="mt-4 font-serif text-lg font-bold text-[#3A2A1A]">
                        {card.title}
                      </span>
                      <span className="font-reading mt-1 flex-1 text-sm text-[#3A2A1A]/70">
                        {card.description}
                      </span>
                      <span className="mt-4 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[#7A2323] uppercase">
                        {locked ? 'Free exam used' : `Start ${questionCount} questions`}
                        {!locked && (
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        )}
                      </span>
                      <span className="font-reading mt-2 text-[11px] text-[#3A2A1A]/45">
                        {available.toLocaleString()} questions in this bank
                      </span>
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
