import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Droplet,
  Landmark,
  Microscope,
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
  /** Which board exam this card belongs to — MockExamsPage shows only the
   * logged-in user's own course's cards. */
  course: 'cpa' | 'rmt'
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  durationMinutes: number
  itemCount: number
  icon: LucideIcon
  iconBg: string
  recommended?: boolean
  /** Present for exams backed by a real, playable quiz set (see data/quiz-data.ts). */
  quizSetId?: string
  /** Present for exams backed by the ingested question bank (see api/exams.ts) — generated on demand via /api/exams/generate. */
  bankExam?: {
    subject: string
    mode: 'tos_simulator' | 'subject_drill'
    itemCount: number
  }
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
    course: 'cpa',
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
    course: 'cpa',
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
    course: 'cpa',
    subject: 'FAR',
    difficulty: 'Hard',
    durationMinutes: 240,
    itemCount: 70,
    icon: BookOpen,
    iconBg: '#E0AC48',
    taken: { date: '2025-05-10', score: 50, total: 70, percentile: 68 },
  },
  {
    id: 'taxation-final-all-centers',
    title: 'TAXATION Final Exam (All Sources)',
    description: 'Cross-source Taxation final pre-board question pool',
    type: 'full-length',
    course: 'cpa',
    subject: 'Taxation',
    difficulty: 'Mixed',
    durationMinutes: 240,
    itemCount: 70,
    icon: Percent,
    iconBg: '#3A5A40',
    bankExam: { subject: 'TAX', mode: 'tos_simulator', itemCount: 70 },
  },
  {
    id: 'rfbt-final-all-sources',
    title: 'RFBT Final Exam (All Sources)',
    description: 'Cross-source RFBT final pre-board question pool',
    type: 'full-length',
    course: 'cpa',
    subject: 'RFBT',
    difficulty: 'Mixed',
    durationMinutes: 240,
    itemCount: 70,
    icon: Landmark,
    iconBg: '#7A2323',
    bankExam: { subject: 'RFBT', mode: 'tos_simulator', itemCount: 70 },
  },
  {
    id: 'mtap-comprehensive-1',
    title: 'MTAP Comprehensive Exam',
    description: 'Full-length RMT/MedTech mock spanning every subject — Immunology & Serology and Blood Banking',
    type: 'full-length',
    course: 'rmt',
    subject: 'MTAP',
    difficulty: 'Mixed',
    durationMinutes: 300,
    itemCount: 100,
    icon: ClipboardList,
    iconBg: '#E0AC48',
    recommended: true,
    bankExam: { subject: 'MTAP', mode: 'subject_drill', itemCount: 100 },
  },
  {
    id: 'is-week1-immunology-serology',
    title: 'Immunology & Serology (Week 1)',
    description: 'RMT/MedTech practice set — Week 1 Immunology & Serology reviewer bank',
    type: 'subject',
    course: 'rmt',
    subject: 'IS',
    difficulty: 'Mixed',
    durationMinutes: 240,
    itemCount: 70,
    icon: Microscope,
    iconBg: '#3A5A40',
    bankExam: { subject: 'IS', mode: 'subject_drill', itemCount: 70 },
  },
  {
    id: 'bb-week1-blood-banking',
    title: 'Blood Banking (Week 1)',
    description: 'RMT/MedTech practice set — Week 1 Blood Banking reviewer bank',
    type: 'subject',
    course: 'rmt',
    subject: 'BB',
    difficulty: 'Mixed',
    durationMinutes: 240,
    itemCount: 70,
    icon: Droplet,
    iconBg: '#7A2323',
    bankExam: { subject: 'BB', mode: 'subject_drill', itemCount: 70 },
  },
  {
    id: 'rfbt-partnership',
    title: 'RFBT Topic Test – Partnership',
    description: 'Partnership formation, admission, and ratios',
    type: 'topic',
    course: 'cpa',
    subject: 'RFBT',
    difficulty: 'Easy',
    durationMinutes: 180,
    itemCount: 100,
    icon: Target,
    iconBg: '#5C1A1A',
    taken: { date: '2025-05-05', score: 88, total: 100, percentile: 92 },
  },
]
