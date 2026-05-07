import type { SeriesPoint } from './chartTypes'

interface BarChartProps {
  data: SeriesPoint[]
  color?: string
}

export function BarChart({ data, color = 'var(--pal-sky)' }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-full items-end gap-2 pt-4">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <div className="w-full rounded-t-lg" style={{ height: `${(item.value / max) * 160}px`, backgroundColor: color }} />
          <span className="text-[10px] text-neutral-700 dark:text-neutral-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

