import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'cta' | 'tonal'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground border-0 shadow-none hover:brightness-95 focus-visible:outline-primary',
  secondary:
    'bg-[var(--color-charcoal)] text-neutral-900 border border-[var(--color-border)] shadow-none hover:bg-[var(--color-cream-200)] dark:hover:bg-neutral-300 focus-visible:outline-primary',
  ghost:
    'bg-transparent text-neutral-900 border border-transparent hover:bg-[var(--color-charcoal)] focus-visible:outline-primary',
  cta:
    'bg-[var(--color-error)] text-black border-0 shadow-none hover:brightness-95 focus-visible:outline-[var(--color-error)]',
  tonal:
    'bg-[var(--color-accent-muted)] text-neutral-900 border border-[var(--color-border)] hover:brightness-[0.98] dark:hover:brightness-110 focus-visible:outline-primary',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm min-h-[2.25rem] rounded-full',
  md: 'px-5 py-2.5 text-sm min-h-[2.5rem] rounded-full',
  lg: 'px-6 py-3 text-base min-h-[2.75rem] rounded-full',
}

function SpinnerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="42 24" strokeLinecap="round" />
    </svg>
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Show spinner and disable button */
  loading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  loading = false,
  children,
  ...props
}: ButtonProps) {
  const isFullWidth = className.includes('w-full')
  const isDisabled = disabled || loading
  return (
    <button
      type="button"
      className={`
        ${isFullWidth ? 'flex w-full' : 'inline-flex'} items-center justify-center gap-2 font-semibold
        transition-[filter,transform,opacity] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        hover:opacity-95 active:scale-[0.98]
        disabled:opacity-50 disabled:pointer-events-none disabled:transform-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && <SpinnerIcon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  )
}
