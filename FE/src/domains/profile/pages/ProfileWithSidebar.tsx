import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MeResponse } from '../../../types/dto'
import { authApi, workflowApi, getStoredToken } from '../../../api/client'
import { getFakeMeResponse, MONTHLY_HOURS, HIGHLIGHT_MONTH, QUIZZES } from '../../../mocks'
import { Button, Card, Progress, IconButton, Input } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'

export default function ProfileWithSidebar() {
  const { logout } = useAuth()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [notesList, setNotesList] = useState<any[]>([])
  const [tasksList, setTasksList] = useState<any[]>([])

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

    workflowApi.getNotes().then((res) => {
      if (res.success && res.data) {
        setNotesList(res.data)
      }
    }).catch(() => {})

    workflowApi.getFocusRoomTasks().then((res) => {
      if (res.success && res.data) {
        setTasksList(res.data)
      }
    }).catch(() => {})
  }, [])

  const [showAddSkillInput, setShowAddSkillInput] = useState(false)
  const [newSkillText, setNewSkillText] = useState('')
  const [showAddGoalInput, setShowAddGoalInput] = useState(false)
  const [newGoalText, setNewGoalText] = useState('')

  const handleAddSkill = async () => {
    if (!newSkillText.trim() || !user) return
    const token = getStoredToken()
    if (!token) return
    const currentSkills = user.skills || []
    if (currentSkills.includes(newSkillText.trim())) return
    const updatedSkills = [...currentSkills, newSkillText.trim()]
    try {
      const res = await authApi.updateProfile(token, undefined, undefined, updatedSkills, undefined)
      if (res.success && res.data) {
        setUser(res.data)
        setNewSkillText('')
        setShowAddSkillInput(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!user) return
    const token = getStoredToken()
    if (!token) return
    const currentSkills = user.skills || []
    const updatedSkills = currentSkills.filter(s => s !== skillToRemove)
    try {
      const res = await authApi.updateProfile(token, undefined, undefined, updatedSkills, undefined)
      if (res.success && res.data) {
        setUser(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoalText.trim() || !user) return
    const token = getStoredToken()
    if (!token) return
    const currentGoals = user.learningGoals || []
    if (currentGoals.includes(newGoalText.trim())) return
    const updatedGoals = [...currentGoals, newGoalText.trim()]
    try {
      const res = await authApi.updateProfile(token, undefined, undefined, undefined, updatedGoals)
      if (res.success && res.data) {
        setUser(res.data)
        setNewGoalText('')
        setShowAddGoalInput(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRemoveGoal = async (goalToRemove: string) => {
    if (!user) return
    const token = getStoredToken()
    if (!token) return
    const currentGoals = user.learningGoals || []
    const updatedGoals = currentGoals.filter(g => g !== goalToRemove)
    try {
      const res = await authApi.updateProfile(token, undefined, undefined, undefined, updatedGoals)
      if (res.success && res.data) {
        setUser(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await workflowApi.deleteNote(noteId)
      if (res.success) {
        setNotesList((prev) => prev.filter((n) => n.noteId !== noteId))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User'
  const xpCurrent = (user as any)?.exp ?? 0
  const userLevel = (user as any)?.level ?? 1
  const xpTarget = userLevel * 100
  const levelProgress = xpTarget > 0 ? Math.min((xpCurrent / xpTarget) * 100, 100) : 0

  const completedTasks = tasksList.filter(t => t.isCompleted)
  const levelProgressPercent = xpCurrent % 100

  const achievementsList = [
    { id: 'newbie', name: 'Tân binh hiếu học', desc: 'Đạt cấp độ 1+', icon: '🎓', unlocked: userLevel >= 1 },
    { id: 'streak_3', name: 'Học tập không ngừng', desc: 'Đạt chuỗi học tập 3 ngày', icon: '🔥', unlocked: ((user as any)?.streak ?? 0) >= 3 },
    { id: 'task_5', name: 'Chuyên gia tập trung', desc: 'Hoàn thành 5 nhiệm vụ', icon: '✅', unlocked: completedTasks.length >= 5 },
    { id: 'note_5', name: 'Nhà ghi chép', desc: 'Tạo 5 ghi chú nhanh', icon: '📝', unlocked: notesList.length >= 5 },
    { id: 'streak_7', name: 'Kỷ lục gia', desc: 'Chuỗi kỷ lục 7 ngày', icon: '🏆', unlocked: ((user as any)?.longestStreak ?? 0) >= 7 },
  ]

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
            <p className="text-sm text-neutral-600">{(user as any)?.planType ?? 'FREE'} · Level {userLevel}</p>
            <Button variant="secondary" size="sm" className="mt-2 border-2 border-primary/30 text-neutral-900 hover:bg-accent-muted">
              Share profile
            </Button>
          </div>
        </div>
      </div>

      {/* 3 columns: 40% | 40% | 20% */}
      <div className="grid grid-cols-1 lg:grid-cols-[40fr_40fr_20fr] gap-6 items-start">
        {/* Column 1 (40%) */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="p-5 border-2 border-neutral-200" heading="Level progress">
            <Progress value={xpCurrent} max={xpTarget} label={<><span>{xpCurrent.toLocaleString()} / {xpTarget.toLocaleString()} XP to Level {userLevel + 1}</span><span>{Math.round(levelProgress)}%</span></>} />
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Completed work">
            {completedTasks.length === 0 ? (
              <p className="text-xs text-neutral-500">Chưa có nhiệm vụ nào hoàn thành gần đây.</p>
            ) : (
              <ul className="space-y-1.5">
                {completedTasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-neutral-900 truncate font-medium">{t.title}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success/20 text-neutral-800 dark:text-success">
                      Completed
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/dashboard" className="inline-block mt-3 text-xs font-semibold text-neutral-700 hover:text-neutral-900">View full →</Link>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Achievements">
            <div className="flex flex-wrap gap-3">
              {achievementsList.map((ach) => (
                <div 
                  key={ach.id} 
                  title={`${ach.name}: ${ach.desc} (${ach.unlocked ? 'Đã mở khóa' : 'Chưa mở khóa'})`}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg relative cursor-default transition-all ${ach.unlocked ? 'bg-primary text-[var(--color-cream-300)]' : 'bg-neutral-100 text-neutral-400 border-2 border-dashed border-neutral-300'}`}
                >
                  <span>{ach.icon}</span>
                  {!ach.unlocked && (
                    <div className="absolute inset-0 bg-neutral-900/5 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Đã mở khóa: {achievementsList.filter(a => a.unlocked).length} / {achievementsList.length} thành tựu
            </p>
          </Card>

          <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-white shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 p-6">
  <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
  <div className="relative z-10">
    {/* Header với icon + badge */}
    <div className="flex items-center gap-3 mb-5">
      <div className="rounded-full bg-primary/15 p-2 text-primary shadow-sm">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-primary tracking-tight">Learning Goals</h3>
      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
        {user?.learningGoals?.length || 0}
      </span>
    </div>

    {/* Danh sách mục tiêu – dạng cột dài */}
    <div className="flex flex-col gap-2 mb-4">
      {(!user?.learningGoals || user.learningGoals.length === 0) ? (
        <p className="text-sm text-neutral-500 italic py-2">Chưa có mục tiêu học tập nào được đặt.</p>
      ) : (
        user.learningGoals.map((g) => (
          <span 
            key={g} 
            className="group relative px-5 py-3 rounded-xl border border-primary/20 bg-white/80 backdrop-blur-sm shadow-sm text-neutral-800 text-sm font-medium flex items-center gap-3 hover:border-primary/50 hover:shadow-md transition-all duration-200 w-full"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="flex-1">{g}</span> {/* Bỏ truncate nếu muốn xuống dòng */}
            <button 
              type="button" 
              className="text-neutral-400 hover:text-red-500 hover:scale-110 transition-all font-bold text-base ml-auto"
              onClick={() => handleRemoveGoal(g)}
              title="Xóa mục tiêu"
            >
              ×
            </button>
          </span>
        ))
      )}
    </div>

    {/* Thêm mục tiêu mới (giữ nguyên) */}
    {showAddGoalInput ? (
      <div className="flex items-center gap-3 mt-2">
        <Input 
          placeholder="Mục tiêu học tập mới..." 
          value={newGoalText} 
          onChange={(e) => setNewGoalText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal() }}
          className="bg-white/90 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <Button size="sm" onClick={handleAddGoal} className="bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow transition-all px-5">Lưu</Button>
        <Button size="sm" variant="ghost" onClick={() => setShowAddGoalInput(false)} className="text-neutral-500 hover:text-neutral-700">Hủy</Button>
      </div>
    ) : (
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={() => setShowAddGoalInput(true)}
        className="mt-1 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 hover:shadow-sm transition-all group"
      >
        <svg className="mr-1.5 h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Thêm mục tiêu
      </Button>
    )}
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
            {notesList.length === 0 ? (
              <p className="text-xs text-neutral-500">No notes found.</p>
            ) : (
              <ul className="space-y-2">
                {notesList.slice(0, 4).map((n) => (
                  <li key={n.noteId} className="group flex items-center gap-2">
                    <div className="flex-1 min-w-0 py-2 px-3 rounded-lg border-2 border-neutral-200 text-sm font-medium text-neutral-900 truncate">
                      {n.content}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteNote(n.noteId)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Xóa ghi chú"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/dashboard" className="inline-block mt-3 text-xs font-semibold text-neutral-700 hover:text-neutral-900">View full →</Link>
          </Card>
        </div>

        {/* Column 3 (20%) */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="p-5 border-2 border-neutral-200" heading="Skills">
            <div className="flex flex-wrap gap-2 mb-3">
              {(!user?.skills || user.skills.length === 0) ? (
                <p className="text-xs text-neutral-500">Chưa có kỹ năng nào.</p>
              ) : (
                user.skills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full bg-accent-muted text-neutral-800 dark:text-primary text-xs font-medium flex items-center gap-1.5">
                    {s}
                    <button type="button" className="text-neutral-500 hover:text-neutral-700 font-bold" onClick={() => handleRemoveSkill(s)}>×</button>
                  </span>
                ))
              )}
            </div>
            {showAddSkillInput ? (
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  placeholder="Kỹ năng mới..." 
                  value={newSkillText} 
                  onChange={(e) => setNewSkillText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill() }}
                />
                <Button size="sm" onClick={handleAddSkill}>Lưu</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowAddSkillInput(false)}>Hủy</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowAddSkillInput(true)}>+ Add skill</Button>
            )}
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Statistics">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-neutral-600">Total study time</span><strong className="text-neutral-900">{Math.round(xpCurrent / 60)}h</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Completed tasks</span><strong className="text-neutral-900">{completedTasks.length}</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Notes created</span><strong className="text-neutral-900">{notesList.length}</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Streak</span><strong className="text-neutral-900">{((user as any)?.streak ?? 0)} days</strong></li>
            </ul>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Account">
            {user && (
              <p className="text-xs text-neutral-900 mb-2"><strong className="break-all">{user.email}</strong>{user.fullName != null && ` · ${user.fullName}`}</p>
            )}
            <Button variant="secondary" size="sm" className="w-full" onClick={logout}>Logout</Button>
          </Card>
          <Card className="p-5 border-2 border-neutral-200" heading="Next reward">
            <div className="mb-2">
              <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${levelProgressPercent}%` }} />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">{levelProgressPercent}% · Level {userLevel + 1}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}