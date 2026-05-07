import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button, IconButton } from '../common'
import { ThemeSwitch } from '../ThemeSwitch'
import { useState } from 'react'

type BreadcrumbItem = { label: string; href?: string }

const BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/profile': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }],
  '/study-rooms': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Study Rooms' }],
  '/study-rooms/create': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Study Rooms', href: '/study-rooms' }, { label: 'Create Room' }],
  '/study-rooms/create-new': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Study Rooms', href: '/study-rooms' }, { label: 'Create New Room' }],
  '/study-rooms/recommend': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Study Rooms', href: '/study-rooms' }, { label: 'Recommend matching' }],
  '/study-room': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Study Rooms', href: '/study-rooms' }, { label: 'Study room' }],
  '/study-room-dashboard': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Study Rooms', href: '/study-rooms' }, { label: 'My rooms' }],
  '/teams': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams' }],
  '/team-management': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams', href: '/teams' }, { label: 'Team management' }],
  '/calendar': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calendar' }],
  '/subscription': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subscription' }],
  '/shop': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Shop' }],
  '/meet-ai': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Meet AI' }],
  '/ai-support': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Meet AI', href: '/meet-ai' }, { label: 'AI Support' }],
  '/quizlet': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Quiz' }],
  '/quizlet-result': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Quiz result' }],
  '/focus-room': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Focus room' }],
  '/focus-room-dialog': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Focus room' }],
  '/notifications': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }],
  '/transaction': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile', href: '/profile' }, { label: 'Transactions' }],
  '/personalize': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile', href: '/profile' }, { label: 'Personalize' }],
  '/personalize-2': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile', href: '/profile' }, { label: 'Personalize' }],
  '/personalize-3': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile', href: '/profile' }, { label: 'Personalize' }],
  '/meetings': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Meetings' }],
  '/meetings/room': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Meetings', href: '/meetings' }, { label: 'In meeting' }],
  '/teams/board': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams', href: '/teams' }, { label: 'Board' }],
  '/scrum-board': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams', href: '/teams' }, { label: 'Board', href: '/teams/board' }],
  '/sprint-board': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams', href: '/teams' }, { label: 'Board', href: '/teams/board' }],
  '/sprint-member-board': [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams', href: '/teams' }, { label: 'Board', href: '/teams/board' }, { label: 'Members' }],
  '/admin': [{ label: 'Admin' }],
  '/admin/overview': [{ label: 'Admin' }, { label: 'Dashboard' }],
  '/admin/users-management': [{ label: 'Admin' }, { label: 'Users' }],
  '/admin/moderation': [{ label: 'Admin' }, { label: 'Moderation' }],
  '/admin/social-rooms': [{ label: 'Admin' }, { label: 'Social Rooms' }],
  '/admin/reports': [{ label: 'Admin' }, { label: 'Reports' }],
  '/admin/revenue': [{ label: 'Admin' }, { label: 'Revenue' }],
  '/admin/support': [{ label: 'Admin' }, { label: 'Support' }],
  '/admin/users': [{ label: 'Admin', href: '/admin' }, { label: 'Users' }],
  '/admin/account': [{ label: 'Admin', href: '/admin' }, { label: 'Account' }],
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/profile': 'Profile',
  '/study-rooms': 'Study Rooms',
  '/meetings': 'Meetings',
  '/teams': 'Teams',
  '/teams/board': 'Board',
  '/calendar': 'Calendar',
  '/subscription': 'Subscription',
  '/shop': 'Shop',
  '/meet-ai': 'Together AI',
  '/notifications': 'Notifications',
  '/admin': 'Admin Home',
  '/admin/overview': 'Dashboard',
  '/admin/users-management': 'Users',
  '/admin/moderation': 'Moderation',
  '/admin/social-rooms': 'Social Rooms',
  '/admin/reports': 'Reports',
  '/admin/revenue': 'Revenue',
  '/admin/support': 'Support',
  '/admin/users': 'Admin Users',
  '/admin/account': 'Admin Account',
}

const PAGE_SUBTITLES: Record<string, string> = {
  '/dashboard': 'You have 3 deadlines today — get started!',
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] | null {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname]
  const sorted = Object.entries(BREADCRUMBS)
    .filter(([path]) => path !== '/dashboard' && pathname.startsWith(path))
    .sort(([a], [b]) => b.length - a.length)
  return sorted[0] ? sorted[0][1] : null
}

function getPageTitle(pathname: string): string | null {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== '/dashboard' && pathname.startsWith(path)) return title
  }
  return null
}

function getPageSubtitle(pathname: string): string | null {
  if (PAGE_SUBTITLES[pathname]) return PAGE_SUBTITLES[pathname]
  for (const [path, sub] of Object.entries(PAGE_SUBTITLES)) {
    if (path !== '/dashboard' && pathname.startsWith(path)) return sub
  }
  return null
}

const Chevron = () => (
  <span className="text-neutral-500 shrink-0" aria-hidden>
    <svg width="5" height="7" viewBox="0 0 5 7" fill="none">
      <path d="M2.68333 3.5L0 0.816667L0.816667 0L4.31667 3.5L0.816667 7L0 6.18333L2.68333 3.5Z" fill="currentColor" />
    </svg>
  </span>
)

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pathname = location.pathname
  const isAdminView = pathname.startsWith('/admin')
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [adminSearch, setAdminSearch] = useState('')
  const breadcrumbs = getBreadcrumbs(pathname)
  const titleOnly = getPageTitle(pathname)
  const subtitle = getPageSubtitle(pathname)
  const isHome = pathname === '/dashboard'

  return (
    <header
      className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-none"
      role="banner"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
            {breadcrumbs.map((item, i) => {
              const isLast = i === breadcrumbs.length - 1
              return (
                <span key={i} className="inline-flex shrink-0 items-center gap-1.5">
                  {i > 0 && <Chevron />}
                  {item.href && !isLast ? (
                    <Link to={item.href} className="text-neutral-900 underline hover:text-neutral-700">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'font-bold text-neutral-900' : 'font-normal text-neutral-500'}>
                      {item.label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
        ) : titleOnly ? (
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate tracking-tight uppercase tracking-[0.08em]">
              {isHome ? 'Home' : titleOnly}
            </h1>
            {subtitle && (
              <p className="text-sm text-neutral-500 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <>
            <span className="text-xs text-neutral-600">Welcome to</span>
            <Link to="/dashboard" className="text-sm font-bold text-primary hover:brightness-110 truncate transition-colors duration-150 active:opacity-80">
              together
            </Link>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 md:gap-3">
        {isAdminView ? (
          <>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-charcoal)] px-3 py-2">
              <svg className="h-4 w-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-40 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none"
              />
            </div>
            <Link
              to="/notifications"
              className="w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-500 hover:bg-[var(--color-charcoal)] hover:text-neutral-900 flex-shrink-0 transition-colors duration-150"
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenUserMenu((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-[var(--color-charcoal)]"
                aria-haspopup="menu"
                aria-expanded={openUserMenu}
              >
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold">
                  A
                </span>
                <span className="hidden sm:inline text-xs font-medium text-neutral-900">Admin</span>
                <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {openUserMenu && (
                <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-none">
                  <Link to="/profile" className="block rounded-lg px-2.5 py-2 text-xs text-neutral-700 hover:bg-[var(--color-charcoal)]">Profile</Link>
                  <button type="button" onClick={logout} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-[var(--color-charcoal)]">Logout</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <ThemeSwitch />
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          className="text-neutral-500 dark:text-neutral-500 flex-shrink-0"
          label="Settings"
          icon={<svg className="w-4 h-4" viewBox="0 0 21 20" fill="none" aria-hidden><path d="M7.3 20L6.9 16.8C6.68 16.72 6.48 16.62 6.29 16.5 6.1 16.38 5.91 16.26 5.73 16.13L2.75 17.38 0 12.63l2.58-2.95c-.02-.12-.03-.23-.03-.34 0-.11 0-.22.03-.33L0 7.38 2.75 2.63l5.73 1.25c.18-.13.37-.26.56-.37.2-.12.4-.22.6-.3L9.05 0h3.8l.4 3.2c.22.08.42.18.62.3.2.12.39.25.56.38l5.73-1.25L20.1 7.38l-2.58 2.95c.02.12.03.23.03.34 0 .11 0 .22-.03.33L20.08 12.63 17.33 17.37l-4.95-1.25c-.18.13-.36.26-.56.38-.2.12-.4.22-.6.3L12.8 20H7.3z" fill="currentColor" fillOpacity="0.5" /></svg>}
        />
        <Link
          to="/notifications"
          className="w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-500 hover:bg-white/10 hover:text-neutral-900 flex-shrink-0 transition-colors duration-150"
          aria-label="Notifications"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-1.5 p-1 pr-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 flex-shrink-0 transition-colors duration-150 active:scale-[0.98]"
        >
          <span
            className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
            aria-hidden
          >
            N
          </span>
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-xs font-medium text-neutral-900 truncate leading-tight">{user?.fullName ?? 'Guest'}</p>
            <p className="text-[10px] text-neutral-500 truncate leading-tight">@{user?.username ?? 'guest'}</p>
          </div>
        </Link>
        <Button
          type="button"
          onClick={logout}
          variant="secondary"
          size="sm"
          className="hidden sm:inline-flex"
        >
          Logout
        </Button>
        <Link
          to="/focus-room"
          className={`hidden sm:inline-flex px-4 py-2 text-xs font-bold rounded-full flex-shrink-0 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
            isHome
              ? 'bg-[var(--color-warning)] text-black hover:brightness-95 focus:ring-[var(--color-warning)]'
              : 'bg-[var(--color-error)] text-white hover:brightness-95 focus:ring-[var(--color-error)]'
          }`}
        >
          Focus room
        </Link>
          </>
        )}
      </div>
    </header>
  )
}
