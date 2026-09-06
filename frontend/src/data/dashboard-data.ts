import {
  BarChart3,
  Bookmark,
  ClipboardCheck,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface SubjectProgress {
  code: string
  label: string
  percent: number
  color: string
}

export const SUBJECT_PROGRESS: SubjectProgress[] = [
  { code: 'FAR', label: 'FAR', percent: 72, color: '#E0AC48' },
  { code: 'AFAR', label: 'AFAR', percent: 65, color: '#3A5A40' },
  { code: 'Taxation', label: 'Taxation', percent: 68, color: '#7A2323' },
  { code: 'Auditing', label: 'Auditing', percent: 61, color: '#A9695A' },
  { code: 'MAS', label: 'MAS', percent: 70, color: '#2F4A3C' },
  { code: 'RFBT', label: 'RFBT', percent: 80, color: '#D9A441' },
]

export const OVERALL_PROGRESS = 68

export interface ActivityItem {
  icon: LucideIcon
  title: string
  description: string
  date: string
  time: string
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    icon: FileText,
    title: 'Completed CPALE Full-length Mock Exam 1',
    description: 'Score: 78% • 352 / 450',
    date: 'May 18, 2025',
    time: '2:45 PM',
  },
  {
    icon: FileText,
    title: 'Reviewed 25 questions in FAR',
    description: 'Topic: Non-financial Assets',
    date: 'May 18, 2025',
    time: '11:20 AM',
  },
  {
    icon: Bookmark,
    title: 'Studied 30 flashcards in Taxation',
    description: 'Topic: Value Added Tax',
    date: 'May 17, 2025',
    time: '9:15 PM',
  },
  {
    icon: ClipboardCheck,
    title: 'Completed 1 Topic Test in Auditing',
    description: 'Score: 82% • 41 / 50',
    date: 'May 17, 2025',
    time: '4:30 PM',
  },
  {
    icon: Bookmark,
    title: 'Bookmarked 12 questions',
    description: 'Across 3 subjects',
    date: 'May 16, 2025',
    time: '8:10 PM',
  },
]

export interface StudyPlanTask {
  icon: LucideIcon
  title: string
  subtitle: string
  progress: number
}

export const TODAYS_STUDY_PLAN: StudyPlanTask[] = [
  {
    icon: ClipboardCheck,
    title: 'FAR – Non-financial Assets',
    subtitle: 'Study Session • 45 mins',
    progress: 0,
  },
  {
    icon: FileText,
    title: 'Auditing – Audit Risk',
    subtitle: 'Study Session • 45 mins',
    progress: 0,
  },
  {
    icon: BarChart3,
    title: 'RFBT – Partnership',
    subtitle: 'Topic Test • 25 questions',
    progress: 0,
  },
]

export interface PerformancePoint {
  date: string
  score: number
}

export const PERFORMANCE_TREND: PerformancePoint[] = [
  { date: 'May 12', score: 25 },
  { date: 'May 13', score: 55 },
  { date: 'May 14', score: 62 },
  { date: 'May 15', score: 58 },
  { date: 'May 16', score: 65 },
  { date: 'May 17', score: 68 },
  { date: 'May 18', score: 76 },
]

export type StrengthLevel = 'Strong' | 'Good' | 'Average' | 'Needs Work'

export interface SubjectStrength {
  code: string
  percent: number
  level: StrengthLevel
  color: string
}

export const SUBJECT_STRENGTHS: SubjectStrength[] = [
  { code: 'RFBT', percent: 80, level: 'Strong', color: '#D9A441' },
  { code: 'FAR', percent: 72, level: 'Good', color: '#E0AC48' },
  { code: 'Taxation', percent: 68, level: 'Good', color: '#7A2323' },
  { code: 'MAS', percent: 70, level: 'Average', color: '#2F4A3C' },
  { code: 'AFAR', percent: 65, level: 'Average', color: '#3A5A40' },
  { code: 'Auditing', percent: 61, level: 'Needs Work', color: '#A9695A' },
]

export const STRENGTH_LEVEL_STYLES: Record<StrengthLevel, string> = {
  Strong: 'bg-[#3A5A40]/15 text-[#3A5A40]',
  Good: 'bg-[#4F7942]/15 text-[#4F7942]',
  Average: 'bg-[#E0AC48]/20 text-[#B4791F]',
  'Needs Work': 'bg-[#C1622A]/15 text-[#C1622A]',
}
