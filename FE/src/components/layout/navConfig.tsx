import type { ReactNode } from 'react'
import { AiBotIcon } from '../common'

export type NavIconKey =
  | 'home'
  | 'study'
  | 'meetings'
  | 'teams'
  | 'calendar'
  | 'gift'
  | 'shop'
  | 'ai'
  | 'admin'
  | 'users'
  | 'settings'
  | 'moderation'
  | 'rooms'
  | 'reports'
  | 'revenue'
  | 'support'
  | 'menu'
  | 'profile'

export type NavItem = {
  to: string
  labelKey: string
  icon: NavIconKey
}

export const userNavItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.home', icon: 'home' },
  { to: '/study-rooms', labelKey: 'nav.studyRooms', icon: 'study' },
  { to: '/meetings', labelKey: 'nav.meetings', icon: 'meetings' },
  { to: '/teams', labelKey: 'nav.teams', icon: 'teams' },
  { to: '/calendar', labelKey: 'nav.calendar', icon: 'calendar' },
  { to: '/subscription', labelKey: 'nav.subscription', icon: 'gift' },
  { to: '/shop', labelKey: 'nav.shop', icon: 'shop' },
  { to: '/meet-ai', labelKey: 'nav.togetherAi', icon: 'ai' },
  { to: '/support', labelKey: 'nav.support', icon: 'support' },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin/overview', labelKey: 'nav.admin.dashboard', icon: 'admin' },
  { to: '/admin/users-management', labelKey: 'nav.admin.users', icon: 'users' },
  { to: '/admin/moderation', labelKey: 'nav.admin.moderation', icon: 'moderation' },
  { to: '/admin/social-rooms', labelKey: 'nav.admin.socialRooms', icon: 'rooms' },
  { to: '/admin/reports', labelKey: 'nav.admin.reports', icon: 'reports' },
  { to: '/admin/revenue', labelKey: 'nav.admin.revenue', icon: 'revenue' },
  { to: '/admin/support', labelKey: 'nav.admin.support', icon: 'support' },
  { to: '/admin/billing', labelKey: 'nav.admin.billing', icon: 'shop' },
]

/** Primary bottom-tab routes (mobile). */
export const userBottomTabTos = [
  '/dashboard',
  '/study-rooms',
  '/meetings',
  '/teams',
  '/calendar',
] as const

export const adminBottomTabTos = [
  '/admin/overview',
  '/admin/users-management',
  '/admin/moderation',
  '/admin/social-rooms',
  '/admin/support',
] as const

export function isNavActive(pathname: string, to: string, homePath: string): boolean {
  return (
    pathname === to ||
    (to !== homePath && pathname.startsWith(to + '/')) ||
    (to === homePath && pathname === homePath)
  )
}

export function NavIcon({ icon, className = 'w-5 h-5 flex-shrink-0' }: { icon: NavIconKey; className?: string }) {
  const icons: Record<NavIconKey, ReactNode> = {
    home: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 10l8-6 8 6v10h-6v-6H10v6H4z" />
      </svg>
    ),
    study: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H2" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a2 2 0 0 0 2 2h8" />
      </svg>
    ),
    meetings: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    teams: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    calendar: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    gift: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
    shop: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    ai: <AiBotIcon className={className.includes('w-') ? className : 'w-6 h-6 flex-shrink-0'} />,
    admin: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 3h18v18H3z" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    users: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="3.5" />
        <path d="M20 8v6M17 11h6" />
      </svg>
    ),
    settings: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V22a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.36.48.57 1.08.6 1.7.03.62-.12 1.24-.44 1.76-.32.52-.8.94-1.36 1.19-.56.25-1.17.34-1.76.25" />
      </svg>
    ),
    moderation: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    rooms: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 10l9-7 9 7v10H3V10z" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
    reports: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 4h16v16H4z" />
        <path d="M8 16l3-3 2 2 3-4" />
      </svg>
    ),
    revenue: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 19h16" />
        <path d="M6 15l4-4 3 3 5-6" />
      </svg>
    ),
    support: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
      </svg>
    ),
    menu: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
      </svg>
    ),
    profile: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return <>{icons[icon]}</>
}
