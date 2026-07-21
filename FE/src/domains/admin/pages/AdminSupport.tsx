import { useEffect, useMemo, useState } from 'react'
import { AdminActionToast, AdminPageSection, SupportChatList, SupportChatWindow } from '../components'
import type { SupportChatUser } from '../components/SupportChatList'
import type { SupportMessage } from '../components/SupportChatWindow'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'

function formatTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toTimeString().slice(0, 5)
}

export default function AdminSupport() {
  const [conversations, setConversations] = useState<SupportChatUser[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [messagesByUser, setMessagesByUser] = useState<Record<string, SupportMessage[]>>({})
  const [loading, setLoading] = useState(true)
  const { toast, showToast, closeToast } = useAdminActions()
  const selectedUser = conversations.find((u) => u.id === selectedId) ?? conversations[0]
  const messages = useMemo(() => (selectedUser ? messagesByUser[selectedUser.id] ?? [] : []), [messagesByUser, selectedUser])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await workflowApi.getAdminSupportConversations()
      if (res.success && res.data) {
        const mapped: SupportChatUser[] = res.data.map((c: any) => ({
          id: c.userSso,
          name: c.userName || c.userSso,
          plan: c.userPlan || 'Basic plan',
          status: c.userStatus === 'BANNED' ? 'Banned' : 'Active',
          preview: c.lastMessagePreview || '',
        }))
        setConversations(mapped)
        if (mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id)
      }
    } catch (err) {
      console.error('Failed to load support conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    workflowApi.getAdminSupportConversation(selectedUser.id)
      .then((res) => {
        if (res.success && res.data) {
          const mapped: SupportMessage[] = res.data.map((m: any) => ({
            id: String(m.messageId),
            sender: m.sender === 'ADMIN' ? 'admin' : 'user',
            text: m.message,
            at: formatTime(m.createdAt),
          }))
          setMessagesByUser((prev) => ({ ...prev, [selectedUser.id]: mapped }))
        }
      })
      .catch((err) => console.error('Failed to load conversation:', err))
  }, [selectedUser?.id])

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedUser) return
    try {
      const res = await workflowApi.sendAdminSupportReply(selectedUser.id, text.trim())
      if (res.success) {
        setMessagesByUser((prev) => ({
          ...prev,
          [selectedUser.id]: [
            ...(prev[selectedUser.id] ?? []),
            { id: `local-${Date.now()}`, sender: 'admin', text: text.trim(), at: formatTime(new Date().toISOString()) },
          ],
        }))
        showToast(`Reply sent to ${selectedUser.name}`, 'success')
      } else {
        showToast(res.message || 'Failed to send reply', 'error')
      }
    } catch {
      showToast('Error sending reply', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title="Support" subtitle="Respond to user issues in real-time chat">
        {loading ? (
          <p className="text-sm text-neutral-600">Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-neutral-600">No support messages yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <SupportChatList users={conversations} selectedId={selectedUser?.id ?? ''} onSelect={setSelectedId} />
            {selectedUser && (
              <SupportChatWindow
                user={{ name: selectedUser.name, plan: selectedUser.plan, status: selectedUser.status }}
                messages={messages}
                onSend={handleSend}
              />
            )}
          </div>
        )}
      </AdminPageSection>
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}
