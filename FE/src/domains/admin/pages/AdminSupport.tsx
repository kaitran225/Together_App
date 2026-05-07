import { useMemo, useState } from 'react'
import { AdminActionToast, AdminPageSection, SupportChatList, SupportChatWindow } from '../components'
import { supportChatUsers, supportMessagesByUser } from '../data/supportData'
import { useAdminActions } from '../hooks/useAdminActions'

export default function AdminSupport() {
  const [selectedId, setSelectedId] = useState(supportChatUsers[0]?.id ?? '')
  const [messagesByUser, setMessagesByUser] = useState(supportMessagesByUser)
  const { toast, showToast, closeToast, appendSupportMessage } = useAdminActions()
  const selectedUser = supportChatUsers.find((u) => u.id === selectedId) ?? supportChatUsers[0]
  const messages = useMemo(() => messagesByUser[selectedUser.id] ?? [], [messagesByUser, selectedUser.id])

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title="Support" subtitle="Respond to user issues in real-time chat">
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <SupportChatList users={supportChatUsers} selectedId={selectedUser.id} onSelect={setSelectedId} />
          <SupportChatWindow
            user={{ name: selectedUser.name, plan: selectedUser.plan, status: selectedUser.status }}
            messages={messages}
            onSend={(text) => {
              if (!text.trim()) return
              setMessagesByUser((prev) => ({
                ...prev,
                [selectedUser.id]: appendSupportMessage(prev[selectedUser.id] ?? [], text),
              }))
              showToast(`Reply sent to ${selectedUser.name}`, 'success')
            }}
          />
        </div>
      </AdminPageSection>
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}

