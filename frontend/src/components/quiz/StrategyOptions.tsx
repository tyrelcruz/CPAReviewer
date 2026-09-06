import { CheckCircle2 } from 'lucide-react'

const SOURCE_TAGS = [
  { label: "CPAR PB '26", color: '#E0AC48' },
  { label: "REO PB '26", color: '#3A5A40' },
  { label: "ReSA PB '26", color: '#7A2323' },
]

export function SourceStackIcon() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-14 shrink-0">
        <span className="absolute inset-0 translate-x-2 translate-y-2 rotate-6 rounded-lg border-2 border-[#3A5A40]/30 bg-white" />
        <span className="absolute inset-0 translate-x-1 translate-y-1 -rotate-3 rounded-lg border-2 border-[#7A2323]/25 bg-white" />
        <span className="absolute inset-0 flex flex-col gap-1 rounded-lg border-2 border-[#3A2A1A]/15 bg-white p-2">
          <span className="h-1 w-8 rounded-full bg-[#3A2A1A]/15" />
          <span className="h-1 w-6 rounded-full bg-[#3A2A1A]/15" />
          <span className="h-1 w-7 rounded-full bg-[#3A2A1A]/15" />
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {SOURCE_TAGS.map((tag) => (
          <span
            key={tag.label}
            className="flex items-center gap-1.5 rounded-full border border-[#3A2A1A]/15 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#3A2A1A]/80"
          >
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function DualModeIcon() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-16 w-14 -rotate-3 flex-col gap-1.5 rounded-lg border-2 border-[#3A5A40]/50 bg-white p-2 pt-3 shadow-sm">
        <span className="absolute -top-2 left-2 rounded-full bg-[#3A5A40] px-1.5 py-0.5 text-[8px] font-bold text-white">
          + TOS
        </span>
        <CheckCircle2 className="size-3 text-[#3A5A40]" />
        <CheckCircle2 className="size-3 text-[#3A5A40]" />
      </div>
      <div className="relative flex h-16 w-14 rotate-3 flex-col gap-1.5 rounded-lg border-2 border-[#E0AC48]/60 bg-white p-2 pt-3 shadow-sm">
        <span className="absolute -top-2 left-2 rounded-full bg-[#E0AC48] px-1.5 py-0.5 text-[8px] font-bold text-[#3A2A1A]">
          CENTER
        </span>
        <span className="h-1.5 w-8 rounded-full bg-[#3A2A1A]/15" />
        <span className="h-1.5 w-6 rounded-full bg-[#3A2A1A]/15" />
      </div>
    </div>
  )
}

export function VariantsIcon() {
  return (
    <div className="relative h-16 w-24">
      <span className="absolute inset-0 top-2 left-3 rounded-lg border-2 border-[#3A2A1A]/10 bg-white" />
      <span className="absolute inset-0 top-1 left-1.5 rounded-lg border-2 border-[#3A2A1A]/10 bg-white" />
      <span className="absolute inset-0 flex flex-col justify-center gap-1.5 rounded-lg border-2 border-[#3A5A40]/40 bg-white p-2.5 pt-3.5">
        <span className="absolute -top-2 left-2 rounded-full bg-[#3A5A40] px-1.5 py-0.5 text-[8px] font-bold text-white">
          + VARIANTS
        </span>
        {[1, 2, 3].map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-[#7A2323] text-[7px] font-bold text-white">
              {n}
            </span>
            <span className="h-1 flex-1 rounded-full bg-[#3A2A1A]/15" />
          </span>
        ))}
      </span>
    </div>
  )
}

export interface StrategyCard {
  key: 'tagging' | 'modes' | 'variants'
  Icon: () => React.JSX.Element
  title: string
  description: string
  whyLabel: string
  whyText: string
}

export const STRATEGY_CARDS: StrategyCard[] = [
  {
    key: 'tagging',
    Icon: SourceStackIcon,
    title: 'Cross-Center Tagging',
    description:
      "Merge duplicate questions into a single canonical entry, but tag each review center that featured it (e.g., Sources: [CPAR PB '26, REO PB '26]).",
    whyLabel: 'Why it outperforms raw question dumps',
    whyText:
      'Eliminates redundant grinding while showing you exactly how multiple centers present the same core concept.',
  },
  {
    key: 'modes',
    Icon: DualModeIcon,
    title: 'Dual Quiz Modes',
    description:
      'TOS Simulator Mode assembles exams strictly to match PRC TOS weights and difficulty ratios. Review Center Drill Mode filters quizzes to questions unique to CPAR, ReSA, REO, Pinnacle, or Redefine.',
    whyLabel: 'Why it works',
    whyText:
      'Gives examinees the exact preboard experience when desired, while keeping daily practice grounded in actual exam blueprints.',
  },
  {
    key: 'variants',
    Icon: VariantsIcon,
    title: 'Variation Display',
    description:
      'For questions testing the same standard with slight variations in numbers or wording, group them as "Variants" under the same sub-topic.',
    whyLabel: 'Why it works',
    whyText:
      "Forces active problem-solving and application (Bloom's Taxonomy) rather than rote memorization.",
  },
]
