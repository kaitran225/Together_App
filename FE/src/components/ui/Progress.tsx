import type { ReactNode } from 'react'

type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps {
  value: number
  max?: number
  /** Optional label above the bar (e.g. "LEVEL 14", "2,450 / 3,000 XP") */
  label?: ReactNode
  /** Optional label below or beside */
  caption?: ReactNode
  /** Bar color variant */
  variant?: ProgressVariant
  /** Bar height (sm 12px, md 16px, lg 20px) */
  size?: ProgressSize
  /** Show percentage text */
  showPercentage?: boolean
  className?: string
}

const variantClasses: Record<ProgressVariant, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-blue',
}

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5',
}

export function Progress({
  value,
  max = 100,
  label,
  caption,
  variant = 'default',
  size = 'md',
  showPercentage = false,
  className = '',
}: ProgressProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-900 uppercase tracking-wide">
          {label}
          {showPercentage && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={`${sizeClasses[size]} w-full bg-[var(--color-charcoal)] border-0 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full ${variantClasses[variant]} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption && <div className="text-sm text-neutral-500">{caption}</div>}
    </div>
  )
}
