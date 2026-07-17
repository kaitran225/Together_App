import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const RETURN_TO_KEY = 'auth_return_to'

export function getReturnToPath(fallback = '/dashboard'): string {
  try {
    const saved = sessionStorage.getItem(RETURN_TO_KEY)
    if (saved && saved.startsWith('/') && !saved.startsWith('//')) {
      sessionStorage.removeItem(RETURN_TO_KEY)
      // Never bounce back to auth screens
      if (
        saved.startsWith('/welcome') ||
        saved.startsWith('/sign-up') ||
        saved.startsWith('/login') ||
        saved.startsWith('/callback')
      ) {
        return fallback
      }
      return saved
    }
  } catch {
    // ignore
  }
  return fallback
}

export function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isAuthReady } = useAuth()
  const location = useLocation()

  // Wait for token restore so refresh does not bounce to /welcome
  if (!isAuthReady) {
    return (
      <div className="min-h-[40vh] w-full flex items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    try {
      sessionStorage.setItem(RETURN_TO_KEY, returnTo)
    } catch {
      // ignore
    }
    return <Navigate to="/welcome" replace state={{ from: returnTo }} />
  }

  return children
}
