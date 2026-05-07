import { useMemo, useState } from 'react'
import { Button, Input } from '../../../components/common'
import { AdminStatusBadge } from './AdminStatusBadge'

export type SupportMessage = {
  id: string
  sender: 'user' | 'admin'
  text: string
  at: string
}

interface SupportChatWindowProps {
  user: { name: string; plan: string; status: string }
  messages: SupportMessage[]
  onSend: (text: string) => void
}

export function SupportChatWindow({ user, messages, onSend }: SupportChatWindowProps) {
  const [draft, setDraft] = useState('')
  const rendered = useMemo(() => messages, [messages])

  return (
    <section className="flex min-h-[520px] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
          <p className="text-xs text-neutral-600">{user.plan}</p>
        </div>
        <AdminStatusBadge status={user.status} />
      </header>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {rendered.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                m.sender === 'admin'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-[var(--color-charcoal)] text-neutral-900'
              }`}
            >
              <p className="text-sm">{m.text}</p>
              <p className="mt-1 text-[10px] opacity-90">{m.at}</p>
            </div>
          </div>
        ))}
      </div>

      <footer className="border-t border-[var(--color-border)] p-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSend(draft)
            setDraft('')
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type support reply..."
          />
          <Button type="submit" variant="primary" size="md">
            Send
          </Button>
        </form>
      </footer>
    </section>
  )
}

