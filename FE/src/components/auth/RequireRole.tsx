import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function RequireRole({ role, children }: { role: string; children: ReactElement }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/welcome" replace />
  if (user.systemRole !== role) return <Navigate to="/dashboard" replace />

  return children
}
