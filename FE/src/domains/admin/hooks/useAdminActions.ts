import { useCallback, useRef, useState } from 'react'
import type { AdminUserRow } from '../data/usersData'
import type { SupportMessage } from '../components/SupportChatWindow'

type ToastState = {
  message: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
} | null

export function useAdminActions() {
  const [toast, setToast] = useState<ToastState>(null)
  const timeoutRef = useRef<number | null>(null)

  const showToast = useCallback((message: string, variant: NonNullable<ToastState>['variant'] = 'success') => {
    setToast({ message, variant })
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  const closeToast = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setToast(null)
  }, [])

  const toggleUserBan = useCallback((users: AdminUserRow[], userId: string) => {
    return users.map((u) => {
      if (u.id !== userId) return u
      return {
        ...u,
        status: (u.status === 'Banned' ? 'Active' : 'Banned') as AdminUserRow['status'],
      }
    })
  }, [])

  const appendSupportMessage = useCallback((messages: SupportMessage[], text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return messages
    const now = new Date()
    const at = now.toTimeString().slice(0, 5)
    return [
      ...messages,
      {
        id: `admin-${now.getTime()}`,
        sender: 'admin' as const,
        text: trimmed,
        at,
      },
    ]
  }, [])

  return { toast, showToast, closeToast, toggleUserBan, appendSupportMessage }
}

