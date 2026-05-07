import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'
import { MainBoard } from './MainBoard'

interface DashboardLayoutProps {
  children?: ReactNode
}

/**
 * Main app layout: sidebar, header, and content area.
 * - Sidebar (left, full height)
 * - Header (top of content area)
 * - Main board (scrollable content)
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-background)]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 p-3 gap-3">
        <DashboardHeader />
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-card)] overflow-hidden bg-transparent border border-[var(--color-border)] shadow-none">
          <MainBoard>{children ?? <Outlet />}</MainBoard>
        </div>
      </div>
    </div>
  )
}
