import type { SupportChatUser } from '../components/SupportChatList'
import type { SupportMessage } from '../components/SupportChatWindow'

export const supportChatUsers: SupportChatUser[] = [
  { id: 'chat-1', name: 'Noah Brown', plan: 'Pro plan', status: 'Active', preview: 'I cannot renew subscription.' },
  { id: 'chat-2', name: 'Anna Moore', plan: 'Basic plan', status: 'Banned', preview: 'Please review my ban reason.' },
  { id: 'chat-3', name: 'Lucas Reed', plan: 'Premium plan', status: 'Active', preview: 'Rooms lagging when > 30 users.' },
]

export const supportMessagesByUser: Record<string, SupportMessage[]> = {
  'chat-1': [
    { id: 'm1', sender: 'user', text: 'Hi, renewal button is disabled for me.', at: '09:13' },
    { id: 'm2', sender: 'admin', text: 'Thanks, checking your account now.', at: '09:14' },
    { id: 'm3', sender: 'user', text: 'Great, waiting for update.', at: '09:15' },
  ],
  'chat-2': [
    { id: 'm4', sender: 'user', text: 'I think my ban is wrong.', at: '11:01' },
    { id: 'm5', sender: 'admin', text: 'We are reviewing moderation logs.', at: '11:03' },
  ],
  'chat-3': [
    { id: 'm6', sender: 'user', text: 'Any update on room lag?', at: '14:12' },
    { id: 'm7', sender: 'admin', text: 'Please share the room ID.', at: '14:13' },
  ],
}

