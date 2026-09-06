import {
  Award,
  ClipboardList,
  FileText,
  Layers,
  LayoutGrid,
  BookOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  to: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, to: '/app/dashboard' },
  { label: 'Subjects', icon: BookOpen, to: '#' },
  { label: 'Mock Exams', icon: ClipboardList, to: '/app' },
  { label: 'Question Bank', icon: FileText, to: '#' },
  { label: 'Flashcards', icon: Layers, to: '#' },
  { label: 'Achievements', icon: Award, to: '#' },
  { label: 'Settings', icon: Settings, to: '#' },
]
