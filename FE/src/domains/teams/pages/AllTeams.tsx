import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button, IconButton, Input, SettingsIcon } from '../../../components/common'
import { myTeamsData, archivedData } from '../../../mocks'

function MyTeamCard({ tag, code, subtitle, members }: (typeof myTeamsData)[0]) {
  return (
    <Link
      to="/teams/board"
      className="group flex-shrink-0 min-w-[180px] w-[210px] sm:min-w-[220px] sm:w-[240px] md:w-[260px] flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-all duration-200 shadow-none hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="p-3 pb-2">
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-800">
          {tag}
        </span>
      </div>
      <div className="px-3 pb-3 flex flex-col flex-1 min-h-0">
        <div className="w-full aspect-[4/3] max-h-[120px] rounded-lg border border-[var(--color-border)] bg-[var(--color-charcoal)] flex items-center justify-center text-[9px] font-semibold text-neutral-700 uppercase">
          [Image]
        </div>
        <p className="mt-2 text-sm font-bold text-neutral-900 truncate">{code}</p>
        <p className="text-xs text-neutral-600 truncate">{subtitle}</p>
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex -space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] flex-shrink-0"
                aria-hidden
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-[0.06em]">
            {members} members
          </span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-primary/20 text-neutral-900 px-2 py-0.5 text-[10px] font-semibold">
            Go to board
          </span>
        </div>
      </div>
    </Link>
  )
}

function ArchivedCard({ name, active }: (typeof archivedData)[0]) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 hover:border-neutral-400 transition-colors shadow-none">
      <p className="text-xs font-semibold text-neutral-900 truncate">{name}</p>
      <span className="mt-1 px-1.5 py-0.5 bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-700 text-[9px] font-semibold rounded w-fit uppercase">
        {active}
      </span>
      <Link to="/teams/board" className="mt-auto pt-2">
        <Button variant="secondary" size="sm" className="w-full py-1 text-xs h-7 font-semibold">
          Go to study
        </Button>
      </Link>
    </div>
  )
}

export default function AllTeams() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 p-3 md:p-4">
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
       <div className="flex items-center gap-2 min-w-0">
          <span className="text-neutral-600 shrink-0" aria-hidden>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate tracking-tight">MY TEAMS</h1>
            <p className="text-xs text-neutral-500 truncate hidden sm:block">Join the study room and focus together as much as you can.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end min-w-0">
        <span className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] font-semibold text-neutral-900">Study entries 4/5</span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] font-semibold text-neutral-900">
            <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 23c-4.97 0-9-2.58-9-7 0-2.9 1.5-5.2 3.8-6.5C5.5 8.5 4 6.1 4 3.5 4 1 7 0 9.5 0c2 0 3.5 1 4.2 2.5 1.5-1.5 3.5-2.5 5.8-2.5C21 0 24 1 24 3.5c0 2.6-1.5 5-2.8 6 2.3 1.3 3.8 3.6 3.8 6.5 0 4.42-4.03 7-9 7z" />
            </svg>
            Study streak 15 Days
          </span>
          <div className="relative w-full min-w-0 max-w-[14rem] sm:w-44">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" aria-hidden>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <Input
              type="search"
              placeholder="Search..."
              className="w-full h-9 min-h-0 pl-8 pr-2 py-1.5 text-sm"
              aria-label="Search"
            />
          </div>
          <IconButton type="button" className="w-9 h-9" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
          <Link to="/notifications" className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-neutral-600 flex items-center justify-center hover:bg-[var(--color-charcoal)] hover:border-primary/40 transition-colors" aria-label="Notifications">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </Link>
          
        </div>
       </div>

      {/* Main: content panel + sidebar — responsive: stack on small, row on lg+ */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3 overflow-hidden">
        <main className="flex-1 min-w-0 flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-none overflow-auto">
          <section className="mb-4">
            <h2 className="inline-block px-3 py-1.5 rounded-xl bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-800 text-xs font-bold uppercase tracking-wide mb-2">
              My Teams
            </h2>
            <div className="relative flex items-center gap-2">
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scroll-smooth py-1 min-h-[180px] [scrollbar-width:thin]"
              >
                {myTeamsData.map((t) => (
                  <MyTeamCard key={t.id} {...t} />
                ))}
              </div>
            </div>
          </section>
          <section>
            <h2 className="inline-block px-3 py-1.5 rounded-xl bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-800 text-xs font-bold uppercase tracking-wide mb-2">
              Archived teams
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {archivedData.map((t) => (
                <div key={t.id} className="min-w-0">
                  <ArchivedCard {...t} />
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Right sidebar — full width when stacked, fixed width on lg+ */}
        <aside className="w-full lg:w-80 lg:shrink-0 flex flex-col overflow-hidden bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-none">
          <div className="flex items-center justify-between gap-2 pb-2 pt-4 px-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold text-neutral-900">Quick actions</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col gap-4">
            <Link
              to="/team-management"
              className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-charcoal)] hover:border-primary/40 hover:bg-[var(--color-cream-200)] transition-colors text-neutral-900 py-6 sm:py-8 px-4 shadow-none"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 text-neutral-900 text-xl font-bold leading-tight">+</span>
              <span className="text-sm font-bold mt-2">Create new team</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
