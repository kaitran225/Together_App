import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'highlight' | 'primary' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'streak' | 'milestone' | 'focus' | 'critical'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-charcoal)] text-neutral-900 border border-[var(--color-border)]',
  highlight: 'bg-[var(--color-highlight)] text-black border-0',
  primary: 'bg-[var(--color-focus-area)] text-black border-0',
  outline: 'bg-transparent text-neutral-700 dark:text-neutral-400 border border-[var(--color-border)]',
  success: 'bg-success/20 text-neutral-800 dark:text-success border border-success/40',
  warning: 'bg-warning/30 text-black border-0',
  error: 'bg-error/20 text-neutral-800 dark:text-error border border-error/40',
  info: 'bg-accent/20 text-neutral-800 dark:text-accent border border-accent/40',
  streak: 'bg-[var(--color-error)] text-black border-0',
  milestone: 'bg-primary text-primary-foreground border-0',
  focus: 'bg-[var(--color-focus-area)] text-black border-0',
  critical: 'bg-error/30 text-neutral-900 dark:text-error border border-error/50',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
        transition-colors duration-150 ease-out
        ${variantClasses[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    />
  )
}
