import type { ReactNode } from 'react'
import { AuthSidebar } from './AuthSidebar'
import { AuthHeaderBar } from './AuthHeaderBar'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Auth layout: 60% sidebar, 40% main. Single content zone (no nested card).
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen grid grid-cols-[6fr_4fr] overflow-hidden bg-[var(--color-background)]">
      <AuthSidebar />
      <div className="flex flex-col min-w-0 m-3 gap-3 bg-[var(--color-background)]">
        <AuthHeaderBar />
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-none">
          <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[var(--color-background)] p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
