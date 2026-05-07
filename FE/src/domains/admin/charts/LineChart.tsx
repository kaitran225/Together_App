import type { MultiSeriesPoint, ChartSeries } from './chartTypes'

interface LineChartProps {
  data: MultiSeriesPoint[]
  series: ChartSeries[]
  height?: number
}

export function LineChart({ data, series, height = 240 }: LineChartProps) {
  const width = 760
  const padX = 42
  const padY = 22
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => series.map((s) => d.series[s.key] ?? 0)),
  )

  const x = (i: number) => padX + (i * innerW) / Math.max(1, data.length - 1)
  const y = (v: number) => padY + innerH - (v / maxVal) * innerH

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Line chart">
      <line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="var(--color-border-strong)" />
      <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="var(--color-border-strong)" />

      {series.map((s) => {
        const d = data
          .map((item, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(item.series[s.key] ?? 0)}`)
          .join(' ')
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((item, i) => {
              const pointValue = item.series[s.key] ?? 0
              const px = x(i)
              const py = y(pointValue)
              return (
                <g key={`${s.key}-${item.label}`}>
                  <circle cx={px} cy={py} r="2.8" fill={s.color} />
                  <text x={px} y={py - 8} textAnchor="middle" className="fill-neutral-600 text-[9px] font-semibold">
                    {pointValue}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {data.map((item, i) => (
        <text key={item.label} x={x(i)} y={height - 4} textAnchor="middle" className="fill-neutral-500 text-[9px]">
          {item.label}
        </text>
      ))}
    </svg>
  )
}

