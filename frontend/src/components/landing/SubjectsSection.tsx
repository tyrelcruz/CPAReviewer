import {
  ArrowRight,
  BookOpen,
  Calculator,
  Coins,
  FileText,
  Scale,
  ScrollText,
  Star,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import carabaoRepia from '@/assets/images/carabao_repia.png'
import smallMountain from '@/assets/images/small_mountain.png'
import studyCarabao from '@/assets/images/study_carabao.png'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

interface Subject {
  key: string
  Icon: LucideIcon
  title: string
  description: string
  color: string
}

const SUBJECTS: Subject[] = [
  {
    key: 'far',
    Icon: Calculator,
    title: 'Financial Accounting & Reporting',
    description: 'Understand financial data, prepare reports, and analyze business performance.',
    color: '#3A5A40',
  },
  {
    key: 'aud',
    Icon: Coins,
    title: 'Auditing & Assurance',
    description: 'Learn how to evaluate, verify, and ensure financial integrity.',
    color: '#7A2323',
  },
  {
    key: 'reg',
    Icon: ScrollText,
    title: 'Regulation (RFBT)',
    description: 'Navigate the rules and standards that keep businesses in check.',
    color: '#B4791F',
  },
  {
    key: 'law-tax',
    Icon: Scale,
    title: 'Business Law & Taxation',
    description: 'Know your rights, obligations, and how taxes affect business decisions.',
    color: '#34506B',
  },
  {
    key: 'mas',
    Icon: Users,
    title: 'Management Advisory Services (MAS)',
    description: 'Develop strategic solutions for real business problems.',
    color: '#6B4C8A',
  },
  {
    key: 'strategy',
    Icon: Target,
    title: 'Strategic Management',
    description: 'Learn to think ahead, make better decisions, and lead effectively.',
    color: '#2F7A6E',
  },
  {
    key: 'rfbt-tax',
    Icon: FileText,
    title: 'RFBT (Business and Taxation)',
    description: 'Apply tax laws and regulations in real-world scenarios.',
    color: '#A0522D',
  },
  {
    key: 'electives',
    Icon: Star,
    title: 'Elective Subjects',
    description: 'Explore specialized topics to match your career goals and interests.',
    color: '#6B6B6B',
  },
]

function BrushIcon({ Icon, color }: { Icon: LucideIcon; color: string }) {
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 size-full" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="10 4 6 5"
          opacity={0.35}
          transform="rotate(-8 28 28)"
        />
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="8 3 5 6"
          opacity={0.25}
          transform="rotate(14 28 28)"
        />
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

function SparkBurst({ className }: { className?: string }) {
  const rays = Array.from({ length: 6 })
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {rays.map((_, i) => {
        const angle = (i * 360) / rays.length
        return (
          <line
            key={i}
            x1="16"
            y1="2"
            x2="16"
            y2="9"
            stroke="#E0AC48"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 16 16)`}
          />
        )
      })}
    </svg>
  )
}

export function SubjectsSection() {
  return (
    <section id="subjects" className="relative overflow-hidden bg-[#F3ECDC] px-6 py-16 sm:py-20">
      {/* Faint full-bleed backdrop texture, sitting behind every other layer
          in this section — low opacity + overlay blending so it reads as
          atmosphere, not a second focal illustration next to studyCarabao. */}
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

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="relative mx-auto max-w-7xl"
      >
        <div className="relative">
          <div className="max-w-5xl text-center lg:pr-28 xl:pr-40">
            <motion.div
              variants={fadeUpItem}
              className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#7A2323]/40 bg-[#F3ECDC] px-4 py-1.5 text-xs font-bold tracking-widest text-[#7A2323] uppercase"
            >
              <BookOpen className="size-3.5" />
              Subjects
            </motion.div>

            <motion.h2
              variants={fadeUpItem}
              className="font-display text-3xl leading-[1.1] text-[#5C1A1A] uppercase sm:text-4xl lg:text-5xl"
            >
              All the key subjects
              <br />
              <span className="relative inline-block">
                you need, in one place.
                <svg
                  viewBox="0 0 320 20"
                  className="absolute -bottom-3 left-0 h-4 w-full"
                  aria-hidden="true"
                >
                  <path
                    d="M2,14 Q40,2 80,14 T160,14 T240,14 T318,10"
                    fill="none"
                    stroke="#E0AC48"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUpItem}
              className="font-reading mt-6 text-[#3A2A1A]/80 sm:text-lg"
            >
              Focus on what matters. Access the core subjects, each designed to help you build
              mastery, one concept at a time.
            </motion.p>
          </div>

          <img
            src={studyCarabao}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 hidden w-64 -translate-y-1/2 object-contain opacity-90 mix-blend-multiply sm:block lg:right-[-2rem] lg:w-[26rem] xl:right-[-4rem] xl:w-[30rem]"
          />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <motion.div key={subject.key} variants={fadeUpItem}>
              <Link
                to="/signup"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white p-6 transition-colors hover:border-[#3A2A1A]/20"
              >
                <img
                  src={smallMountain}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 h-14 w-auto object-contain object-bottom-left opacity-[0.15] grayscale"
                />

                <BrushIcon Icon={subject.Icon} color={subject.color} />

                <h3 className="font-serif relative mt-4 text-lg leading-snug font-bold text-[#7A2323]">
                  {subject.title}
                </h3>
                <p className="font-reading relative mt-2 text-sm text-[#3A2A1A]/75">
                  {subject.description}
                </p>

                <span className="relative mt-auto ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A2323] text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUpItem}
          className="mt-12 flex flex-col items-center gap-3 text-center"
        >
          <div className="flex items-center gap-4">
            <SparkBurst className="size-6 opacity-70" />
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#7A2323] px-7 py-3.5 text-sm font-bold tracking-wide text-[#F3ECDC] uppercase shadow-md transition-transform hover:scale-[1.02]"
            >
              Explore all subjects
              <ArrowRight className="size-4" />
            </Link>
            <SparkBurst className="size-6 opacity-70" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-[#7A2323]/70 uppercase">
            Same goal. Different paths. Your choice.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
