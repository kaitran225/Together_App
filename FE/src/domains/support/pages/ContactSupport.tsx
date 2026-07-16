import { useEffect, useState } from 'react'
import { Badge, Button, Card, Textarea } from '../../../components/common'
import { workflowApi } from '../../../api/client'

type Message = {
  id: string
  sender: 'user' | 'admin'
  text: string
  at: string
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export default function ContactSupport() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadMessages = async () => {
    try {
      const res = await workflowApi.getMySupportMessages()
      if (res.success && res.data) {
        setMessages(
          res.data.map((m: any) => ({
            id: String(m.messageId),
            sender: m.sender === 'ADMIN' ? 'admin' : 'user',
            text: m.message,
            at: formatTime(m.createdAt),
          }))
        )
      }
    } catch (err) {
      console.error('Failed to load support messages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text) return
    setSending(true)
    try {
      const res = await workflowApi.sendSupportMessage(text)
      if (res.success) {
        setMessages((prev) => [...prev, { id: `local-${Date.now()}`, sender: 'user', text, at: formatTime(new Date().toISOString()) }])
        setDraft('')
      }
    } catch (err) {
      console.error('Failed to send support message:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <div>
        <Badge variant="milestone" className="mb-2 normal-case tracking-normal">We're here to help</Badge>
        <h1 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">Contact support</h1>
        <p className="text-sm text-neutral-600 mt-1">Send us a message and our team will reply here.</p>
      </div>

      <Card className="flex flex-col min-h-[480px]">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-neutral-500">No messages yet. Send us a message below to get started.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                  <p className="mt-1 text-[10px] opacity-80">{m.at}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-neutral-200 p-3 flex gap-2 items-end">
          <Textarea
            rows={2}
            placeholder="Describe your issue..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1"
          />
          <Button variant="primary" onClick={handleSend} disabled={sending || !draft.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
