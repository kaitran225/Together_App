import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function RequireRole({ role, children }: { role: string; children: ReactElement }) {
  const { user, isAuthReady } = useAuth()

  if (!isAuthReady) {
    return (
      <div className="min-h-[40vh] w-full flex items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/welcome" replace />
  if (user.systemRole !== role) return <Navigate to="/dashboard" replace />

  return children
}
