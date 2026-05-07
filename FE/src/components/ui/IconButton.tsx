import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'default' | 'ghost' | 'primary' | 'tonal'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  default:
    'bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-900 hover:bg-[var(--color-cream-200)]',
  ghost: 'bg-transparent border border-transparent text-neutral-500 hover:bg-[var(--color-cream-100)] hover:text-neutral-900',
  primary: 'bg-primary border-0 text-primary-foreground hover:brightness-95',
  tonal: 'bg-[var(--color-cream-100)] border border-[var(--color-border)] text-[var(--color-cream-300)] hover:bg-[var(--color-cream-200)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: Variant
  size?: Size
}

export function IconButton({ icon, label, variant = 'default', size = 'md', className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full transition-[filter,transform] duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black hover:opacity-95 active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {icon}
    </button>
  )
}
