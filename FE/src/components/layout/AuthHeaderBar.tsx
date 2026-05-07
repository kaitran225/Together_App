import { Link } from 'react-router-dom'
import { ThemeSwitch } from '../ThemeSwitch'

/**
 * Minimal auth header in the 40% content area: logo + actions only.
 */
export function AuthHeaderBar() {
  return (
    <header
      className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-none"
      role="banner"
    >
      <Link to="/welcome" className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold text-lime-600 dark:text-primary" aria-hidden>
          ∞
        </span>
        <span className="text-sm font-semibold text-violet-600 dark:text-accent">together</span>
      </Link>
      <div className="flex items-center gap-2.5">
        <ThemeSwitch />
        <Link to="/sign-up" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
          Sign up
        </Link>
        <Link
          to="/welcome"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:brightness-95"
        >
          Log in
        </Link>
      </div>
    </header>
  )
}
