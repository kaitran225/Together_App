/** Notifications: tabs, list */

export const NOTIFICATION_TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'teams', label: 'Teams' },
] as const

export type NotificationType = 'deadline' | 'team' | 'ai' | 'achievement' | 'message'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  description: string
  time: string
  priority?: boolean
  unread?: boolean
}

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'deadline',
    title: 'Biology Quiz Deadline',
    description: 'Your "Cell Division" quiz is closing in 4 hours. Don\'t forget to submit your final answers.',
    time: '2h ago',
    priority: true,
  },
  {
    id: '2',
    type: 'team',
    title: 'Team Update: Physics Project',
    description: 'Sarah uploaded a new draft of the "Thermodynamics" research paper to the group workspace.',
    time: '5h ago',
  },
  {
    id: '3',
    type: 'ai',
    title: 'AI Study Insight',
    description: 'Based on your last session, you might want to review "Organic Chemistry" concepts before the exam.',
    time: 'Yesterday',
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Achievement Unlocked',
    description: 'You\'ve earned the "Early Bird" badge for completing 5 focus sessions before 8:00 AM.',
    time: 'Yesterday',
  },
  {
    id: '5',
    type: 'message',
    title: 'New Message: Calculus Group',
    description: 'Alex: "Does anyone have the notes from Tuesday\'s lecture on integrals?"',
    time: '2 days ago',
    unread: true,
  },
]
