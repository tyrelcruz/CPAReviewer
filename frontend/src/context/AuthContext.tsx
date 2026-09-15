import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  apiClient,
  clearStoredToken,
  getStoredToken,
  SESSION_ENDED_EVENT,
  setStoredToken,
} from '@/api/client'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  /** Which board exam this account reviews for — fixed at signup (or set
   * directly on the account), drives which subjects/mock exams the app
   * shows. */
  course: 'cpa' | 'rmt'
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  /** Set when the session was cleared because this device's session ended
   * server-side (e.g. logged out from another tab) — LoginPage surfaces it,
   * then clears it via `clearLoggedOutReason`. */
  loggedOutReason: 'session_ended' | null
  clearLoggedOutReason: () => void
  requestSignupOtp: (name: string, email: string) => Promise<void>
  verifySignupOtp: (email: string, code: string) => Promise<AuthUser>
  requestLoginOtp: (email: string) => Promise<void>
  verifyLoginOtp: (email: string, code: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loggedOutReason, setLoggedOutReason] = useState<'session_ended' | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    apiClient
      .get<{ user: AuthUser; token: string }>('/api/auth/me')
      .then(({ data }) => {
        setStoredToken(data.token)
        setUser(data.user)
      })
      .catch(() => clearStoredToken())
      .finally(() => setIsLoading(false))
  }, [])

  // Keeps an actively-open session sliding forward past the 7-day token
  // expiry — only a session with no visits for 7 straight days actually
  // expires, rather than every session hard-expiring a week after login.
  useEffect(() => {
    if (!user) return

    const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours
    const id = setInterval(() => {
      apiClient
        .post<{ token: string }>('/api/auth/refresh')
        .then(({ data }) => setStoredToken(data.token))
        .catch(() => {
          // A failed refresh (e.g. token already expired) leaves the stored
          // token as-is; the user finds out on their next real request.
        })
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(id)
  }, [user])

  // Any request that comes back rejected because this device's session ended
  // (e.g. logged out from another tab) clears the session here — the
  // app-wide axios interceptor dispatches this event since it, not React
  // state, sees every response.
  useEffect(() => {
    function handleSessionEnded() {
      setUser(null)
      setLoggedOutReason('session_ended')
    }
    window.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded)
    return () => window.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded)
  }, [])

  function clearLoggedOutReason() {
    setLoggedOutReason(null)
  }

  async function requestSignupOtp(name: string, email: string) {
    await apiClient.post('/api/auth/signup/request-otp', { name, email })
  }

  async function verifySignupOtp(email: string, code: string) {
    const { data } = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/signup/verify-otp',
      { email, code },
    )
    setStoredToken(data.token)
    setUser(data.user)
    setLoggedOutReason(null)
    return data.user
  }

  async function requestLoginOtp(email: string) {
    await apiClient.post('/api/auth/login/request-otp', { email })
  }

  async function verifyLoginOtp(email: string, code: string) {
    const { data } = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/login/verify-otp',
      { email, code },
    )
    setStoredToken(data.token)
    setUser(data.user)
    setLoggedOutReason(null)
    return data.user
  }

  function logout() {
    // Ends this device's session server-side; fire-and-forget since the
    // client-side state below is what actually signs this device out. Other
    // devices signed into this account are unaffected.
    apiClient.post('/api/auth/logout').catch(() => {})
    clearStoredToken()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      loggedOutReason,
      clearLoggedOutReason,
      requestSignupOtp,
      verifySignupOtp,
      requestLoginOtp,
      verifyLoginOtp,
      logout,
    }),
    [user, isLoading, loggedOutReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
