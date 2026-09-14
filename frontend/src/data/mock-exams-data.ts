import { ClipboardList, Droplet, Microscope, type LucideIcon } from 'lucide-react'

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
    id: 'mtap-comprehensive-1',
    title: 'MTAP Comprehensive Exam',
    description: 'Full-length RMT/MedTech mock spanning every subject — Immunology & Serology and Blood Banking',
    type: 'full-length',
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
    subject: 'BB',
    difficulty: 'Mixed',
    durationMinutes: 240,
    itemCount: 70,
    icon: Droplet,
    iconBg: '#7A2323',
    bankExam: { subject: 'BB', mode: 'subject_drill', itemCount: 70 },
  },
]
