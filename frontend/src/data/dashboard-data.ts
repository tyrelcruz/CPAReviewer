import type { LucideIcon } from 'lucide-react'

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

export interface StudyPlanTask {
  icon: LucideIcon
  title: string
  subtitle: string
  progress: number
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
