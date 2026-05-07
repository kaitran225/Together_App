export type ChartPoint = { label: string; value: number }
export type SeriesPoint = { label: string; value: number }
export type MultiSeriesPoint = {
  label: string
  series: Record<string, number>
}

export type ChartSeries = {
  key: string
  label: string
  color: string
}

