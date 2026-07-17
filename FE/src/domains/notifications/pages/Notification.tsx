import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, IconButton, SegmentedControl, SettingsIcon } from '../../../components/common'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'
import { type NotificationItem, type NotificationType } from '../../../mocks'

type TabId = 'all' | 'upcoming' | 'teams'

function mapBackendType(raw: string | undefined | null): NotificationType {
  const type = String(raw || '').toUpperCase()
  if (type === 'TASK_REMINDER' || type === 'DEADLINE') return 'deadline'
  if (type === 'TEAM_INVITE' || type === 'TEAM_JOIN' || type === 'TEAM' || type === 'MEETING') return 'team'
  if (type === 'AI') return 'ai'
  if (type === 'ACHIEVEMENT') return 'achievement'
  if (type === 'MESSAGE') return 'message'
  const lower = String(raw || 'message').toLowerCase()
  if (lower === 'deadline' || lower === 'team' || lower === 'ai' || lower === 'achievement' || lower === 'message') {
    return lower
  }
  return 'message'
}

function getIcon(type: NotificationType) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'
  switch (type) {
    case 'deadline':
      return (
        <span className={`${base} bg-highlight/20 text-neutral-800 dark:text-highlight`} aria-hidden>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )
    case 'team':
      return (
        <span className={`${base} bg-accent-muted text-neutral-800 dark:text-accent`} aria-hidden>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </span>
      )
    case 'ai':
      return (
        <span className={`${base} bg-accent-muted text-neutral-800 dark:text-primary`} aria-hidden>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </span>
      )
    case 'achievement':
      return (
        <span className={`${base} bg-highlight/20 text-neutral-800 dark:text-highlight`} aria-hidden>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </span>
      )
    case 'message':
      return (
        <span className={`${base} bg-success/20 text-neutral-800 dark:text-success`} aria-hidden>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
      )
  }
}

function normalizeNotification(item: any): NotificationItem {
  const uiType = mapBackendType(item.type)
  const createdAt = item.createdAt ? new Date(item.createdAt) : new Date()
  const time = Number.isNaN(createdAt.getTime()) ? 'Recently' : createdAt.toLocaleDateString('vi-VN')
  const linkType = item.linkType ? String(item.linkType).toUpperCase() : null
  const linkId = item.linkId != null ? Number(item.linkId) : null

  return {
    id: String(item.notificationId ?? item.id ?? ''),
    type: uiType,
    title: item.title || 'Notification',
    description: item.message || 'You have a new update.',
    time,
    priority: uiType === 'deadline' || linkType === 'MEETING',
    unread: item.isRead === false,
    linkType,
    linkId: Number.isNaN(linkId as number) ? null : linkId,
  }
}

function filterByTab(items: NotificationItem[], tab: TabId): NotificationItem[] {
  if (tab === 'all') return items
  if (tab === 'upcoming') return items.filter((n) => n.type === 'deadline' || n.priority)
  if (tab === 'teams') return items.filter((n) => n.type === 'team' || n.linkType === 'TEAM' || n.linkType === 'MEETING')
  return items
}

function resolveNotificationPath(n: NotificationItem): string | null {
  const linkType = String(n.linkType || '').toUpperCase()
  if (linkType === 'MEETING' && n.linkId) return `/meetings/room?meetingId=${n.linkId}`
  if (linkType === 'TEAM' && n.linkId) return `/teams/board?teamId=${n.linkId}`
  if (linkType === 'TASK' && n.linkId) return `/teams`
  if (n.type === 'team') return '/teams'
  if (n.type === 'deadline') return '/teams'
  return null
}

export default function Notification() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabId>('all')
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await workflowApi.getNotifications()
      if (res.success) {
        const mapped = Array.isArray(res.data) ? res.data.map(normalizeNotification) : []
        setItems(mapped)
      }
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  const filtered = filterByTab(items, tab)

  const handleClick = async (n: NotificationItem) => {
    if (n.unread) {
      const numId = Number(n.id)
      if (!Number.isNaN(numId)) {
        try {
          await workflowApi.markNotificationAsRead(numId)
          setItems((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
          )
        } catch {
          // ignore
        }
      }
    }
    const path = resolveNotificationPath(n)
    if (path) navigate(path)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{t('notif.title')}</h1>
          <p className="text-neutral-600 mt-1">{t('notif.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {items.some((n) => n.unread) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await workflowApi.markAllNotificationsAsRead()
                setItems((prev) => prev.map((item) => ({ ...item, unread: false })))
              }}
            >
              {t('notif.markAllRead')}
            </Button>
          )}
          <IconButton icon={<SettingsIcon className="w-5 h-5" />} label={t('notif.settings')} />
        </div>
      </div>

      <div className="border-b border-neutral-200 dark:border-[var(--color-border)] pb-2">
        <SegmentedControl
          value={tab}
          onChange={(next) => setTab(next as TabId)}
          options={[
            { value: 'all', label: t('notif.tab.all') },
            { value: 'upcoming', label: t('notif.tab.upcoming') },
            { value: 'teams', label: t('notif.tab.teams') },
          ]}
        />
      </div>

      <ul className="space-y-3">
        {isLoading ? (
          <li className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-neutral-600">{t('notif.loading')}</li>
        ) : filtered.length === 0 ? (
          <li className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-neutral-600">{t('notif.empty')}</li>
        ) : filtered.map((n) => (
          <li key={n.id}>
            <Card
              onClick={() => void handleClick(n)}
              className={`p-4 flex gap-4 items-start border-2 transition-all duration-200 cursor-pointer ${
                n.unread
                  ? 'bg-neutral-50/70 border-primary/30 hover:border-primary/50 hover:bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-[var(--color-surface)]'
              }`}
            >
              {getIcon(n.type)}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                  {n.title}
                  {n.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </h3>
                <p className="text-sm text-neutral-600 mt-1">{n.description}</p>
                {n.priority && (
                  <Badge variant="warning" className="mt-2">{t('notif.priority')}</Badge>
                )}
              </div>
              <Badge variant="default" className="shrink-0">
                {n.time}
              </Badge>
            </Card>
          </li>
        ))}
      </ul>

      {filtered.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button variant="primary" size="md" onClick={loadNotifications}>{t('notif.refresh')}</Button>
        </div>
      )}
    </div>
  )
}
