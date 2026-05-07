import { useRef } from 'react'

export function useChartExport() {
  const chartRef = useRef<HTMLDivElement | null>(null)

  const getSvgMarkup = () => {
    if (!chartRef.current) return null
    const svg = chartRef.current.querySelector('svg')
    return svg?.outerHTML ?? null
  }

  // Export-ready abstraction:
  // In future this can be replaced with PNG/SVG download logic.
  const requestExport = () => {
    return {
      kind: 'svg',
      markup: getSvgMarkup(),
      timestamp: Date.now(),
    }
  }

  return { chartRef, getSvgMarkup, requestExport }
}

