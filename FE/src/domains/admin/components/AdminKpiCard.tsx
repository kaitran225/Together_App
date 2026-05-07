interface AdminKpiCardProps {
  label: string
  value: string
  hint?: string
}

export function AdminKpiCard({ label, value, hint }: AdminKpiCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-600">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-neutral-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </article>
  )
}

