import type { ChartPoint } from './chartTypes'

interface PieChartProps {
  data: ChartPoint[]
  colors: string[]
}

export function PieChart({ data, colors }: PieChartProps) {
  const radius = 72
  const cx = 90
  const cy = 90
  const total = Math.max(1, data.reduce((acc, item) => acc + item.value, 0))
  let current = -Math.PI / 2

  const slices = data.map((item, idx) => {
    const sweep = (item.value / total) * Math.PI * 2
    const x1 = cx + radius * Math.cos(current)
    const y1 = cy + radius * Math.sin(current)
    const next = current + sweep
    const x2 = cx + radius * Math.cos(next)
    const y2 = cy + radius * Math.sin(next)
    const largeArc = sweep > Math.PI ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    current = next
    return { d, color: colors[idx % colors.length], key: item.label }
  })

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <svg viewBox="0 0 180 180" className="h-[220px] w-[220px]" role="img" aria-label="Pie chart">
        {slices.map((slice) => (
          <path key={slice.key} d={slice.d} fill={slice.color} />
        ))}
      </svg>
      <div className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100)
          return (
            <div key={item.label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-charcoal)] px-2.5 py-1.5 text-xs text-neutral-800">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                  {item.label}
                </span>
                <span>{pct}%</span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-600">Value: {item.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

