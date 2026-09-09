import type { LucideIcon } from 'lucide-react'

import type { ReviewPlanEntryType } from '@/lib/reviewPlanner'

export interface SubjectProgress {
  code: string
  label: string
  percent: number
  color: string
}

export interface ActivityItem {
  icon: LucideIcon
  title: string
  description: string
  date: string
  time: string
}

export interface StudyCalendarEntry {
  subjectLabel: string
  correct: number
  total: number
}

export interface PerformancePoint {
  date: string
  score: number
}

export type StrengthLevel = 'Strong' | 'Good' | 'Average' | 'Needs Work'

export interface SubjectStrength {
  code: string
  percent: number
  level: StrengthLevel
  color: string
}

export const STRENGTH_LEVEL_STYLES: Record<StrengthLevel, string> = {
  Strong: 'bg-[#3A5A40]/15 text-[#3A5A40]',
  Good: 'bg-[#4F7942]/15 text-[#4F7942]',
  Average: 'bg-[#E0AC48]/20 text-[#B4791F]',
  'Needs Work': 'bg-[#C1622A]/15 text-[#C1622A]',
}

export const REVIEW_PLAN_TYPE_STYLES: Record<
  ReviewPlanEntryType,
  { hex: string; dot: string; pill: string }
> = {
  Review: { hex: '#C1428A', dot: 'bg-[#C1428A]', pill: 'bg-[#C1428A]/10 text-[#C1428A]' },
  Exam: { hex: '#E0AC48', dot: 'bg-[#E0AC48]', pill: 'bg-[#E0AC48]/20 text-[#B4791F]' },
  Quiz: { hex: '#3A5A40', dot: 'bg-[#3A5A40]', pill: 'bg-[#3A5A40]/10 text-[#3A5A40]' },
  Deadline: { hex: '#3A6EA5', dot: 'bg-[#3A6EA5]', pill: 'bg-[#3A6EA5]/10 text-[#3A6EA5]' },
}

export const REVIEW_PLAN_TYPES: ReviewPlanEntryType[] = ['Review', 'Exam', 'Quiz', 'Deadline']
