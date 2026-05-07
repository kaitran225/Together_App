import { Link } from 'react-router-dom'

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-none">
      <nav className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-6 md:gap-4 max-w-[1200px] mx-auto" aria-label="Main">
        <Link to="/welcome" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold text-neutral-900 dark:text-primary">∞</span>
          <span className="text-base font-semibold text-neutral-800 dark:text-accent">together</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/welcome" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150">Welcome</Link>
          <Link to="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150">Product</Link>
          <Link to="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150">About us</Link>
          <Link to="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150">Contact</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/sign-up" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150">Sign up</Link>
          <Link
            to="/welcome"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:brightness-95 transition-colors duration-150"
          >
            Log in
          </Link>
        </div>
      </nav>
    </header>
  )
}
