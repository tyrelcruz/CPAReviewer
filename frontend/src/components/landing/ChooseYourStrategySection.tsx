import { ArrowRight, Brain, Check, ClipboardList, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import smallMountain from '@/assets/images/small_mountain.png'
import studyCarabao from '@/assets/images/study_carabao.png'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface PreviewChoice {
  letter: string
  text: string
  active: boolean
}

interface StrategySpotlightCard {
  key: string
  badgeLabel: string
  Icon: LucideIcon
  title: string
  description: string
  checklist: string[]
  previewLabel: string
  questionOf: string
  prompt: string
  choices: PreviewChoice[]
  color: string
  colorDark: string
  tint: string
  mountainFilter: string
  mountainSide: 'left' | 'right'
  /** Horizontally mirrors the mountain artwork — used to give the two
   * bookend cards (tos, quiz) a matching mirrored look, distinct from the
   * middle (ai) card. */
  mountainFlip: boolean
}

const CARDS: StrategySpotlightCard[] = [
  {
    key: 'tos',
    badgeLabel: 'Exam Simulation',
    Icon: ClipboardList,
    title: 'TOS Simulator Mode',
    description:
      'Experience the real exam format and build your confidence with full-length, timed simulations.',
    checklist: [
      'Matches the actual CPALE structure and difficulty',
      'Timed, with real exam mechanics',
      'Detailed performance review',
    ],
    previewLabel: 'TOS',
    questionOf: 'Question 1 of 70',
    prompt: 'Which of the following best describes the nature of an audit evidence?',
    choices: [
      {
        letter: 'A',
        text: 'It is the information used by the auditor to reach a conclusion.',
        active: true,
      },
      { letter: 'B', text: "It is the opinion of the client's management.", active: false },
      { letter: 'C', text: "It is the auditor's conclusion.", active: false },
      { letter: 'D', text: 'It is the actual financial statements.', active: false },
    ],
    color: '#7A2323',
    colorDark: '#5C1A1A',
    tint: '#F7E7E4',
    mountainFilter: 'saturate(2.2) brightness(0.75) hue-rotate(-8deg)',
    mountainSide: 'left',
    mountainFlip: false,
  },
  {
    key: 'ai',
    badgeLabel: 'Adaptive Practice',
    Icon: Brain,
    title: 'AI Variation Mode',
    description:
      'Get variations of the same standard with new numbers, wording, and contexts — built by AI to test real understanding.',
    checklist: [
      'Multiple variations per standard',
      'Different numbers, scenarios, and contexts',
      'Strengthens application and problem-solving',
    ],
    previewLabel: 'Variation',
    questionOf: 'Question 2 of 3',
    prompt:
      "A company's ending inventory is overstated by ₱50,000. If the cost of goods sold is ₱400,000, what is the correct adjustment?",
    choices: [
      { letter: 'A', text: 'Decrease COGS by ₱50,000', active: false },
      { letter: 'B', text: 'Increase Inventory by ₱50,000', active: true },
      { letter: 'C', text: 'Decrease Net Income by ₱50,000', active: false },
      { letter: 'D', text: 'Increase COGS by ₱50,000', active: false },
    ],
    color: '#3A5A40',
    colorDark: '#263B2A',
    tint: '#E8F0E9',
    mountainFilter: 'saturate(1.8) brightness(0.5) hue-rotate(95deg)',
    mountainSide: 'right',
    mountainFlip: false,
  },
  {
    key: 'quiz',
    badgeLabel: 'Practice Quiz',
    Icon: Target,
    title: 'Quiz Mode',
    description:
      'Focus on specific topics, mix subjects, or practice with custom question sets from the knowledge bank.',
    checklist: [
      'Choose subjects, topics, and question count',
      'Mix multiple standards or focus on weak areas',
      'Instant feedback and progress tracking',
    ],
    previewLabel: 'Quiz',
    questionOf: 'Question 5 of 20',
    prompt: 'Which account is normally increased by a prepaid expense adjustment?',
    choices: [
      { letter: 'A', text: 'Prepaid Rent', active: true },
      { letter: 'B', text: 'Rent Expense', active: false },
      { letter: 'C', text: 'Accounts Payable', active: false },
      { letter: 'D', text: 'Unearned Revenue', active: false },
    ],
    color: '#B4791F',
    colorDark: '#8A5A12',
    tint: '#FBF0DC',
    mountainFilter: 'saturate(2.6) brightness(1.2) hue-rotate(15deg)',
    mountainSide: 'right',
    mountainFlip: true,
  },
]

function StampIcon({ Icon, color }: { Icon: LucideIcon; color: string }) {
  const rays = Array.from({ length: 12 })
  return (
    <div className="relative flex size-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" aria-hidden="true">
        {rays.map((_, i) => {
          const angle = (i * 360) / rays.length
          return (
            <line
              key={i}
              x1="32"
              y1="4"
              x2="32"
              y2="11"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 32 32)`}
              opacity={0.55}
            />
          )
        })}
      </svg>
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
        style={{ background: color }}
      >
        <Icon className="size-5" />
      </span>
    </div>
  )
}

export function ChooseYourStrategySection() {
  return (
    <section id="product" className="relative overflow-hidden bg-[#F3ECDC] px-6 py-16 sm:py-20">
      <img
        src={smallMountain}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-[-30px] h-20 w-auto -scale-x-100 object-contain object-bottom-right opacity-25 sm:h-28 lg:h-36"
      />
      <img
        src={smallMountain}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-30px] left-0 h-20 w-auto object-contain object-bottom-left opacity-20 sm:h-28 lg:h-36"
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="relative mx-auto max-w-7xl"
      >
        <div className="relative">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:pr-56 xl:pr-72">
            <div>
              <motion.div
                variants={fadeUpItem}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7A2323]/40 bg-[#F3ECDC] px-4 py-1.5 text-xs font-bold tracking-widest text-[#7A2323] uppercase"
              >
                <ClipboardList className="size-3.5" />
                Feature Spotlight
              </motion.div>

              <motion.p
                variants={fadeUpItem}
                className="mb-3 text-xs font-bold tracking-[0.2em] text-[#7A2323] uppercase"
              >
                One platform. Three ways to practice.
              </motion.p>

              <motion.h2
                variants={fadeUpItem}
                className="font-display text-4xl leading-[1.05] text-[#5C1A1A] uppercase sm:text-5xl"
              >
                <span className="relative inline-block">
                  Smarter review,
                  <svg
                    viewBox="0 0 220 20"
                    className="absolute -bottom-4 left-0 h-4 w-full"
                    aria-hidden="true"
                  >
                    <path
                      d="M2,14 Q30,2 58,14 T114,14 T170,14 T218,10"
                      fill="none"
                      stroke="#E0AC48"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="mt-2 block">your way</span>
              </motion.h2>
            </div>

            <motion.div
              variants={fadeUpItem}
              className="font-reading max-w-sm space-y-4 text-left text-[#3A2A1A]/80"
            >
              <p>
                KABIS gives you multiple review strategies to match your learning style and goals.
              </p>
              <p>
                Whether you want to simulate the real exam, practice with variations, or focus on
                high-yield questions — we&rsquo;ve got you covered.
              </p>
            </motion.div>
          </div>

          {/* Blended into the page (mix-blend-multiply) rather than sitting as a
              flat sticker — its light fill drops out against the cream
              background, leaving just the linework visible. Bleeds past the
              row's own right edge into the section's outer margin; lg:pr-56 /
              xl:pr-72 above reserves enough room in the grid that the subtext
              column never sits underneath it. */}
          <img
            src={studyCarabao}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 hidden w-72 -translate-y-1/2 object-contain opacity-90 mix-blend-multiply sm:block lg:right-[-2.5rem] lg:w-[26rem] xl:right-[-4rem] xl:w-[30rem]"
          />
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {CARDS.map((card) => (
            <motion.div
              key={card.key}
              variants={fadeUpItem}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white p-6 shadow-sm"
            >
              {/* Positioned to overlap the card's corner — pushed past both the
                  bottom edge and the left/right edge — overflow-hidden on the
                  card clips it flush at the boundary instead of letting it
                  bleed into the page or the grid gap between cards. */}
              <img
                src={smallMountain}
                alt=""
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute -bottom-2 h-16 w-auto object-contain opacity-70',
                  card.mountainSide === 'left' ? 'left-0 object-bottom-left' : '-right-6 object-bottom-right',
                  card.mountainFlip && '-scale-x-100',
                )}
                style={{ filter: card.mountainFilter }}
              />

              <div className="relative flex items-center gap-3">
                <StampIcon Icon={card.Icon} color={card.color} />
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase"
                  style={{ background: card.color }}
                >
                  {card.badgeLabel}
                </span>
              </div>

              <h3
                className="font-serif relative mt-5 text-lg font-bold uppercase"
                style={{ color: card.colorDark }}
              >
                {card.title}
              </h3>
              <p className="font-reading relative mt-2 text-sm text-[#3A2A1A]/75">
                {card.description}
              </p>

              <ul className="relative mt-4 flex flex-col gap-2">
                {card.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#3A2A1A]/85">
                    <span
                      className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: card.color }}
                    >
                      <Check className="size-2.5" strokeWidth={3.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="relative mt-5 rounded-xl border border-[#3A2A1A]/10 bg-[#FBF3EA] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase"
                    style={{ background: card.color }}
                  >
                    {card.previewLabel}
                  </span>
                  <span className="text-[11px] text-[#3A2A1A]/50">{card.questionOf}</span>
                </div>
                <p className="font-reading mt-2.5 text-xs leading-snug font-medium text-[#3A2A1A]">
                  {card.prompt}
                </p>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {card.choices.map((choice) => (
                    <div
                      key={choice.letter}
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px]"
                      style={
                        choice.active
                          ? { borderColor: card.color, background: card.tint, color: '#3A2A1A' }
                          : { borderColor: 'rgba(58,42,26,0.12)', color: 'rgba(58,42,26,0.7)' }
                      }
                    >
                      <span
                        className="flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={
                          choice.active
                            ? { background: card.color, color: 'white' }
                            : { border: '1px solid rgba(58,42,26,0.25)', color: 'rgba(58,42,26,0.6)' }
                        }
                      >
                        {choice.letter}
                      </span>
                      {choice.text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUpItem} className="mt-12 flex flex-col items-center gap-3 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-[#7A2323] px-7 py-3.5 text-sm font-bold tracking-wide text-[#F3ECDC] uppercase shadow-md transition-transform hover:scale-[1.02]"
          >
            <Zap className="size-4" />
            Start your preferred strategy
            <ArrowRight className="size-4" />
          </Link>
          <p className="text-xs font-semibold tracking-widest text-[#7A2323]/70 uppercase">
            Same goal. Different paths. Your choice.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
