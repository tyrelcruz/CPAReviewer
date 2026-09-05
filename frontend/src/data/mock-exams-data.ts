import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Percent,
  Target,
  type LucideIcon,
} from 'lucide-react'

export type ExamType = 'full-length' | 'subject' | 'topic' | 'custom'

export interface MockExam {
  id: string
  title: string
  description: string
  type: ExamType
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  durationMinutes: number
  itemCount: number
  icon: LucideIcon
  iconBg: string
  recommended?: boolean
  /** Present for exams backed by a real, playable quiz set (see data/quiz-data.ts). */
  quizSetId?: string
  taken?: {
    date: string
    score: number
    total: number
    /** Omitted for real quiz sets — we don't have a population to rank against. */
    percentile?: number
  }
}

export const MOCK_EXAMS: MockExam[] = [
  {
    id: 'cpale-full-1',
    title: 'CPALE Full-length Mock Exam 1',
    description: 'Simulates the actual CPALE in 3 days',
    type: 'full-length',
    subject: 'All Subjects',
    difficulty: 'Mixed',
    durationMinutes: 720,
    itemCount: 450,
    icon: ClipboardList,
    iconBg: '#5C1A1A',
    recommended: true,
    taken: { date: '2025-05-18', score: 352, total: 450, percentile: 82 },
  },
  {
    id: 'cpale-full-2',
    title: 'CPALE Full-length Mock Exam 2',
    description: 'Simulates the actual CPALE in 3 days',
    type: 'full-length',
    subject: 'All Subjects',
    difficulty: 'Mixed',
    durationMinutes: 720,
    itemCount: 450,
    icon: BarChart3,
    iconBg: '#3A5A40',
  },
  {
    id: 'far-subject-1',
    title: 'FAR Subject Exam 1',
    description: 'Focused practice on FAR',
    type: 'subject',
    subject: 'FAR',
    difficulty: 'Hard',
    durationMinutes: 240,
    itemCount: 70,
    icon: BookOpen,
    iconBg: '#E0AC48',
    taken: { date: '2025-05-10', score: 50, total: 70, percentile: 68 },
  },
  {
    id: 'taxation-subject-1',
    title: 'Taxation Subject Exam 1',
    description: 'Focused practice on Taxation',
    type: 'subject',
    subject: 'Taxation',
    difficulty: 'Medium',
    durationMinutes: 240,
    itemCount: 70,
    icon: Percent,
    iconBg: '#3A5A40',
  },
  {
    id: 'rfbt-partnership',
    title: 'RFBT Topic Test – Partnership',
    description: 'Partnership formation, admission, and ratios',
    type: 'topic',
    subject: 'RFBT',
    difficulty: 'Easy',
    durationMinutes: 45,
    itemCount: 25,
    icon: Target,
    iconBg: '#5C1A1A',
    taken: { date: '2025-05-05', score: 22, total: 25, percentile: 92 },
  },
]
