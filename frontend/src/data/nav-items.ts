import {
  Award,
  Bookmark,
  Calendar,
  ClipboardList,
  FileText,
  Layers,
  LayoutGrid,
  BarChart3,
  BookOpen,
  Settings,
  StickyNote,
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
  { label: 'Performance', icon: BarChart3, to: '#' },
  { label: 'Study Planner', icon: Calendar, to: '#' },
  { label: 'Bookmarks', icon: Bookmark, to: '#' },
  { label: 'Notes', icon: StickyNote, to: '#' },
  { label: 'Achievements', icon: Award, to: '#' },
  { label: 'Settings', icon: Settings, to: '#' },
]
