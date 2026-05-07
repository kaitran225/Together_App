interface AdminStatusBadgeProps {
  status: string
}

const MAP: Record<string, string> = {
  Active: 'bg-success/22 text-neutral-800 dark:text-success border border-success/45',
  Idle: 'bg-warning/22 text-neutral-900 border border-warning/40',
  Banned: 'bg-error/22 text-neutral-900 dark:text-error border border-error/45',
  Temporary: 'bg-[var(--color-focus-area)]/24 text-neutral-900 border border-[var(--color-focus-area)]/45',
  Permanent: 'bg-error/22 text-neutral-900 dark:text-error border border-error/45',
  Basic: 'bg-[var(--color-charcoal)] text-neutral-800 border border-[var(--color-border)]',
  Pro: 'bg-accent/24 text-neutral-900 dark:text-accent border border-accent/45',
  Premium: 'bg-primary/20 text-neutral-900 border border-primary/35',
}

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${MAP[status] ?? 'bg-[var(--color-charcoal)] text-neutral-800 border border-[var(--color-border)]'}`}>
      {status}
    </span>
  )
}

