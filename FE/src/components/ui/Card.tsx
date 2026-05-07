import type { HTMLAttributes } from 'react'

type ShadowLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
type CardVariant = 'default' | 'interactive' | 'featured'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional section heading inside the card */
  heading?: string
  /** Shadow variant 1-10. Default uses flat (no shadow). */
  shadow?: ShadowLevel
  variant?: CardVariant
}

export function Card({ heading, shadow, variant = 'default', className = '', style, children, ...props }: CardProps) {
  const shadowStyle = shadow ? { boxShadow: `var(--shadow-${shadow})` } : undefined
  const variantClasses: Record<CardVariant, string> = {
    default: '',
    interactive: 'hover:brightness-[1.03]',
    featured: 'bg-[var(--color-accent-muted)] border border-[var(--color-border)]',
  }
  return (
    <div
      className={`
        bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)]
        shadow-none
        p-6 md:p-8
        transition-[filter,transform] duration-200 ease-out
        ${variantClasses[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{ ...style, ...shadowStyle }}
      {...props}
    >
      {heading && (
        <h3 className="pb-2 mb-4 border-b border-[var(--color-border)] text-sm font-bold uppercase tracking-[0.15em] text-neutral-500">
          {heading}
        </h3>
      )}
      {children}
    </div>
  )
}
