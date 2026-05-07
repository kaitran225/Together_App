import type { HTMLAttributes } from 'react'

export function Table({ className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full text-sm border-separate border-spacing-y-2 ${className}`.trim()} {...props} />
}

export function TableHead({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />
}

export function TableBody({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />
}

export function TableRow({ className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`bg-[var(--color-surface)] shadow-none border-b border-[var(--color-border)] ${className}`.trim()} {...props} />
}

export function TableHeaderCell({ className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <th className={`text-left text-xs uppercase tracking-wide text-neutral-700 dark:text-neutral-400 ${className}`.trim()} {...props} />
}

export function TableCell({ className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={className} {...props} />
}
