import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Textarea, Progress, Toast, Modal } from '../../../components/common'
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
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])

  // Thêm task mới
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      const res = await workflowApi.createFocusRoomTask(
        newTaskTitle.trim(),
        newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
      )
      if (res.success) {
        setNewTaskTitle('')
        setNewTaskDueDate('')
        setShowAddTaskModal(false)
        await loadUpcomingTasks()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAddingTask(false)
    }
  }

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
          try {
            const weeklyRes = await workflowApi.getWeeklyStudyHours()
            if (weeklyRes.success && weeklyRes.data) {
              setWeeklyHours(weeklyRes.data)
            }
          } catch (err) {
            console.error('Error reloading weekly hours:', err)
          }
        } else {
          alert(res.message || t('dashboard.cannotEndSession'))
        }
      } else {
        // Bắt đầu phiên học
        const res = await workflowApi.startSession(null, 'SELF_STUDY')
        if (res.success && res.data) {
          const sid = res.data.sessionId
          setActiveSessionId(sid)
          localStorage.setItem('active_study_session_id', String(sid))
        } else {
          alert(res.message || t('dashboard.cannotStartSession'))
        }
      }
    } catch (e: any) {
      console.error(e)
      alert(t('dashboard.studySessionError'))
    } finally {
      setIsStudyLoading(false)
    }
  }

  const loadUpcomingTasks = async () => {
    const allTasks: any[] = []
    try {
      const teamsRes = await workflowApi.getMyTeams()
      const myTeams = teamsRes.success && teamsRes.data ? teamsRes.data : []

      // 1. Fetch team tasks
      for (const team of myTeams) {
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
                        isPersonal: false,
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
    } catch (e) {
      console.error(e)
    }

    // 2. Fetch personal tasks from focus room
    try {
      const personalRes = await workflowApi.getFocusRoomTasks()
      if (personalRes.success && personalRes.data) {
        const personalUncompleted = personalRes.data.filter((task: any) => !task.isCompleted)
        for (const task of personalUncompleted) {
          allTasks.push({
            id: task.id,
            title: task.title,
            priority: 'MEDIUM',
            isPersonal: true,
            dueDate: task.dueDate,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching personal focus tasks:', err)
    }

    setTasks(allTasks)
  }

  const handleToggleTaskCompletion = async (item: any) => {
    if (item.isPersonal) {
      try {
        const res = await workflowApi.updateFocusRoomTask(item.id, undefined, undefined, true)
        if (res.success) {
          await loadUpcomingTasks()
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      alert(t('dashboard.teamTaskUpdateKanban'))
    }
  }

  const handleDeleteTask = async (item: any) => {
    if (item.isPersonal) {
      try {
        const res = await workflowApi.deleteFocusRoomTask(item.id)
        if (res.success) {
          await loadUpcomingTasks()
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      alert(t('dashboard.cannotDeleteTeamTask'))
    }
  }

  useEffect(() => {
    loadUpcomingTasks()

    workflowApi.getMyTeams()
      .then((res) => {
        if (res.success && res.data) {
          setTeams(res.data.slice(0, 4).map((team: any) => ({
            name: team.name,
            active: t('dashboard.membersCount', { count: team.currentMemberCount || 1 }),
            id: team.teamId,
          })))
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

    workflowApi.getUserWallet()
      .then((res) => {
        if (res.success && res.data) {
          setWalletBalance(res.data.balance || 0)
        }
      })
      .catch(() => {})

    workflowApi.getWeeklyStudyHours()
      .then((res) => {
        if (res.success && res.data) {
          setWeeklyHours(res.data)
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
  const totalExp = user?.exp ?? 0
  
  let tempLevel = 1
  let remainingExp = totalExp
  let nextLevelExp = 100
  
  while (true) {
    nextLevelExp = (Math.floor((tempLevel - 1) / 10) + 1) * 100
    if (remainingExp >= nextLevelExp) {
      remainingExp -= nextLevelExp
      tempLevel++
    } else {
      break
    }
  }
  
  const userLevel = tempLevel
  const currentLevelXp = remainingExp
  const xpTarget = nextLevelExp

  const days = [
    t('dashboard.dayMon'),
    t('dashboard.dayTue'),
    t('dashboard.dayWed'),
    t('dashboard.dayThu'),
    t('dashboard.dayFri'),
    t('dashboard.daySat'),
    t('dashboard.daySun'),
  ]
  const maxHours = Math.max(...weeklyHours, 2)
  const studyBars = weeklyHours.map((hours, i) => ({
    day: days[i],
    h: Math.max((hours / maxHours) * 100, 10),
    label: t('dashboard.hoursShort', { hours: hours.toFixed(1) }),
    active: hours > 0
  }))

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
                  {t('dashboard.focusing')}
                </span>
                <Link to="/focus-room">
                  <Button variant="cta" size="md">
                    {t('dashboard.reenterRoom')}
                  </Button>
                </Link>
                <Button 
                  variant="tonal" 
                  size="md"
                  onClick={handleToggleStudySession}
                  disabled={isStudyLoading}
                >
                  {isStudyLoading ? t('dashboard.processing') : t('dashboard.stopStudy')}
                </Button>
              </>
            ) : (
              <Link to="/focus-room">
                <Button variant="cta" size="md">
                  {t('dashboard.startStudy')}
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
            <p className="text-2xl font-extrabold text-neutral-900">{user ? `${user.streak ?? 0} ${t('dashboard.days')}` : `-- ${t('dashboard.days')}`}</p>
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
                <p className="text-xl font-extrabold text-neutral-900 leading-none">{user ? `${user.exp ?? 0} XP` : '-- XP'}</p>
                <Badge variant="milestone" className="normal-case tracking-normal">{t('dashboard.level', { level: userLevel })}</Badge>
              </div>
            </div>
          </div>
          <div className="w-full mt-1">
            <Progress 
              value={currentLevelXp} 
              max={xpTarget} 
              size="sm" 
              label={<span className="text-[9px] text-neutral-500 font-semibold">{t('dashboard.xpToLevel', { current: currentLevelXp, target: xpTarget, level: userLevel + 1 })}</span>}
              showPercentage
            />
          </div>
        </Card>
        <Card variant="interactive" className={`flex items-center justify-between gap-3 py-3 ${cardCompact}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.plan')}</p>
            <p className="text-2xl font-extrabold text-neutral-900">{user?.planType ?? 'FREE'}</p>
            <Badge variant="focus" className="mt-1 normal-case tracking-normal">{user?.systemRole ?? 'USER'}</Badge>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.walletBalance')}</p>
            <p className="text-2xl font-extrabold text-primary">{walletBalance.toLocaleString()} {t('shop.coins')}</p>
            <Link to="/shop">
              <Badge variant="streak" className="mt-1 normal-case tracking-normal cursor-pointer hover:brightness-95 transition-all">{t('dashboard.topUp')}</Badge>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[24fr_36fr_40fr] gap-4 w-full">
        <Card variant="interactive" className={`${cardCompact}`} heading={t('dashboard.teamsJoined')}>
          {teams.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <p className="text-sm">{t('dashboard.noTeams')}</p>
              <Link to="/teams">
                <Button variant="tonal" size="sm" className="mt-2">{t('dashboard.browseTeams')}</Button>
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
                    <Button variant="secondary" size="sm" className="w-full">{t('dashboard.goToBoard')}</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="interactive" className={`${cardCompact}`}>
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">{t('dashboard.openStudyRooms')}</h3>
            <Link to="/study-rooms">
              <Button variant="ghost" size="sm" className="text-xs shrink-0">{t('dashboard.browseAll')}</Button>
            </Link>
          </div>
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <p className="text-sm">{t('dashboard.noRooms')}</p>
              <Link to="/study-rooms/create">
                <Button variant="tonal" size="sm" className="mt-2">{t('dashboard.createRoom')}</Button>
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
                    <Button variant="secondary" size="sm" className="w-full">{t('dashboard.enter')}</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="featured" className={`${cardCompact}`} heading={t('dashboard.studyTimeWeekly')}>
          <div className="flex justify-between items-center mb-2">
            <Badge variant="primary" className="normal-case tracking-normal">{t('dashboard.weeklyPace')}</Badge>
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
        <Card variant="interactive" className={`${cardCompact}`} heading={t('dashboard.upcomingMeetings')}>
          {schedules.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <p className="text-sm">{t('dashboard.noMeetings')}</p>
              <Link to="/calendar">
                <Button variant="tonal" size="sm" className="mt-2">{t('dashboard.scheduleOne')}</Button>
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
                      {item.location || t('dashboard.online')}
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
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">{t('dashboard.quickLinks')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/ai-support" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">{t('dashboard.aiSupport')}</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">{t('dashboard.chat')}</Badge>
            </Link>
            <Link to="/calendar" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">{t('dashboard.calendar')}</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">{t('dashboard.view')}</Badge>
            </Link>
            <Link to="/shop" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">{t('dashboard.shop')}</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">{t('shop.coins')}</Badge>
            </Link>
            <Link to="/subscription" className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/40 transition-colors text-center">
              <p className="text-sm font-semibold text-neutral-900">{t('dashboard.subscription')}</p>
              <Badge variant="focus" className="normal-case tracking-normal mt-1">{t('dashboard.plans')}</Badge>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-[58fr_42fr] gap-3">
          <Card variant="interactive" className={`${cardCompact}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-[var(--color-border)]">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 break-words">
                {t('dashboard.upcomingTasks')}
              </h3>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="tonal" size="sm" onClick={() => setShowAddTaskModal(true)} className="font-semibold text-xs px-2">
                  {t('dashboard.add')}
                </Button>
                <Link to="/teams">
                  <Button variant="tonal" size="sm" className="text-xs px-2">{t('dashboard.boards')}</Button>
                </Link>
              </div>
            </div>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-neutral-500">
                <p className="text-sm">{t('dashboard.noTasks')}</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[220px] overflow-y-auto">
                {tasks.slice(0, 4).map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-muted)] hover:border-primary/30 transition-all duration-200 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTaskCompletion(item)}
                      className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                        item.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'border-neutral-400 dark:border-neutral-600 hover:bg-primary/10 hover:border-primary'
                      }`}
                      title={item.isPersonal ? t('dashboard.markCompleted') : t('dashboard.teamTaskUpdateHint')}
                    >
                      {item.isCompleted ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <div className="flex gap-1.5">
                          <Badge 
                            variant={item.isPersonal ? 'info' : (item.priority === 'HIGH' ? 'error' : item.priority === 'MEDIUM' ? 'warning' : 'focus')} 
                            className="normal-case tracking-normal text-[9px]"
                          >
                            {item.isPersonal ? t('dashboard.personal') : item.priority}
                          </Badge>
                          {!item.isPersonal && (
                            <Badge variant="outline" className="normal-case tracking-normal text-[9px] border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.15)]">
                              {t('dashboard.team')}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 truncate max-w-[100px]">
                          {item.isPersonal ? t('dashboard.personalTask') : item.teamName}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{item.title}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-error shrink-0 transition-all p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                      title={item.isPersonal ? t('dashboard.deleteTask') : t('dashboard.teamTaskDeleteHint')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card variant="interactive" className={`${cardCompact}`} heading={t('dashboard.personalNotes')}>
            <Textarea
              placeholder={t('dashboard.notePlaceholder')}
              className="!min-h-[40px] !py-1.5 resize-y text-sm"
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
              <div className="mt-3 border-t border-[var(--color-border)] pt-3 max-h-[105px] overflow-y-auto space-y-1.5">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t('dashboard.savedNotesTitle')}</p>
                {notes.slice().sort((a, b) => b.noteId - a.noteId).slice(0, 3).map((n) => (
                  <div key={n.noteId} className="flex justify-between items-start gap-2 p-2 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">
                    <p
                      onClick={() => setSelectedNote(n)}
                      className="text-neutral-800 dark:text-neutral-200 truncate flex-1 cursor-pointer hover:underline"
                      title={t('dashboard.clickToView')}
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
              <span className="font-extrabold text-sm">🎉 {t('dashboard.sessionComplete')}</span>
              <span className="text-xs">{t('dashboard.sessionExpEarned', { exp: sessionExpEarned })}</span>
            </div>
          </Toast>
        </div>
      )}
      {showAddTaskModal && (
        <Modal open={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} title={t('dashboard.createPersonalTask')}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">{t('dashboard.taskName')}</label>
              <input
                type="text"
                placeholder={t('dashboard.taskPlaceholder')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">{t('dashboard.dueDateOptional')}</label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-[var(--color-border)]">
              <Button variant="secondary" size="sm" onClick={() => setShowAddTaskModal(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" size="sm" onClick={handleCreateTask} disabled={addingTask || !newTaskTitle.trim()}>
                {addingTask ? t('dashboard.creating') : t('dashboard.createTask')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
