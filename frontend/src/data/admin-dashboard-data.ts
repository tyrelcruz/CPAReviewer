import {
  ClipboardCheck,
  FileText,
  HardDrive,
  LogIn,
  Monitor,
  Settings,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'

// Static illustrative data for the admin dashboard mockup — there is no backend
// admin/analytics API yet (user counts, live sessions, geo-location, feature
// usage tracking), so these numbers mirror the reference design rather than
// a real data source. Same approach already used for the landing page's stat
// row and the "Coming Soon" mock exam cards.

export interface AdminStatCard {
  label: string
  icon: LucideIcon
  variant: 'delta' | 'progress'
  value: string
  deltaPercent?: number
  progressPercent?: number
  progressLabel?: string
}

export const ADMIN_STAT_CARDS: AdminStatCard[] = [
  { label: 'Total Users', icon: Users, variant: 'delta', value: '2,481', deltaPercent: 12 },
  { label: 'Active Users', icon: User, variant: 'delta', value: '1,842', deltaPercent: 18 },
  { label: 'Exams Created', icon: FileText, variant: 'delta', value: '186', deltaPercent: 6 },
  { label: 'Active Sessions', icon: Monitor, variant: 'delta', value: '312', deltaPercent: 24 },
  {
    label: 'Storage Usage',
    icon: HardDrive,
    variant: 'progress',
    value: '68%',
    progressPercent: 68,
    progressLabel: '66.0 GB / 100 GB',
  },
]

// Active Sessions is now backed by the real /api/admin/sessions endpoint
// (see components/admin/ActiveSessionsCard.tsx) — TOTAL_ACTIVE_SESSIONS below
// remains mock, used only by SessionLocationsCard's map illustration.
export const TOTAL_ACTIVE_SESSIONS = 312

export interface LocationStat {
  rank: number
  city: string
  users: number
  /** Approximate marker position within the map panel, as a percentage. */
  x: number
  y: number
}

export const TOP_LOCATIONS: LocationStat[] = [
  { rank: 1, city: 'Manila', users: 98, x: 20, y: 26 },
  { rank: 2, city: 'Cebu City', users: 45, x: 34, y: 54 },
  { rank: 3, city: 'Davao City', users: 32, x: 46, y: 82 },
  { rank: 4, city: 'Baguio City', users: 28, x: 16, y: 6 },
  { rank: 5, city: 'Iloilo City', users: 21, x: 26, y: 60 },
]

export interface AccountUsagePoint {
  label: string
  value: number
}

export const ACCOUNT_USAGE_SERIES: AccountUsagePoint[] = [
  { label: 'May 12', value: 1620 },
  { label: 'May 13', value: 1890 },
  { label: 'May 14', value: 1480 },
  { label: 'May 15', value: 2340 },
  { label: 'May 16', value: 2120 },
  { label: 'May 17', value: 2640 },
  { label: 'May 18', value: 2510 },
]

export const ACCOUNT_USAGE_STATS = [
  { icon: Users, label: 'Active Users', value: '1,842', deltaPercent: 18 },
  { icon: FileText, label: 'Exams Taken', value: '4,326', deltaPercent: 21 },
  { icon: ClipboardCheck, label: 'Questions Answered', value: '12,893', deltaPercent: 16 },
  { icon: Monitor, label: 'Avg. Study Time', value: '6h 42m', deltaPercent: 14 },
]

export interface FeatureUsageItem {
  label: string
  percent: number
  color: string
}

export const FEATURE_USAGE: FeatureUsageItem[] = [
  { label: 'TOS Simulator Mode', percent: 42, color: '#7A2323' },
  { label: 'AI Variation Mode', percent: 36, color: '#C4707A' },
  { label: 'Quiz Mode', percent: 22, color: '#E0AC48' },
  { label: 'Question Bank', percent: 15, color: '#E0AC48CC' },
  { label: 'Flashcards', percent: 9, color: '#E0C88A' },
]

export interface RecentActivityEntry {
  id: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
  time: string
}

export const ADMIN_RECENT_ACTIVITY: RecentActivityEntry[] = [
  {
    id: '1',
    icon: UserPlus,
    iconColor: '#3A5A40',
    iconBg: '#3A5A401A',
    title: 'New user registered',
    subtitle: 'juan.perez@domain.com',
    time: '2m ago',
  },
  {
    id: '2',
    icon: FileText,
    iconColor: '#7A2323',
    iconBg: '#7A23231A',
    title: 'Exam completed',
    subtitle: 'FAR — Practice Exam (Score: 82%)',
    time: '5m ago',
  },
  {
    id: '3',
    icon: LogIn,
    iconColor: '#3A6B8A',
    iconBg: '#3A6B8A1A',
    title: 'User logged in',
    subtitle: 'maria.santos@domain.com',
    time: '7m ago',
  },
  {
    id: '4',
    icon: FileText,
    iconColor: '#B4791F',
    iconBg: '#E0AC481A',
    title: 'New exam created',
    subtitle: 'AUD — Variation Mode',
    time: '12m ago',
  },
  {
    id: '5',
    icon: Settings,
    iconColor: '#6B4A8A',
    iconBg: '#6B4A8A1A',
    title: 'Admin updated settings',
    subtitle: 'System configuration',
    time: '18m ago',
  },
]
