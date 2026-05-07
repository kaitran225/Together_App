import type { ReactNode } from 'react'

interface AdminFiltersRowProps {
  left: ReactNode
  right: ReactNode
}

export function AdminFiltersRow({ left, right }: AdminFiltersRowProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="w-full md:max-w-sm">{left}</div>
      <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">{right}</div>
    </div>
  )
}

