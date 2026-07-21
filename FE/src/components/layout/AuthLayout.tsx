import type { ReactNode } from 'react'
import { AuthSidebar } from './AuthSidebar'
import { AuthHeaderBar } from './AuthHeaderBar'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Auth layout: sidebar + form on md+; single-column form on mobile.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-dvh min-h-dvh grid grid-cols-1 md:grid-cols-[6fr_4fr] overflow-hidden bg-transparent">
      <div className="hidden md:block min-h-0">
        <AuthSidebar />
      </div>
      <div className="flex flex-col min-w-0 m-2 gap-2 md:m-3 md:gap-3 bg-transparent pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <AuthHeaderBar />
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-none">
          <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-transparent p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
