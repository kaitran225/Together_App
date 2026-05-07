import type { HTMLAttributes, ReactNode } from 'react'

type AlertVariant = 'success' | 'warning' | 'error' | 'info'

const variantClasses: Record<AlertVariant, string> = {
  success: 'border border-success/40 bg-success/20 text-neutral-900',
  warning: 'border border-warning/40 bg-warning/25 text-black',
  error: 'border border-error/40 bg-error/20 text-neutral-900',
  info: 'border border-accent/40 bg-accent/20 text-neutral-900',
}

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
  icon?: ReactNode
}

export function Alert({ variant = 'info', title, icon, children, className = '', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-[var(--radius-card)] border p-3 shadow-none ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    >
      <div className="flex items-start gap-2">
        {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
        <div className="min-w-0">
          {title && <p className="text-sm font-semibold mb-0.5">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
