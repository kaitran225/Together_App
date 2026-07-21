import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../common'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { adminNavItems, isNavActive, NavIcon, userNavItems } from './navConfig'

export function DashboardSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const role = (user?.systemRole ?? 'USER') as string
  const navItems = role === 'ADMIN' ? adminNavItems : userNavItems
  const homePath = role === 'ADMIN' ? '/admin/overview' : '/dashboard'

  return (
    <aside
      className={`relative h-full flex flex-col flex-shrink-0 bg-[var(--color-background)] border-r border-[var(--color-border)] text-white transition-[width] ${
        collapsed ? 'w-14' : 'w-56'
      }`}
      aria-label="Dashboard navigation"
    >
      <div className="p-2.5 flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
        <Link
          to={homePath}
          className={`flex items-center p-1.5 rounded-xl hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors duration-150 ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label="App home"
        >
          <div className="flex h-10 items-center justify-center">
            <img src="/together/horizontal-icon.svg" alt="Together" className="h-7 w-auto flex-shrink-0" />
          </div>
        </Link>
        <nav className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto" aria-label="Main">
          {navItems.map((item) => {
            const active = isNavActive(location.pathname, item.to, homePath)
            return (
              <Link
                key={`${item.to}-${item.labelKey}`}
                to={item.to}
                title={t(item.labelKey)}
                className={`self-stretch flex items-center gap-3 rounded-lg py-2 transition-colors duration-150 ${
                  collapsed ? 'justify-center px-2' : 'justify-start px-2.5'
                } ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-900'
                }`}
              >
                <NavIcon icon={item.icon} />
                {!collapsed && (
                  <span className={`text-sm font-medium truncate ${active ? 'font-semibold' : ''}`}>
                    {t(item.labelKey)}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
          {collapsed ? (
            <Link
              to="/profile"
              className="flex justify-center p-2 rounded-xl hover:bg-[var(--color-charcoal)] transition-colors duration-150"
              aria-label="Go to profile"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-charcoal)] border border-[var(--color-border)] flex-shrink-0" />
            </Link>
          ) : (
            <Button
              type="button"
              onClick={logout}
              variant="ghost"
              size="sm"
              className="w-full !justify-start text-left text-xs font-semibold px-2 py-1.5 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-[var(--color-charcoal)] transition-colors"
            >
              {t('nav.logout')}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c: boolean) => !c)}
            className={`w-full inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-charcoal)] text-neutral-700 hover:text-neutral-900 hover:brightness-[0.98] transition-colors ${
              collapsed ? 'justify-center px-2 py-2' : 'justify-between px-2.5 py-2'
            }`}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            title={collapsed ? t('nav.expand') : t('nav.collapse')}
          >
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{t('nav.collapse')}</span>
            )}
            <svg
              className={`w-4 h-4 transition-transform duration-200 ease-out ${collapsed ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
