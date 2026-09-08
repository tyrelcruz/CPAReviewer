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
  SESSION_SUPERSEDED_EVENT,
  setStoredToken,
} from '@/api/client'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  /** Set when the session was cleared because this account signed in on
   * another device — LoginPage surfaces it, then clears it via
   * `clearLoggedOutReason`. */
  loggedOutReason: 'superseded' | null
  clearLoggedOutReason: () => void
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loggedOutReason, setLoggedOutReason] = useState<'superseded' | null>(null)

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

  // Any request that comes back rejected as superseded (this account signed
  // in elsewhere) clears the session here — the app-wide axios interceptor
  // dispatches this event since it, not React state, sees every response.
  useEffect(() => {
    function handleSuperseded() {
      setUser(null)
      setLoggedOutReason('superseded')
    }
    window.addEventListener(SESSION_SUPERSEDED_EVENT, handleSuperseded)
    return () => window.removeEventListener(SESSION_SUPERSEDED_EVENT, handleSuperseded)
  }, [])

  function clearLoggedOutReason() {
    setLoggedOutReason(null)
  }

  async function login(email: string, password: string) {
    const { data } = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      { email, password },
    )
    setStoredToken(data.token)
    setUser(data.user)
    setLoggedOutReason(null)
    return data.user
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/register',
      { name, email, password },
    )
    setStoredToken(data.token)
    setUser(data.user)
    setLoggedOutReason(null)
  }

  function logout() {
    // Frees this account's device slot server-side; fire-and-forget since
    // the client-side state below is what actually signs this device out.
    apiClient.post('/api/auth/logout').catch(() => {})
    clearStoredToken()
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isLoading, loggedOutReason, clearLoggedOutReason, login, register, logout }),
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
