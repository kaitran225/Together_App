import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { IconButton } from '../common'
import { ThemeSwitch } from '../ThemeSwitch'
import { LanguageSwitch } from '../LanguageSwitch'
import { useState } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'

type BreadcrumbItem = { labelKey: string; href?: string }

const BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ labelKey: 'crumb.dashboard' }],
  '/profile': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.profile' }],
  '/study-rooms': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.studyRooms' }],
  '/study-rooms/create': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.studyRooms', href: '/study-rooms' }, { labelKey: 'crumb.createRoom' }],
  '/study-rooms/create-new': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.studyRooms', href: '/study-rooms' }, { labelKey: 'crumb.createNewRoom' }],
  '/study-rooms/recommend': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.studyRooms', href: '/study-rooms' }, { labelKey: 'crumb.recommend' }],
  '/study-room': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.studyRooms', href: '/study-rooms' }, { labelKey: 'crumb.studyRoom' }],
  '/study-room-dashboard': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.studyRooms', href: '/study-rooms' }, { labelKey: 'crumb.myRooms' }],
  '/teams': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.teams' }],
  '/team-management': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.teams', href: '/teams' }, { labelKey: 'crumb.teamManagement' }],
  '/calendar': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.calendar' }],
  '/subscription': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.subscription' }],
  '/shop': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.shop' }],
  '/meet-ai': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.meetAi' }],
  '/ai-support': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.meetAi', href: '/meet-ai' }, { labelKey: 'crumb.aiSupport' }],
  '/quizlet': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.quiz' }],
  '/quizlet-result': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.quizResult' }],
  '/focus-room': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.focusRoom' }],
  '/focus-room-dialog': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.focusRoom' }],
  '/notifications': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.notifications' }],
  '/transaction': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.profile', href: '/profile' }, { labelKey: 'crumb.transactions' }],
  '/personalize': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.profile', href: '/profile' }, { labelKey: 'crumb.personalize' }],
  '/personalize-2': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.profile', href: '/profile' }, { labelKey: 'crumb.personalize' }],
  '/personalize-3': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.profile', href: '/profile' }, { labelKey: 'crumb.personalize' }],
  '/meetings': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.meetings' }],
  '/meetings/room': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.meetings', href: '/meetings' }, { labelKey: 'crumb.inMeeting' }],
  '/teams/board': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.teams', href: '/teams' }, { labelKey: 'crumb.board' }],
  '/scrum-board': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.teams', href: '/teams' }, { labelKey: 'crumb.board', href: '/teams/board' }],
  '/sprint-board': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.teams', href: '/teams' }, { labelKey: 'crumb.board', href: '/teams/board' }],
  '/sprint-member-board': [{ labelKey: 'crumb.dashboard', href: '/dashboard' }, { labelKey: 'crumb.teams', href: '/teams' }, { labelKey: 'crumb.board', href: '/teams/board' }, { labelKey: 'crumb.members' }],
  '/admin': [{ labelKey: 'crumb.admin' }],
  '/admin/overview': [{ labelKey: 'crumb.admin' }, { labelKey: 'crumb.dashboard' }],
  '/admin/users-management': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.users' }],
  '/admin/moderation': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.moderation' }],
  '/admin/social-rooms': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.socialRooms' }],
  '/admin/reports': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.reports' }],
  '/admin/revenue': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.revenue' }],
  '/admin/support': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.support' }],
  '/admin/billing': [{ labelKey: 'crumb.admin' }, { labelKey: 'nav.admin.billing' }],
  '/admin/account': [{ labelKey: 'crumb.admin', href: '/admin' }, { labelKey: 'crumb.account' }],
}

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'page.home',
  '/profile': 'page.profile',
  '/study-rooms': 'page.studyRooms',
  '/meetings': 'page.meetings',
  '/teams': 'page.teams',
  '/teams/board': 'page.board',
  '/calendar': 'page.calendar',
  '/subscription': 'page.subscription',
  '/shop': 'page.shop',
  '/meet-ai': 'page.togetherAi',
  '/notifications': 'page.notifications',
  '/admin': 'page.adminHome',
  '/admin/overview': 'nav.admin.dashboard',
  '/admin/users-management': 'nav.admin.users',
  '/admin/moderation': 'nav.admin.moderation',
  '/admin/social-rooms': 'nav.admin.socialRooms',
  '/admin/reports': 'nav.admin.reports',
  '/admin/revenue': 'nav.admin.revenue',
  '/admin/support': 'nav.admin.support',
  '/admin/billing': 'nav.admin.billing',
  '/admin/account': 'page.adminAccount',
}

const PAGE_SUBTITLE_KEYS: Record<string, string> = {
  '/dashboard': 'page.homeSubtitle',
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] | null {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname]
  const sorted = Object.entries(BREADCRUMBS)
    .filter(([path]) => path !== '/dashboard' && pathname.startsWith(path))
    .sort(([a], [b]) => b.length - a.length)
  return sorted[0] ? sorted[0][1] : null
}

function getPageTitleKey(pathname: string): string | null {
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname]
  for (const [path, title] of Object.entries(PAGE_TITLE_KEYS)) {
    if (path !== '/dashboard' && pathname.startsWith(path)) return title
  }
  return null
}

function getPageSubtitleKey(pathname: string): string | null {
  if (PAGE_SUBTITLE_KEYS[pathname]) return PAGE_SUBTITLE_KEYS[pathname]
  for (const [path, sub] of Object.entries(PAGE_SUBTITLE_KEYS)) {
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

export function DashboardHeader({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const pathname = location.pathname
  const isAdminView = pathname.startsWith('/admin')
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [adminSearch, setAdminSearch] = useState('')
  const breadcrumbs = getBreadcrumbs(pathname)
  const titleKey = getPageTitleKey(pathname)
  const subtitleKey = getPageSubtitleKey(pathname)
  const isHome = pathname === '/dashboard'

  return (
    <header
      className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-none"
      role="banner"
    >
      {onOpenMenu && (
        <button
          type="button"
          onClick={onOpenMenu}
          className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-full text-neutral-700 hover:bg-[var(--color-charcoal)] flex-shrink-0"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
            {breadcrumbs.map((item, i) => {
              const isLast = i === breadcrumbs.length - 1
              const label = t(item.labelKey)
              return (
                <span key={i} className="inline-flex shrink-0 items-center gap-1.5">
                  {i > 0 && <Chevron />}
                  {item.href && !isLast ? (
                    <Link to={item.href} className="text-neutral-900 underline hover:text-neutral-700">
                      {label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'font-bold text-neutral-900' : 'font-normal text-neutral-500'}>
                      {label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
        ) : titleKey ? (
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate tracking-tight uppercase tracking-[0.08em]">
              {isHome ? t('page.home') : t(titleKey)}
            </h1>
            {subtitleKey && (
              <p className="text-sm text-neutral-500 truncate hidden sm:block">
                {t(subtitleKey)}
              </p>
            )}
          </div>
        ) : (
          <>
            <span className="text-xs text-neutral-600">{t('common.welcomeTo')}</span>
            <Link to="/dashboard" className="text-sm font-bold text-primary hover:brightness-110 truncate transition-colors duration-150 active:opacity-80">
              together
            </Link>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1.5 md:gap-3">
        {isAdminView ? (
          <>
            <div className="hidden sm:contents">
              <LanguageSwitch />
              <ThemeSwitch />
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-charcoal)] px-3 py-2">
              <svg className="h-4 w-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={t('common.search')}
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-40 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none"
              />
            </div>
            <Link
              to="/notifications"
              className="w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-500 hover:bg-[var(--color-charcoal)] hover:text-neutral-900 flex-shrink-0 transition-colors duration-150"
              aria-label={t('nav.notifications')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    'A'
                  )}
                </span>
                <span className="hidden sm:inline text-xs font-medium text-neutral-900">Admin</span>
                <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {openUserMenu && (
                <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-none">
                  <Link to="/profile" className="block rounded-lg px-2.5 py-2 text-xs text-neutral-700 hover:bg-[var(--color-charcoal)]">{t('common.profile')}</Link>
                  <button type="button" onClick={logout} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-[var(--color-charcoal)]">{t('common.logout')}</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="hidden sm:contents">
              <LanguageSwitch />
              <ThemeSwitch />
            </div>
        <Link to="/transaction" title={t('shop.history')} className="hidden sm:inline-flex">
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            className="text-neutral-500 dark:text-neutral-500 flex-shrink-0"
            label={t('shop.history')}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
          />
        </Link>
        <Link
          to="/notifications"
          className="w-8 h-8 inline-flex items-center justify-center rounded-full text-neutral-500 hover:bg-white/10 hover:text-neutral-900 flex-shrink-0 transition-colors duration-150"
          aria-label={t('nav.notifications')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-1.5 p-1 pr-1.5 sm:pr-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 flex-shrink-0 transition-colors duration-150 active:scale-[0.98]"
        >
          <span
            className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold flex-shrink-0 overflow-hidden"
            aria-hidden
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
            ) : (
              (user?.fullName || user?.email || 'N').charAt(0).toUpperCase()
            )}
          </span>
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-xs font-medium text-neutral-900 truncate leading-tight">{user?.fullName ?? t('nav.guest')}</p>
          </div>
        </Link>
          </>
        )}
      </div>
    </header>
  )
}
