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
