import {
  ArrowUpDown,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  SlidersHorizontal,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'

import type { ExamType } from '@/data/mock-exams-data'
import { listItem, listStagger } from '@/lib/motion'
import { cn } from '@/lib/utils'

export type TypeFilter = ExamType | 'all'
export type SortOption = 'recent' | 'score' | 'alphabetical'

const TABS: { key: TypeFilter; label: string; icon: LucideIcon }[] = [
  { key: 'all', label: 'All Exams', icon: ClipboardList },
  { key: 'full-length', label: 'Full-length Exams', icon: Timer },
  { key: 'subject', label: 'Subject Exams', icon: LayoutGrid },
  { key: 'topic', label: 'Topic Tests', icon: Target },
  { key: 'custom', label: 'Custom Exams', icon: SlidersHorizontal },
]

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'full-length', label: 'Full-length' },
  { value: 'subject', label: 'Subject' },
  { value: 'topic', label: 'Topic' },
  { value: 'custom', label: 'Custom' },
]

const DIFFICULTY_OPTIONS = ['All Levels', 'Easy', 'Medium', 'Hard', 'Mixed']
const DURATION_OPTIONS = ['All Durations', 'Under 1 hour', '1–4 hours', '4+ hours']
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'score', label: 'Highest Score' },
  { value: 'alphabetical', label: 'Alphabetical' },
]

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#3A2A1A]/60">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-[#3A2A1A]/15 bg-white py-2.5 pr-9 pl-3.5 text-sm font-medium text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#3A2A1A]/40" />
      </div>
    </div>
  )
}

interface ExamFiltersProps {
  typeFilter: TypeFilter
  onTypeChange: (value: TypeFilter) => void
  subjectFilter: string
  onSubjectChange: (value: string) => void
  subjectOptions: string[]
  difficultyFilter: string
  onDifficultyChange: (value: string) => void
  durationFilter: string
  onDurationChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
}

export function ExamFilters({
  typeFilter,
  onTypeChange,
  subjectFilter,
  onSubjectChange,
  subjectOptions,
  difficultyFilter,
  onDifficultyChange,
  durationFilter,
  onDurationChange,
  sort,
  onSortChange,
}: ExamFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        variants={listStagger}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-2 sm:gap-2.5"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === typeFilter
          return (
            <motion.button
              key={tab.key}
              type="button"
              variants={listItem}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTypeChange(tab.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm',
                isActive
                  ? 'border-transparent bg-[#3A5A40] text-white'
                  : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
              )}
            >
              <tab.icon className="size-3.5 sm:size-4" />
              {tab.label}
            </motion.button>
          )
        })}
      </motion.div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Redundant with the type pills above at mobile width — only shown once there's room, sm: and up. */}
          <div className="hidden sm:contents">
            <FilterSelect
              label="Exam Type"
              value={TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'All'}
              options={TYPE_OPTIONS.map((o) => o.label)}
              onChange={(label) => {
                const match = TYPE_OPTIONS.find((o) => o.label === label)
                if (match) onTypeChange(match.value)
              }}
            />
          </div>
          <FilterSelect
            label="Subject"
            value={subjectFilter}
            options={subjectOptions}
            onChange={onSubjectChange}
          />
          <FilterSelect
            label="Difficulty"
            value={difficultyFilter}
            options={DIFFICULTY_OPTIONS}
            onChange={onDifficultyChange}
          />
          <FilterSelect
            label="Duration"
            value={durationFilter}
            options={DURATION_OPTIONS}
            onChange={onDurationChange}
          />
          {/* Sort fills the 4th grid slot at mobile width; the icon-styled select below takes over at sm: and up. */}
          <div className="sm:hidden">
            <FilterSelect
              label="Sort By"
              value={SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Most Recent'}
              options={SORT_OPTIONS.map((o) => o.label)}
              onChange={(label) => {
                const match = SORT_OPTIONS.find((o) => o.label === label)
                if (match) onSortChange(match.value)
              }}
            />
          </div>
        </div>

        <div className="relative hidden sm:block">
          <select
            value={SORT_OPTIONS.find((o) => o.value === sort)?.label}
            onChange={(e) => {
              const match = SORT_OPTIONS.find((o) => o.label === e.target.value)
              if (match) onSortChange(match.value)
            }}
            className="appearance-none rounded-xl border border-[#3A2A1A]/15 bg-white py-2.5 pr-9 pl-9 text-sm font-medium text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#3A2A1A]/40" />
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#3A2A1A]/40" />
        </div>
      </div>
    </div>
  )
}
