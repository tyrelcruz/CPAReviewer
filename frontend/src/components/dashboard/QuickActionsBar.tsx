import { BookOpen, CalendarDays, ClipboardList, Lightbulb, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { REVIEW_PLAN_TYPE_STYLES } from '@/data/dashboard-data'
import type { ReviewPlanEntryType } from '@/lib/reviewPlanner'

interface QuickActionsBarProps {
  onAdd: (type: ReviewPlanEntryType) => void
  onViewStudyPlan: () => void
}

interface QuickAction {
  label: string
  description: string
  icon: LucideIcon
  hex: string
  onClick: () => void
}

export function QuickActionsBar({ onAdd, onViewStudyPlan }: QuickActionsBarProps) {
  const actions: QuickAction[] = [
    {
      label: 'Add Review',
      description: 'Plan a new study session',
      icon: BookOpen,
      hex: REVIEW_PLAN_TYPE_STYLES.Review.hex,
      onClick: () => onAdd('Review'),
    },
    {
      label: 'Add Exam',
      description: 'Schedule an exam date',
      icon: CalendarDays,
      hex: REVIEW_PLAN_TYPE_STYLES.Exam.hex,
      onClick: () => onAdd('Exam'),
    },
    {
      label: 'Add Quiz',
      description: 'Create a practice quiz',
      icon: Target,
      hex: REVIEW_PLAN_TYPE_STYLES.Quiz.hex,
      onClick: () => onAdd('Quiz'),
    },
    {
      label: 'View Study Plan',
      description: "Check today's plan",
      icon: ClipboardList,
      hex: '#3A2A1A',
      onClick: onViewStudyPlan,
    },
  ]

  return (
    <div className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-[#E0AC48]" />
        <p className="font-semibold text-[#3A2A1A]">Quick Actions</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="flex items-center gap-3 rounded-xl border border-[#3A2A1A]/10 p-3 text-left transition-colors hover:bg-[#FBF3EA]"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${action.hex}1A`, color: action.hex }}
            >
              <action.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#3A2A1A]">{action.label}</p>
              <p className="font-reading truncate text-xs text-[#3A2A1A]/55">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
