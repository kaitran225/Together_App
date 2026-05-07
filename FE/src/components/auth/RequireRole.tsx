import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../mocks/auth'

export function RequireRole({ role, children }: { role: UserRole; children: ReactElement }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/welcome" replace />
  if (user.role !== role) return <Navigate to="/dashboard" replace />

  return children
}
