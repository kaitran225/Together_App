import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  appearance?: 'default' | 'filled' | 'quiet'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, appearance = 'default', id, className = '', ...props },
  ref
) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
  const appearanceClasses: Record<NonNullable<InputProps['appearance']>, string> = {
    default: 'bg-[var(--color-charcoal)] border border-[var(--color-border)]',
    filled: 'bg-[var(--color-accent-muted)] border border-[var(--color-border)]',
    quiet: 'bg-transparent border-b border-[var(--color-border)] rounded-none px-1',
  }
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={inputId} className="label-study">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full px-4 py-3 rounded-[var(--radius-card)]
          ${appearanceClasses[appearance]}
          text-neutral-900 placeholder:text-neutral-500
          transition-colors duration-150 ease-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:opacity-70 disabled:bg-[var(--color-charcoal)] disabled:text-neutral-500 disabled:placeholder:text-neutral-500
          min-h-[2.5rem]
          ${error ? 'border-error ring-1 ring-error' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
