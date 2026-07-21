import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  adminNavItems,
  isNavActive,
  NavIcon,
  userNavItems,
  type NavItem,
} from './navConfig'

type MobileNavDrawerProps = {
  open: boolean
  onClose: () => void
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isAdmin = (user?.systemRole ?? 'USER') === 'ADMIN'
  const homePath = isAdmin ? '/admin/overview' : '/dashboard'
  const drawerItems: NavItem[] = [
    ...(isAdmin ? adminNavItems : userNavItems),
    { to: '/profile', labelKey: 'common.profile', icon: 'profile' },
    { to: '/notifications', labelKey: 'nav.notifications', icon: 'support' },
  ]

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) onClose()
    // Close when route changes (e.g. after tapping a link)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        width: '100vw',
        height: '100dvh',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          border: 0,
          margin: 0,
          padding: 0,
          background: 'rgba(0,0,0,0.45)',
          cursor: 'pointer',
        }}
      />
      <aside
        className="flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] text-neutral-900"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(20rem, 86vw)',
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxSizing: 'border-box',
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <Link to={homePath} onClick={onClose} className="flex min-w-0 items-center gap-2">
            <img src="/together/horizontal-icon.svg" alt="Together" className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-[var(--color-charcoal)]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" aria-label="More">
          <ul className="flex flex-col gap-0.5">
            {drawerItems.map((item) => {
              const active = isNavActive(location.pathname, item.to, homePath)
              return (
                <li key={`${item.to}-${item.labelKey}`}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-neutral-800 hover:bg-[var(--color-charcoal)]'
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-[var(--color-border)] p-3">
          <button
            type="button"
            onClick={() => {
              onClose()
              logout()
              navigate('/welcome', { replace: true })
            }}
            className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-[var(--color-charcoal)]"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
