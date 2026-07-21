import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'
import { MainBoard } from './MainBoard'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileNavDrawer } from './MobileNavDrawer'

interface DashboardLayoutProps {
  children?: ReactNode
}

/**
 * Main app layout: sidebar (md+), mobile bottom nav + drawer, header, content.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <div className="h-dvh min-h-dvh flex overflow-hidden bg-transparent">
      <div className="hidden md:flex h-full flex-shrink-0">
        <DashboardSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 min-h-0 p-2 gap-2 pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:p-3 md:gap-3 md:pb-3">
        <DashboardHeader onOpenMenu={openDrawer} />
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-card)] overflow-hidden bg-transparent border border-[var(--color-border)] shadow-none">
          <MainBoard>{children ?? <Outlet />}</MainBoard>
        </div>
      </div>
      <MobileBottomNav />
      <MobileNavDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  )
}
