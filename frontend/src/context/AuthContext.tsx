import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { apiClient, clearStoredToken, getStoredToken, setStoredToken } from '@/api/client'

export interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    apiClient
      .get<{ user: AuthUser }>('/api/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => clearStoredToken())
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { data } = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      { email, password },
    )
    setStoredToken(data.token)
    setUser(data.user)
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/register',
      { name, email, password },
    )
    setStoredToken(data.token)
    setUser(data.user)
  }

  function logout() {
    clearStoredToken()
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading],
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
