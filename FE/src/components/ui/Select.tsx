import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export function Select({
  label,
  options,
  error,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={selectId} className="label-study">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full appearance-none px-4 py-3 pr-10 bg-[var(--color-charcoal)] border border-[var(--color-border)] rounded-[var(--radius-card)]
            text-neutral-900
            transition-colors duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-70 disabled:bg-neutral-200 disabled:text-neutral-500
            min-h-[44px]
            ${error ? 'border-error ring-1 ring-error' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-500"
          aria-hidden
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.2 9.6L12 14.4l4.8-4.8" />
          </svg>
        </span>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
