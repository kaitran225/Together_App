import type { ReactNode } from 'react'

interface AdminPageSectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function AdminPageSection({ title, subtitle, action, children }: AdminPageSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold uppercase tracking-[0.08em] text-neutral-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

