import { AdminStatusBadge } from './AdminStatusBadge'

export type SupportChatUser = {
  id: string
  name: string
  plan: string
  status: string
  preview: string
}

interface SupportChatListProps {
  users: SupportChatUser[]
  selectedId: string
  onSelect: (id: string) => void
}

export function SupportChatList({ users, selectedId, onSelect }: SupportChatListProps) {
  return (
    <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-neutral-700">User Chats</h3>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onSelect(u.id)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selectedId === u.id
                  ? 'border-primary bg-primary/10'
                  : 'border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-charcoal)]'
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-neutral-900">{u.name}</p>
                <AdminStatusBadge status={u.status} />
              </div>
              <p className="text-xs text-neutral-700 line-clamp-1">{u.preview}</p>
              <p className="mt-1 text-[10px] text-neutral-600">{u.plan}</p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

