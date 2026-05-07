import type { ReactNode } from 'react'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

function positionClasses(side: TooltipSide) {
  if (side === 'bottom') return 'top-full left-1/2 -translate-x-1/2 mt-2'
  if (side === 'left') return 'right-full top-1/2 -translate-y-1/2 mr-2'
  if (side === 'right') return 'left-full top-1/2 -translate-y-1/2 ml-2'
  return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
}

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: TooltipSide
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span className={`px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap absolute ${positionClasses(side)} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-none`}>
        {content}
      </span>
    </span>
  )
}
