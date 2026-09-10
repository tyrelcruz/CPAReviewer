import { apiClient } from '@/api/client'

export interface AdminSession {
  sessionId: string
  userId: string
  name: string
  email: string
  role: 'user' | 'admin'
  device: string
  /** Null when the login IP couldn't be resolved to a place (private/local
   * network, or the lookup failed/timed out). */
  location: string | null
  loginAt: string
  lastActiveAt: string
  status: 'active' | 'inactive'
}

export interface AdminSessionsResponse {
  sessions: AdminSession[]
  activeCount: number
  totalCount: number
}

export async function listActiveSessions(): Promise<AdminSessionsResponse> {
  const { data } = await apiClient.get<AdminSessionsResponse>('/api/admin/sessions')
  return data
}

export interface AdminStatWithDelta {
  value: number
  /** Null when there's no real baseline to compare against (e.g. zero a week
   * ago) — the UI omits the delta line rather than showing a fabricated
   * percentage. */
  deltaPercent: number | null
}

export interface AdminUsageStats {
  activeUsers: AdminStatWithDelta
  examsTaken: AdminStatWithDelta
  questionsAnswered: AdminStatWithDelta
  /** Null when no exam has ever been submitted in the window — nothing to average. */
  avgExamDurationSeconds: number | null
}

export interface AdminFeatureUsageItem {
  mode: string
  label: string
  count: number
  percent: number
}

export interface AdminRecentActivityItem {
  id: string
  type: 'registration' | 'login' | 'exam_generated' | 'exam_submitted'
  title: string
  subtitle: string
  timestamp: string
}

export interface AdminTopLocationItem {
  /** Raw resolved label, e.g. "Manila, Philippines" or "Local network" — the
   * card decides how (or whether) to plot it on the map illustration. */
  location: string
  count: number
}

export interface AdminAnalytics {
  stats: {
    totalUsers: AdminStatWithDelta
    activeUsers: AdminStatWithDelta
    examsGenerated: AdminStatWithDelta
    activeSessions: { value: number }
    databaseSizeBytes: number
  }
  usageSeries: { date: string; activeUsers: number }[]
  usageStats: AdminUsageStats
  featureUsage: AdminFeatureUsageItem[]
  recentActivity: AdminRecentActivityItem[]
  topLocations: AdminTopLocationItem[]
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const { data } = await apiClient.get<AdminAnalytics>('/api/admin/analytics')
  return data
}

export interface AdminFlaggedQuestion {
  id: string
  questionId: string
  /** Null if the flagged question has since been deleted/re-ingested under a new id. */
  subject: string | null
  prompt: string | null
  /** The bank's own correct-choice text — null along with subject/prompt if the question is gone. */
  correctAnswer: string | null
  /** What the learner thinks the correct answer is, if they said — resolved to
   * that choice's own text when they picked one, or their free-typed answer. */
  suggestedAnswer: string | null
  /** True when suggestedAnswer came from outside the question's own listed choices. */
  suggestedAnswerIsCustom: boolean
  reason: string
  flaggedByName: string
  flaggedByEmail: string
  createdAt: string
}

export interface AdminFlaggedQuestionsResponse {
  flags: AdminFlaggedQuestion[]
}

export async function listFlaggedQuestions(): Promise<AdminFlaggedQuestionsResponse> {
  const { data } = await apiClient.get<AdminFlaggedQuestionsResponse>('/api/admin/flags')
  return data
}
