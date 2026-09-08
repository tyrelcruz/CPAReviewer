import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'

/** Like ProtectedRoute, but also requires the `admin` role — a signed-in
 * non-admin is bounced to the regular dashboard rather than back to login. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}
