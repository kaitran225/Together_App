import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  adminBottomTabTos,
  adminNavItems,
  isNavActive,
  NavIcon,
  userBottomTabTos,
  userNavItems,
} from './navConfig'

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = (user?.systemRole ?? 'USER') === 'ADMIN'
  const homePath = isAdmin ? '/admin/overview' : '/dashboard'
  const tabTos = isAdmin ? adminBottomTabTos : userBottomTabTos
  const allItems = isAdmin ? adminNavItems : userNavItems
  const tabs = tabTos
    .map((to) => allItems.find((item) => item.to === to))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  if (typeof document === 'undefined') return null

  return createPortal(
    <nav
      className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]"
      aria-label="Primary"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="grid h-14 grid-cols-5">
        {tabs.map((item) => {
          const active = isNavActive(location.pathname, item.to, homePath)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                active ? 'text-primary' : 'text-neutral-500'
              }`}
            >
              <NavIcon icon={item.icon} className="h-5 w-5" />
              <span className="max-w-full truncate px-0.5">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>,
    document.body,
  )
}
