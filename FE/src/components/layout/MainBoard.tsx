import type { ReactNode } from 'react'

interface MainBoardProps {
  children?: ReactNode
}

export function MainBoard({ children }: MainBoardProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto overflow-x-hidden bg-[var(--color-background)] p-3 scroll-smooth md:p-4 md:py-6" id="main-board">
      <div className="min-h-full flex-1 flex flex-col">
        {children}
      </div>
    </main>
  )
}
