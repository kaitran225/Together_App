import type { ReactNode } from 'react'

type LegendItem = { label: string; color: string }

interface ChartContainerProps {
  title: string
  subtitle?: string
  legend?: LegendItem[]
  action?: ReactNode
  children: ReactNode
}

export function ChartContainer({ title, subtitle, legend, action, children }: ChartContainerProps) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-neutral-900">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-neutral-600">{subtitle}</p>}
        </div>
        {action}
      </div>

      <div className="min-h-[220px]">{children}</div>

      {!!legend?.length && (
        <div className="mt-4 flex flex-wrap gap-3">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 text-xs text-neutral-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

