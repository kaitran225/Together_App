import { Link } from 'react-router-dom'
import { Badge, Button, Card, Textarea } from '../../../components/common'
import { todayTasks, studyBars, upcomingItems, teamCards, cardCompact } from '../../../mocks'

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card variant="featured" className="p-6 md:p-7 border border-[var(--color-border)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Badge variant="milestone" className="normal-case tracking-[0.12em] mb-3">Daily momentum</Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight uppercase tracking-[0.04em]">Welcome back, keep your streak alive</h1>
            <p className="text-sm text-neutral-500 mt-2">You have 3 tasks due today and your team is actively studying.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="cta" size="md">Start focus session</Button>
            <Link to="/meetings">
              <Button variant="tonal" size="md">Join meeting</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 w-full grid-cols-1 sm:grid-cols-3">
        <Card variant="interactive" className={`flex items-center gap-3 py-3 ${cardCompact}`}>
          <div className="flex-shrink-0 text-neutral-800 dark:text-highlight">
            <svg width="24" height="28" viewBox="0 0 40 47" fill="none" className="w-6 h-7" aria-hidden>
              <path d="M5 27.21C5 29.35 5.44 31.38 6.31 33.3 7.19 35.22 8.44 36.9 10.06 38.34 10.02 38.14 10 37.95 10 37.79 10 37.62 10 37.44 10 37.23 10 35.91 10.25 34.67 10.75 33.52 11.25 32.36 11.98 31.31 12.94 30.36L20 23.5l7.06 6.86c.96.95 1.69 2 2.19 3.15.5 1.15.75 2.39.75 3.71 0 .21-.02.41-.06.63.94-1.21 2.19-2.89 3.81-4.33 1.63-1.44 2.88-3.12 3.76-5.04C34.56 31.38 35 29.35 35 27.21c0-2.06-.39-4.01-1.16-5.84-.77-1.84-1.88-3.47-3.34-4.92-.83.54-1.71.94-2.62 1.21a8.1 8.1 0 0 1-2.5.4c-2.58 0-4.82-.85-6.72-2.54-1.9-1.69-2.99-3.77-3.28-6.25-1.63 1.36-3.06 2.77-4.31 4.24-1.25 1.46-2.3 2.95-3.16 4.46-.85 1.5-1.5 3.04-1.94 4.6C5.22 24.14 5 25.69 5 27.21z" fill="currentColor" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Current streak</p>
            <p className="text-2xl font-extrabold text-neutral-900">15 Days</p>
            <Badge variant="streak" className="mt-1 normal-case tracking-normal">On fire</Badge>
          </div>
        </Card>
        <Card variant="interactive" className={`flex items-center gap-3 py-3 ${cardCompact}`}>
          <div className="flex-shrink-0 text-neutral-800 dark:text-primary">
            <svg width="24" height="24" viewBox="0 0 50 50" fill="none" className="w-6 h-6" aria-hidden>
              <rect x="2" y="2" width="46" height="46" rx="23" stroke="currentColor" strokeWidth="3" />
              <rect x="25" y="15.1" width="14" height="14" transform="rotate(45 25 15.1)" stroke="currentColor" strokeWidth="3" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Experience points</p>
            <p className="text-2xl font-extrabold text-neutral-900">12,450 XP</p>
            <Badge variant="milestone" className="mt-1 normal-case tracking-normal">Level up soon</Badge>
          </div>
        </Card>
        <Card variant="interactive" className={`flex items-center gap-3 py-3 ${cardCompact}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Coins in wallet</p>
            <p className="text-2xl font-extrabold text-neutral-900">1000</p>
            <Badge variant="focus" className="mt-1 normal-case tracking-normal">Reward ready</Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[24fr_36fr_40fr] gap-4 w-full">
        <Card variant="interactive" className={`${cardCompact}`} heading="Today's work">
          <ul className="space-y-2">
            {todayTasks.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)]"
              >
                <Badge variant="outline" className="mt-0.5 px-1.5 py-0 text-[10px]">Task</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{t.title}</p>
                  <p className="text-xs text-neutral-500">{t.due}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="tonal" size="sm" className="w-full mt-3">+ Add task</Button>
        </Card>

        <Card variant="interactive" className={`${cardCompact}`} heading="Teams joined">
          <div className="grid grid-cols-2 gap-2.5">
            {teamCards.map((team, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] flex flex-col gap-2"
              >
                <p className="text-sm font-semibold text-neutral-900 truncate">{team.name}</p>
                <Badge variant="focus" className="normal-case tracking-normal w-fit">{team.active}</Badge>
                <Link to="/teams">
                  <Button variant="secondary" size="sm" className="w-full">Join</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="featured" className={`${cardCompact}`} heading="Study time today">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="primary" className="normal-case tracking-normal">Weekly pace</Badge>
            <Button variant="ghost" size="sm" className="text-xs">View analytics</Button>
          </div>
          <div className="flex items-end gap-1.5 h-[180px]">
            {studyBars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full">
                {b.label && <span className="text-[10px] font-semibold text-neutral-600">{b.label}</span>}
                <div
                  className={`w-full rounded-t-full min-h-[10px] ${b.active ? 'bg-[var(--color-focus-area)]' : 'bg-[var(--color-charcoal)]'}`}
                  style={{ height: `${b.h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-0 pt-2 mt-1 border-t border-[var(--color-border)]">
            {studyBars.map((b, i) => (
              <span key={i} className="flex-1 text-center text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{b.day}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[24fr_36fr_40fr] gap-4 w-full">
        <Card variant="interactive" className={`${cardCompact}`} heading="Upcoming meetings">
          <ul className="space-y-2">
            {upcomingItems.map((item, i) => (
              <li
                key={i}
                className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)]"
              >
                <div className="flex justify-between items-start gap-2">
                  <Badge variant={item.tagClass.includes('error') ? 'error' : 'outline'} className="normal-case tracking-normal">{item.tag}</Badge>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{item.time}</span>
                </div>
                <p className="text-sm font-semibold text-neutral-900 mt-1 truncate">{item.title}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="interactive" className={`${cardCompact}`}>
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Open study rooms</h3>
            <Button variant="ghost" size="sm" className="text-xs shrink-0">Join randomly</Button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {teamCards.map((room, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] flex flex-col gap-2"
              >
                <p className="text-sm font-semibold text-neutral-900 truncate">{room.name}</p>
                <Badge variant="focus" className="normal-case tracking-normal w-fit">{room.active}</Badge>
                <Link to="/study-room">
                  <Button variant="secondary" size="sm" className="w-full">Enter</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card variant="interactive" className={`${cardCompact}`}>
            <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Upcoming tasks</h3>
              <Link to="/meetings">
                <Button variant="tonal" size="sm" className="shrink-0">Start / Join</Button>
              </Link>
            </div>
            <ul className="space-y-2">
              {upcomingItems.slice(0, 2).map((item, i) => (
                <li
                  key={i}
                  className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant={item.tagClass.includes('error') ? 'error' : 'outline'} className="normal-case tracking-normal">{item.tag}</Badge>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{item.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mt-1 truncate">{item.title}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card variant="interactive" className={`${cardCompact}`} heading="Quick notes">
            <Textarea placeholder="Start typing a note..." className="min-h-[120px] resize-y text-sm py-2" />
            <Button variant="tonal" size="sm" className="w-full mt-2">+ Add note</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
