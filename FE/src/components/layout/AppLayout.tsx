import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button, Input } from '../common'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/study-rooms', label: 'Study Rooms' },
  { to: '/teams', label: 'Projects' },
  { to: '/meet-ai', label: 'AI Tutor' },
] as const

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-white/10 px-4 py-3 md:px-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/together/horizontal-icon.svg" alt="Together" className="h-7 w-auto" />
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main">
            {navItems.map(({ to, label }) => {
              const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
              return (
                <Link key={to} to={to}>
                  <span
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search platform..."
            className="max-w-64 min-h-[40px] py-2"
            aria-label="Search"
          />
          <Link to="/notifications">
            <Button variant="ghost" size="sm" aria-label="Notifications" className="p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="sm" aria-label="Profile" className="p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </Button>
          </Link>
        </div>
      </header>

      <footer className="bg-[var(--color-surface)] border-t border-white/10 px-4 py-3 mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="label-study text-[10px]">Current Streak</p>
              <p className="text-sm font-bold">12 Days</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="w-64">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span>Level 14</span>
                <span>2,450 / 3,000 XP</span>
              </div>
              <div className="h-2 w-full bg-[var(--color-charcoal)] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary w-[81%]" />
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            <Link to="/quests"><span className="text-[10px] font-bold uppercase">Quests</span></Link>
            <Link to="/rank"><span className="text-[10px] font-bold uppercase">Rank</span></Link>
          </div>
        </div>
      </footer>

      <main className="flex-1 p-4 md:p-6 md:py-8 max-w-[1200px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
