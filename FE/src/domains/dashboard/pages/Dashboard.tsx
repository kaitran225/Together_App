import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Textarea, Progress, Toast } from '../../../components/common'
import { cardCompact } from '../../../mocks'
import { workflowApi, readApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from '../../../contexts/LanguageContext'

function formatTime(isoString: string) {
  try {
    const d = new Date(isoString)
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return isoString
  }
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, refreshProfile } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)

  // Chức năng tự học
  const [activeSessionId, setActiveSessionId] = useState<number | null>(() => {
    const saved = localStorage.getItem('active_study_session_id')
    return saved ? Number(saved) : null
  })
  const [isStudyLoading, setIsStudyLoading] = useState(false)
  const [sessionExpEarned, setSessionExpEarned] = useState<number | null>(null)

  const handleToggleStudySession = async () => {
    setIsStudyLoading(true)
    setSessionExpEarned(null)
    try {
      if (activeSessionId) {
        // Kết thúc phiên học
        const res = await workflowApi.endSession(activeSessionId)
        if (res.success && res.data) {
          const exp = res.data.expEarned ?? 1
          setSessionExpEarned(exp)
          setActiveSessionId(null)
          localStorage.removeItem('active_study_session_id')
          // Tự động tải lại profile để cập nhật EXP, Level, Streak mới nhất
          await refreshProfile()
        } else {
          alert(res.message || 'Không thể kết thúc phiên học.')
        }
      } else {
        // Bắt đầu phiên học
        const res = await workflowApi.startSession(null, 'SELF_STUDY')
        if (res.success && res.data) {
          const sid = res.data.sessionId
          setActiveSessionId(sid)
          localStorage.setItem('active_study_session_id', String(sid))
        } else {
          alert(res.message || 'Không thể bắt đầu phiên học.')
        }
      }
    } catch (e: any) {
      console.error(e)
      alert('Có lỗi xảy ra khi thực hiện chức năng tự học.')
    } finally {
      setIsStudyLoading(false)
    }
  }

  useEffect(() => {
    workflowApi.getMyTeams()
      .then(async (res) => {
        if (res.success && res.data) {
          setTeams(res.data.slice(0, 4).map((t: any) => ({
            name: t.name,
            active: `${t.currentMemberCount || 1} members`,
            id: t.teamId,
          })))

          // Fetch all upcoming tasks from projects of user's teams
          const allTasks: any[] = []
          for (const team of res.data) {
            try {
              const projRes = await workflowApi.getProjects(team.teamId)
              if (projRes.success && projRes.data) {
                for (const proj of projRes.data) {
                  const boardRes = await workflowApi.getBoard(proj.projectId)
                  if (boardRes.success && boardRes.data && boardRes.data.columns) {
                    for (const col of boardRes.data.columns) {
                      if (col.name?.toLowerCase() !== 'done' && col.name?.toLowerCase() !== 'completed' && col.tasks) {
                        for (const task of col.tasks) {
                          allTasks.push({
                            ...task,
                            projectName: proj.name,
                            teamName: team.name,
                          })
                        }
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching team projects/tasks:', err)
            }
          }
          setTasks(allTasks)
        }
      })
      .catch(() => {})

    readApi.getRooms()
      .then((res) => {
        if (res.success && res.data) {
          setRooms(res.data.slice(0, 4).map((r: any) => ({
            name: r.title,
            active: `${r.members?.length || 0}/${r.maxMembers || 10}`,
            id: r.roomId,
          })))
        }
      })
      .catch(() => {})

    workflowApi.getSchedules()
      .then((res) => {
        if (res.success && res.data) {
          setSchedules(res.data)
        }
      })
      .catch(() => {})

    workflowApi.getNotes()
      .then((res) => {
        if (res.success && res.data) {
          setNotes(res.data)
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      const res = await workflowApi.createNote(noteText.trim())
      if (res.success) {
        setNoteText('')
        const noteRes = await workflowApi.getNotes()
        if (noteRes.success && noteRes.data) {
          setNotes(noteRes.data)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingNote(false)
    }
  }
  const levelMult = (user as any)?.level || 1
  const streakMult = (user as any)?.streak || 0
  const xpCurrent = (user as any)?.exp ?? 0
  const userLevel = (user as any)?.level ?? 1
  const xpTarget = userLevel * 100
  const studyBars = [
    { day: 'M', h: Math.min(30 + levelMult * 5, 90), label: `${((30 + levelMult * 5) * 0.1).toFixed(1)}h`, active: true },
    { day: 'T', h: Math.min(45 + streakMult * 10, 95), label: `${((45 + streakMult * 10) * 0.1).toFixed(1)}h`, active: true },
    { day: 'W', h: Math.min(20 + levelMult * 3, 85), label: `${((20 + levelMult * 3) * 0.1).toFixed(1)}h`, active: false },
    { day: 'T', h: Math.min(60 + streakMult * 8, 100), label: `${((60 + streakMult * 8) * 0.1).toFixed(1)}h`, active: true },
    { day: 'F', h: Math.min(15 + levelMult * 4, 80), label: `${((15 + levelMult * 4) * 0.1).toFixed(1)}h`, active: false },
    { day: 'S', h: Math.min(70 + streakMult * 5, 95), label: `${((70 + streakMult * 5) * 0.1).toFixed(1)}h`, active: true },
    { day: 'S', h: Math.min(10 + levelMult * 10, 90), label: `${((10 + levelMult * 10) * 0.1).toFixed(1)}h`, active: false },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card variant="featured" className="p-6 md:p-7 border border-[var(--color-border)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight uppercase tracking-[0.04em]">
              {t('dashboard.welcome')}{user?.fullName ? `, ${user.fullName}` : ''}
            </h1>
            <p className="text-sm text-neutral-500 mt-2">{t('dashboard.subWelcome')}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId ? (
              <>
                <span className="flex items-center gap-2 text-xs font-bold text-error animate-pulse mr-2 relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block animate-ping absolute" style={{ width: '10px', height: '10px' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" />
                  ĐANG HỌC TẬP TRUNG
                </span>
                <Link to="/focus-room">
                  <Button variant="cta" size="md">
                    Vào lại phòng
                  </Button>
                </Link>
                <Button 
                  variant="tonal" 
                  size="md"
                  onClick={handleToggleStudySession}
                  disabled={isStudyLoading}
                >
                  {isStudyLoading ? 'Đang xử lý...' : 'Dừng học'}
                </Button>
              </>
            ) : (
              <Link to="/focus-room">
                <Button variant="cta" size="md">
                  Bắt đầu học
                </Button>
              </Link>
            )}
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
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.currentStreak')}</p>
            <p className="text-2xl font-extrabold text-neutral-900">{user ? `${(user as any).streak ?? 0} ${t('dashboard.days')}` : `-- ${t('dashboard.days')}`}</p>
            <Badge variant="streak" className="mt-1 normal-case tracking-normal">{t('dashboard.keepGoing')}</Badge>
          </div>
        </Card>
        <Card variant="interactive" className={`flex flex-col gap-2 py-3 ${cardCompact}`}>
          <div className="flex items-center gap-3 w-full">
            <div className="flex-shrink-0 text-neutral-800 dark:text-primary">
              <svg width="24" height="24" viewBox="0 0 50 50" fill="none" className="w-6 h-6" aria-hidden>
                <rect x="2" y="2" width="46" height="46" rx="23" stroke="currentColor" strokeWidth="3" />
                <rect x="25" y="15.1" width="14" height="14" transform="rotate(45 25 15.1)" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.experiencePoints')}</p>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <p className="text-xl font-extrabold text-neutral-900 leading-none">{user ? `${(user as any).exp ?? 0} XP` : '-- XP'}</p>
                <Badge variant="milestone" className="normal-case tracking-normal">Level {userLevel}</Badge>
              </div>
            </div>
          </div>
          <div className="w-full mt-1">
            <Progress 
              value={xpCurrent} 
              max={xpTarget} 
              size="sm" 
              label={<span className="text-[9px] text-neutral-500 font-semibold">{xpCurrent} / {xpTarget} XP to Lv.{userLevel + 1}</span>}
              showPercentage
            />
          </div>
        </Card>
        <Card variant="interactive" className={`flex items-center gap-3 py-3 ${cardCompact}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.plan')}</p>
            <p className="text-2xl font-extrabold text-neutral-900">{(user as any)?.planType ?? 'FREE'}</p>
            <Badge variant="focus" className="mt-1 normal-case tracking-normal">{user?.role ?? 'USER'}</Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[24fr_36fr_40fr] gap-4 w-full">
        <Card variant="interactive" className={`${cardCompact}`} heading="Teams joined">
          {teams.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <p className="text-sm">No teams yet.</p>
              <Link to="/teams">
                <Button variant="tonal" size="sm" className="mt-2">Browse teams</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {teams.map((team, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] flex flex-col gap-2"
                >
                  <p className="text-sm font-semibold text-neutral-900 truncate">{team.name}</p>
                  <Badge variant="focus" className="normal-case tracking-normal w-fit">{team.active}</Badge>
                  <Link to={`/teams/board?teamId=${team.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">Go to board</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="interactive" className={`${cardCompact}`}>
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Open study rooms</h3>
            <Link to="/study-rooms">
              <Button variant="ghost" size="sm" className="text-xs shrink-0">Browse all</Button>
            </Link>
          </div>
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <p className="text-sm">No rooms open.</p>
              <Link to="/study-rooms/create">
                <Button variant="tonal" size="sm" className="mt-2">Create room</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {rooms.map((room, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] flex flex-col gap-2"
                >
                  <p className="text-sm font-semibold text-neutral-900 truncate">{room.name}</p>
                  <Badge variant="focus" className="normal-case tracking-normal w-fit">{room.active}</Badge>
                  <Link to={`/study-room?roomId=${room.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">Enter</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
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
          {schedules.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <p className="text-sm">No meetings scheduled.</p>
              <Link to="/calendar">
                <Button variant="tonal" size="sm" className="mt-2">Schedule one</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[220px] overflow-y-auto">
              {schedules.slice(0, 4).map((item, i) => (
                <li
                  key={i}
                  className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className="normal-case tracking-normal">
                      {item.location || 'Online'}
                    </Badge>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {formatTime(item.startTime)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mt-1 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="interactive" className={`${cardCompact}`}>
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Quick links</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/ai-support" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">AI Support</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">Chat</Badge>
            </Link>
            <Link to="/calendar" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">Calendar</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">View</Badge>
            </Link>
            <Link to="/shop" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">Shop</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">Coins</Badge>
            </Link>
            <Link to="/subscription" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">Subscription</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">Plans</Badge>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card variant="interactive" className={`${cardCompact}`}>
            <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Upcoming tasks</h3>
              <Link to="/teams">
                <Button variant="tonal" size="sm" className="shrink-0">View boards</Button>
              </Link>
            </div>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-neutral-500">
                <p className="text-sm">No tasks assigned.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[220px] overflow-y-auto">
                {tasks.slice(0, 4).map((item, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant={item.priority === 'HIGH' ? 'error' : item.priority === 'MEDIUM' ? 'warning' : 'focus'} className="normal-case tracking-normal">
                        {item.priority}
                      </Badge>
                      {item.teamName && (
                        <span className="text-[10px] font-bold text-neutral-500 truncate max-w-[80px]">
                          {item.teamName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 mt-1 truncate">{item.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card variant="interactive" className={`${cardCompact}`} heading={t('dashboard.personalNotes')}>
            <Textarea
              placeholder={t('dashboard.notePlaceholder')}
              className="min-h-[80px] resize-y text-sm py-2"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button
              variant="tonal"
              size="sm"
              className="w-full mt-2"
              onClick={handleSaveNote}
              disabled={savingNote}
            >
              {savingNote ? t('dashboard.saving') : `+ ${t('dashboard.saveNote')}`}
            </Button>

            {notes.length > 0 && (
              <div className="mt-3 border-t border-[var(--color-border)] pt-3 max-h-[120px] overflow-y-auto space-y-1.5">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t('dashboard.savedNotesTitle')}</p>
                {notes.slice(0, 3).map((n) => (
                  <div key={n.noteId} className="flex justify-between items-start gap-2 p-2 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">
                    <p
                      onClick={() => setSelectedNote(n)}
                      className="text-neutral-800 dark:text-neutral-200 truncate flex-1 cursor-pointer hover:underline"
                      title="Click to view details"
                    >
                      {n.content}
                    </p>
                    <button
                      onClick={async () => {
                        await workflowApi.deleteNote(n.noteId)
                        setNotes(prev => prev.filter(item => item.noteId !== n.noteId))
                      }}
                      className="text-[var(--color-error)] hover:underline shrink-0 text-[10px]"
                    >
                      {t('dashboard.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-neutral-900 border border-[var(--color-border)] shadow-2xl rounded-3xl relative">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 border-b border-[var(--color-border)] pb-3 mb-4">
              {t('dashboard.noteDetails')}
            </h3>
            
            <div className="max-h-[300px] overflow-y-auto text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap mb-6 leading-relaxed">
              {selectedNote.content}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-[var(--color-border)]">
              <Button
                variant="cta"
                size="sm"
                onClick={async () => {
                  await workflowApi.deleteNote(selectedNote.noteId)
                  setNotes(prev => prev.filter(item => item.noteId !== selectedNote.noteId))
                  setSelectedNote(null)
                }}
              >
                {t('dashboard.delete')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedNote(null)}
              >
                {t('dashboard.close')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {sessionExpEarned !== null && (
        <div className="fixed bottom-4 right-4 z-[999] max-w-sm animate-scale-in">
          <Toast 
            variant="success" 
            onClose={() => setSessionExpEarned(null)} 
            className="shadow-2xl border border-emerald-200 bg-emerald-50"
          >
            <div className="flex flex-col gap-0.5 text-emerald-950">
              <span className="font-extrabold text-sm">🎉 Phiên học hoàn thành!</span>
              <span className="text-xs">Bạn đã nhận được <strong className="text-emerald-700 font-black">+{sessionExpEarned} XP</strong>. Cố gắng phát huy nhé!</span>
            </div>
          </Toast>
        </div>
      )}
    </div>
  )
}
