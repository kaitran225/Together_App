type Option = {
  value: string
  label: string
}

export interface RadioGroupProps {
  name: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  className?: string
}

export function RadioGroup({ name, value, options, onChange, className = '' }: RadioGroupProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()} role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-900">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="w-4 h-4 border-[var(--color-charcoal)] text-primary focus:ring-primary focus:ring-offset-0"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}
