import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  Scale,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { Fragment } from 'react'
import { motion } from 'framer-motion'

const SUBJECTS = [
  { icon: BookOpen, name: 'Financial Accounting', code: 'and Reporting', tag: 'FAR' },
  { icon: Target, name: 'Auditing Theory', code: 'and Practice', tag: 'AUD' },
  { icon: FileText, name: 'Regulation', code: '', tag: 'REG' },
  { icon: Scale, name: 'Business Law', code: 'and Taxation', tag: 'BAR' },
]

const FAR_TOPICS = [
  '3.1 Cash and Cash Equivalents',
  '3.2 Receivables',
  '3.3 Inventories',
  '3.4 Prepaid Expenses',
]

const WEAK_AREAS = [
  { label: 'Consolidations', percent: 42 },
  { label: 'Partnership', percent: 55 },
  { label: 'Taxation', percent: 61 },
]

function SubjectsMockup() {
  return (
    <div className="rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-md">
      <p className="mb-2 text-[9px] font-semibold text-[#3A2A1A]/70">Subjects</p>
      <div className="flex flex-col gap-1.5">
        {SUBJECTS.map((subject) => (
          <div
            key={subject.tag}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-[#3A2A1A]/5"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#3A5A40]/15 text-[#3A5A40]">
              <subject.icon className="size-3" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[8px] font-medium text-[#3A2A1A]">
                {subject.name}
              </span>
              <span className="block truncate text-[7px] text-[#3A2A1A]/55">
                {subject.code || subject.tag}
              </span>
            </span>
            <ChevronRight className="size-3 shrink-0 text-[#3A2A1A]/30" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FarReviewerMockup() {
  return (
    <div className="rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-md">
      <p className="text-[9px] font-semibold text-[#3A2A1A]">FAR Reviewer</p>
      <p className="mt-0.5 text-[7px] text-[#3A2A1A]/55">Chapter 2: Current Assets</p>
      <div className="mt-2 flex flex-col gap-1">
        {FAR_TOPICS.map((topic) => (
          <div
            key={topic}
            className="flex items-center justify-between rounded-md px-1.5 py-1 text-[7.5px] text-[#3A2A1A]/75"
          >
            {topic}
            <ChevronRight className="size-2.5 shrink-0 text-[#3A2A1A]/30" />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 w-full rounded-full bg-[#7A2323] py-1.5 text-[7.5px] font-semibold text-[#F3ECDC]"
      >
        Continue Reading
      </button>
    </div>
  )
}

function FlashcardsMockup() {
  return (
    <div className="rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-md">
      <p className="mb-2 text-[9px] font-semibold text-[#3A2A1A]">Flashcards</p>
      <div className="rounded-lg border border-[#3A2A1A]/10 bg-[#FBF3EA] p-2.5 text-center">
        <p className="font-reading text-[8px] leading-snug font-medium text-[#3A2A1A]">
          What is the objective of financial reporting?
        </p>
        <p className="mt-1.5 text-[7px] font-medium text-[#B8721F] underline underline-offset-2">
          Tap to reveal
        </p>
      </div>
      <p className="mt-1.5 text-right text-[7px] text-[#3A2A1A]/50">1 / 50</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="flex-1 rounded-full border border-[#3A2A1A]/15 py-1 text-center text-[7px] font-semibold text-[#3A2A1A]/70">
          Again
        </span>
        <span className="flex-1 rounded-full border border-[#E0AC48] py-1 text-center text-[7px] font-semibold text-[#B4791F]">
          Good
        </span>
        <span className="flex-1 rounded-full bg-[#3A5A40] py-1 text-center text-[7px] font-semibold text-white">
          Easy
        </span>
      </div>
    </div>
  )
}

function MockExamsMockup() {
  return (
    <div className="rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-md">
      <p className="text-[9px] font-semibold text-[#3A2A1A]">Mock Exams</p>
      <p className="mt-0.5 text-[7px] text-[#3A2A1A]/55">Full-length Exam 1</p>
      <p className="text-[7px] text-[#3A2A1A]/55">100 Questions • 4 Hours</p>

      <div className="mt-2 rounded-lg bg-[#FBF3EA] p-2">
        <p className="text-[7px] text-[#3A2A1A]/55">Time Left</p>
        <p className="font-mono text-sm font-bold text-[#7A2323]">03:59:12</p>
      </div>

      <p className="mt-1.5 text-[7px] text-[#3A2A1A]/55">Progress 23 / 100</p>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
        <div className="h-full w-[23%] rounded-full bg-[#7A2323]" />
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded-full bg-[#7A2323] py-1.5 text-[7.5px] font-semibold text-[#F3ECDC]"
      >
        End Exam
      </button>
    </div>
  )
}

function PerformanceMockup() {
  return (
    <div className="rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-md">
      <p className="text-[9px] font-semibold text-[#3A2A1A]">Performance</p>
      <p className="mt-1 text-[7px] text-[#3A2A1A]/55">Overall Progress</p>
      <p className="text-base font-bold text-[#3A2A1A]">68%</p>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#3A2A1A]/10">
        <div className="h-full w-[68%] rounded-full bg-[#7A2323]" />
      </div>
      <p className="mt-1 text-[7px] text-[#3A2A1A]/55">102 of 150 topics</p>

      <div className="mt-2 flex flex-col gap-1">
        <p className="text-[7px] font-semibold text-[#3A2A1A]/55">Weak Areas</p>
        {WEAK_AREAS.map((area) => (
          <div key={area.label} className="flex items-center justify-between text-[7.5px]">
            <span className="text-[#3A2A1A]/75">{area.label}</span>
            <span className="rounded-full bg-[#E0AC48]/20 px-1.5 py-0.5 font-semibold text-[#B4791F]">
              {area.percent}%
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded-full border border-[#3A2A1A]/20 py-1.5 text-[7.5px] font-semibold text-[#3A2A1A]"
      >
        View Detailed Report
      </button>
    </div>
  )
}

interface Step {
  title: string
  description: string
  icon: LucideIcon
  tint: string
  Mockup: () => React.ReactElement
}

const STEPS: Step[] = [
  {
    title: 'Choose a Subject',
    description: 'Access complete reviewers and materials for all 4 CPA subjects.',
    icon: BookOpen,
    tint: '#3A5A40',
    Mockup: SubjectsMockup,
  },
  {
    title: 'Study Smart',
    description: 'Review high-yield concepts with concise and updated learning materials.',
    icon: Target,
    tint: '#E0AC48',
    Mockup: FarReviewerMockup,
  },
  {
    title: 'Practice Actively',
    description: 'Reinforce your knowledge with thousands of practice questions and flashcards.',
    icon: Layers,
    tint: '#7A2323',
    Mockup: FlashcardsMockup,
  },
  {
    title: 'Test Yourself',
    description: 'Take mock exams that simulate the actual CPA board exam.',
    icon: ClipboardList,
    tint: '#3A5A40',
    Mockup: MockExamsMockup,
  },
  {
    title: 'Track & Improve',
    description: 'Monitor your progress and focus on your weak areas.',
    icon: BarChart3,
    tint: '#E0AC48',
    Mockup: PerformanceMockup,
  },
]

export function HowItWorksSteps() {
  return (
    <section className="bg-[#FBF3EA] px-6 py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-0">
        {STEPS.map((step, i) => (
          <Fragment key={step.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.08 }}
              className="flex flex-col items-start gap-3 lg:flex-1"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#7A2323] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-[#3A2A1A]">{step.title}</span>
              </div>

              <span
                className="flex size-11 items-center justify-center rounded-xl"
                style={{ background: `${step.tint}26`, color: step.tint }}
              >
                <step.icon className="size-5" />
              </span>

              <p className="font-reading pr-4 text-sm leading-snug text-[#3A2A1A]/70">
                {step.description}
              </p>

              <div className="w-full max-w-52 pr-4">
                <step.Mockup />
              </div>
            </motion.div>

            {i < STEPS.length - 1 && (
              <div className="mt-4 hidden w-10 shrink-0 items-center justify-center lg:flex">
                <div className="flex items-center gap-0.5 text-[#3A2A1A]/25">
                  <span className="h-0 w-3 border-t-2 border-dashed border-current" />
                  <ArrowRight className="size-3" />
                  <span className="h-0 w-3 border-t-2 border-dashed border-current" />
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  )
}
