import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MeResponse } from '../../../types/dto'
import { authApi, readApi, workflowApi, getStoredToken } from '../../../api/client'
import { getFakeMeResponse, SKILLS, LEARNING_GOALS, COMPLETED_BY_DATE, MONTHLY_HOURS, HIGHLIGHT_MONTH, QUIZZES, NOTES } from '../../../mocks'
import { Button, Card, Progress, Badge, IconButton, Input } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'

export default function ProfileWithSidebar() {
  const { logout } = useAuth()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [readHealth, setReadHealth] = useState<string>('—')
  const [workflowHealth, setWorkflowHealth] = useState<string>('—')

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      authApi.me(token).then((res) => {
        if (res.success && res.data) setUser(res.data)
      })
    } else {
      const fake = getFakeMeResponse()
      if (fake.success && fake.data) setUser(fake.data)
    }
    readApi.health().then((res) => setReadHealth(res.success ? 'UP' : 'DOWN'))
    workflowApi.health().then((res) => setWorkflowHealth(res.success ? 'UP' : 'DOWN'))
  }, [])

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User'
  const xpCurrent = 2450
  const xpTarget = 3000
  const levelProgress = (xpCurrent / xpTarget) * 100

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Profile header - full width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="w-20 h-20 rounded-full bg-neutral-200 border-2 border-neutral-300 flex items-center justify-center text-neutral-500" aria-hidden>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <IconButton
              type="button"
              className="absolute bottom-0 right-0 w-6 h-6"
              variant="default"
              label="Edit profile"
              icon={(
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">{displayName}</h1>
            <p className="text-sm text-neutral-600">Software Engineering · Level 24</p>
            <Button variant="secondary" size="sm" className="mt-2 border-2 border-primary/30 text-neutral-900 hover:bg-accent-muted">
              Share profile
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input type="search" placeholder="Search..." className="w-40 h-10 min-h-0 px-3 py-2 rounded-lg border-2 border-neutral-200 text-sm" aria-label="Search" />
          <IconButton type="button" className="p-2 w-10 h-10" aria-label="Settings" label="Settings" icon={<svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          <IconButton type="button" className="p-2 w-10 h-10" aria-label="Notifications" label="Notifications" icon={<svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} />
        </div>
      </div>

      {/* 3 columns: 40% | 40% | 20% */}
      <div className="grid grid-cols-1 lg:grid-cols-[40fr_40fr_20fr] gap-6 items-start">
        {/* Column 1 (40%) */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="p-5 border-2 border-neutral-200" heading="Level progress">
            <Progress value={xpCurrent} max={xpTarget} label={<><span>{xpCurrent.toLocaleString()} / {xpTarget.toLocaleString()} XP to Level 25</span><span>{Math.round(levelProgress)}%</span></>} />
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Completed work">
            <ul className="space-y-3">
              {COMPLETED_BY_DATE.map((group, i) => (
                <li key={i}>
                  <p className="text-xs font-semibold text-neutral-500 mb-2">{group.date}</p>
                  <ul className="space-y-1.5">
                    {group.tasks.map((t, j) => (
                      <li key={j} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-neutral-900 truncate">{t.title}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'on-time' ? 'bg-success/20 text-neutral-800 dark:text-success' : 'bg-highlight/20 text-neutral-800 dark:text-highlight'}`}>
                          {t.status === 'on-time' ? 'On time' : 'Late'} {t.pct}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="inline-block mt-3 text-xs font-semibold text-neutral-700 hover:text-neutral-900">View full →</Link>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Achievements">
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((i) => (
                <span key={i} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-[var(--color-cream-300)]" aria-hidden>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
              ))}
              <span className="w-12 h-12 rounded-full bg-accent-muted flex items-center justify-center text-neutral-800 dark:text-primary" aria-hidden>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              <span className="w-12 h-12 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400" aria-hidden>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
            </div>
            <Link to="/dashboard" className="inline-block mt-3 text-xs font-semibold text-neutral-700 hover:text-neutral-900">View full →</Link>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Learning goals">
            <div className="flex flex-wrap gap-2">
              {LEARNING_GOALS.map((g) => (
                <Button key={g} type="button" variant="secondary" size="sm" className="px-3 py-2 rounded-xl border-2 border-accent/20 bg-accent-muted text-neutral-900 text-xs font-semibold flex items-center gap-1.5 hover:bg-accent-muted transition-colors">
                  {g}
                  <span className="text-neutral-700 dark:text-accent"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg></span>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 2 (40%) */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="p-5 border-2 border-neutral-200" heading="Weekly schedule">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-600 uppercase mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (<span key={d}>{d}</span>))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {[2, 3, 4, 5, 6, 7, 8].map((d, i) => (
                <div key={d} className="p-1.5 rounded-lg border border-neutral-200 bg-neutral-50/50 min-h-[40px]">
                  <span className="text-xs font-medium text-neutral-900">{d}</span>
                  {i === 1 && <p className="text-[8px] text-neutral-700 dark:text-accent mt-0.5 truncate">10:00</p>}
                  {i === 3 && <p className="text-[8px] text-neutral-800 dark:text-highlight mt-0.5 truncate">Exam</p>}
                </div>
              ))}
            </div>
            <Link to="/calendar" className="inline-block mt-3 text-xs font-semibold text-neutral-700 hover:text-neutral-900">View full →</Link>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Study time by month">
            <div className="flex items-end gap-0.5 h-20">
              {MONTHLY_HOURS.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                  <span className="text-[8px] font-medium text-neutral-500 truncate w-full text-center">{['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][i]}</span>
                  <div className="w-full rounded-t min-h-[3px]" style={{ height: `${(h / 24) * 100}%` }}>
                    <div className={`h-full w-full rounded-t ${i === HIGHLIGHT_MONTH ? 'bg-primary' : 'bg-accent/20'}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Completed quizzes">
            <ul className="space-y-2">
              {QUIZZES.map((q, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-neutral-100 last:border-0">
                  <span className="text-neutral-900 truncate font-medium">{q.title}</span>
                  <span className="text-neutral-500 text-xs shrink-0">{q.when}</span>
                  <span className="font-bold text-neutral-900 w-8 text-right shrink-0">{q.pct}%</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Notes">
            <ul className="space-y-2">
              {NOTES.map((n, i) => (
                <li key={i}>
                  <Button type="button" variant="secondary" className="w-full text-left px-3 py-2 rounded-lg border-2 border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-900 truncate justify-start">
                    {n}
                  </Button>
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="inline-block mt-3 text-xs font-semibold text-neutral-700 hover:text-neutral-900">View full →</Link>
          </Card>
        </div>

        {/* Column 3 (20%) */}
        <div className="flex flex-col gap-6 min-w-0">
        <Card className="p-5 border-2 border-neutral-200" heading="Skills">
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full bg-accent-muted text-neutral-800 dark:text-primary text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-3">+ Add</Button>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Statistics">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-neutral-600">Focused study time</span><strong className="text-neutral-900">142h</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Tasks completed</span><strong className="text-neutral-900">48</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Group projects</span><strong className="text-neutral-900">12</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Global rank</span><strong className="text-neutral-900">#1,204</strong></li>
            </ul>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Account & services">
            {user && (
              <p className="text-xs text-neutral-900 mb-2"><strong className="break-all">{user.email}</strong>{user.fullName != null && ` · ${user.fullName}`}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={readHealth === 'UP' ? 'primary' : 'outline'}>Read {readHealth}</Badge>
              <Badge variant={workflowHealth === 'UP' ? 'primary' : 'outline'}>Workflow {workflowHealth}</Badge>
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={logout}>Logout</Button>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Next reward">
            <div className="mb-2">
              <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">75% · Level 24 + Premium</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
