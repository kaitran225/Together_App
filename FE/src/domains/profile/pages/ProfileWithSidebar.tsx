import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MeResponse } from '../../../types/dto'
import { authApi, workflowApi, getStoredToken } from '../../../api/client'
import { getFakeMeResponse, MONTHLY_HOURS, HIGHLIGHT_MONTH } from '../../../mocks'
import { Button, Card, Progress, IconButton, Input, Modal } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ProfileWithSidebar() {
  const { logout, updateOwnProfile, refreshProfile } = useAuth()
  const [user, setUser] = useState<MeResponse | null>(null)
  const [notesList, setNotesList] = useState<any[]>([])
  const [tasksList, setTasksList] = useState<any[]>([])
  const [quizzesList, setQuizzesList] = useState<any[]>([])
  const [schedulesList, setSchedulesList] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null)

  const getWeekDates = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const numDay = now.getDate()
    
    const start = new Date(now)
    start.setDate(numDay - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    start.setHours(0, 0, 0, 0)
    
    const week = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      week.push(d)
    }
    return week
  }
  const weekDates = getWeekDates()

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      authApi.me(token).then((res) => {
        if (res.success && res.data) {
          setUser(res.data)
          workflowApi.getPublicAchievements(res.data.userSso).then((achRes) => {
            if (achRes.success && achRes.data) {
              setAchievements(achRes.data)
            }
          }).catch(() => {})
        }
      })
    } else {
      const fake = getFakeMeResponse()
      if (fake.success && fake.data) {
        setUser(fake.data)
        workflowApi.getPublicAchievements(fake.data.userSso).then((achRes) => {
          if (achRes.success && achRes.data) {
            setAchievements(achRes.data)
          }
        }).catch(() => {})
      }
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

    workflowApi.getQuizSets().then((res) => {
      if (res.success && res.data) {
        setQuizzesList(res.data)
      }
    }).catch(() => {})

    workflowApi.getSchedules().then((res) => {
      if (res.success && res.data) {
        setSchedulesList(res.data)
      }
    }).catch(() => {})
  }, [])

  const [showAddSkillInput, setShowAddSkillInput] = useState(false)
  const [newSkillText, setNewSkillText] = useState('')
  const [showAddGoalInput, setShowAddGoalInput] = useState(false)
  const [newGoalText, setNewGoalText] = useState('')
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const handleCopyLink = () => {
    const link = `${window.location.origin}/profile/${user?.userSso || 'guest'}`
    navigator.clipboard.writeText(link)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const handleExportPDF = async () => {
    setIsShareModalOpen(false)
    const element = document.getElementById('pdf-export-content')
    if (!element) return
    
    element.style.display = 'block'
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${user?.fullName || 'Profile'}_CV.pdf`)
    } catch (e) {
      console.error('Failed to generate PDF', e)
    } finally {
      element.style.display = 'none'
    }
  }
  const [editForm, setEditForm] = useState({ fullName: '', avatarUrl: '', skills: '', learningGoals: '' })
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenEditModal = () => {
    setEditForm({
      fullName: user?.fullName || '',
      avatarUrl: user?.avatarUrl || '',
      skills: user?.skills?.join(', ') || '',
      learningGoals: user?.learningGoals?.join(', ') || ''
    })
    setEditError('')
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      setEditError('Full name is required')
      return
    }
    setIsSaving(true)
    setEditError('')
    
    const skillsArray = editForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
    const goalsArray = editForm.learningGoals.split(',').map(s => s.trim()).filter(s => s.length > 0)
    
    const res = await updateOwnProfile({
      fullName: editForm.fullName,
      email: user?.email || '',
      avatarUrl: editForm.avatarUrl,
      skills: skillsArray,
      learningGoals: goalsArray
    })
    setIsSaving(false)
    if (res.ok) {
      setIsEditModalOpen(false)
      await refreshProfile()
      // Tải lại authApi.me để lấy profile mới nhất cho component này
      const token = getStoredToken()
      if (token) {
        authApi.me(token).then(r => {
          if (r.success && r.data) setUser(r.data)
        })
      }
    } else {
      setEditError(res.error || 'Lỗi khi cập nhật profile')
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (e.g. limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setEditError('Image size must be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setEditForm(prev => ({ ...prev, avatarUrl: base64String }));
      setEditError('');
    };
    reader.onerror = () => {
      setEditError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }

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
        refreshProfile()
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
        refreshProfile()
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
        refreshProfile()
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
        refreshProfile()
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
  const levelProgress = xpTarget > 0 ? Math.min((currentLevelXp / xpTarget) * 100, 100) : 0

  const completedTasks = tasksList.filter(t => t.isCompleted)
  const levelProgressPercent = levelProgress

  const achievementsList: any[] = []

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Profile header - full width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="w-20 h-20 rounded-full bg-neutral-200 border-2 border-neutral-300 flex items-center justify-center text-neutral-500 overflow-hidden" aria-hidden>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
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
              onClick={handleOpenEditModal}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">{displayName}</h1>
            <p className="text-sm text-neutral-600">{user?.planType ?? 'FREE'} · Level {userLevel}</p>
            <Button variant="secondary" size="sm" className="mt-2 border-2 border-primary/30 text-neutral-900 hover:bg-accent-muted" onClick={() => setIsShareModalOpen(true)}>
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
            <Progress value={currentLevelXp} max={xpTarget} label={<><span>{currentLevelXp.toLocaleString()} / {xpTarget.toLocaleString()} XP to Level {userLevel + 1}</span><span>{Math.round(levelProgress)}%</span></>} />
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
              {achievements.map((ach) => {
                const unlocked = ach.isUnlocked;
                return (
                  <div 
                    key={ach.achievementId} 
                    onClick={() => setSelectedAchievement(ach)}
                    title={`${ach.displayName}: ${ach.description} (${unlocked ? 'Đã mở khóa' : 'Chưa mở khóa'})`}
                    className={`w-12 h-12 rounded-full flex items-center justify-center relative cursor-pointer hover:scale-110 active:scale-95 transition-all p-1.5 border-2 ${unlocked ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-neutral-50 border-dashed border-neutral-300 opacity-50'}`}
                  >
                    <img 
                      src={ach.iconUrl || 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png'} 
                      alt={ach.displayName} 
                      className={`w-full h-full object-contain ${unlocked ? '' : 'grayscale'}`}
                    />
                    {!unlocked && (
                      <div className="absolute inset-0 bg-neutral-900/10 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Đã mở khóa: {achievements.filter(a => a.isUnlocked).length} / {achievements.length} thành tựu
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
              {weekDates.map((date, i) => {
                const daySchedules = schedulesList.filter(s => {
                  if (!s.startTime) return false
                  const sDate = new Date(s.startTime)
                  return sDate.getFullYear() === date.getFullYear() && 
                         sDate.getMonth() === date.getMonth() && 
                         sDate.getDate() === date.getDate()
                })
                const toShow = daySchedules.slice(0, 2)
                const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth()

                return (
                  <div key={i} className={`p-1.5 rounded-lg border ${isToday ? 'border-primary bg-primary/5' : 'border-neutral-200 bg-neutral-50/50'} min-h-[40px] flex flex-col items-center overflow-hidden`}>
                    <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-neutral-900'}`}>{date.getDate()}</span>
                    {toShow.map((s, idx) => {
                      const timeStr = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                      return (
                        <p key={idx} className="text-[8px] text-neutral-700 dark:text-accent mt-0.5 truncate w-full" title={s.title}>
                          {s.isAllDay ? s.title : `${timeStr} ${s.title}`}
                        </p>
                      )
                    })}
                    {daySchedules.length > 2 && <p className="text-[8px] text-neutral-500 mt-0.5 w-full">+{daySchedules.length - 2}</p>}
                  </div>
                )
              })}
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
          <Card className="p-5 border-2 border-neutral-200" heading="My Quizzes">
            <ul className="space-y-2">
              {quizzesList.slice(0, 5).map((q) => (
                <li key={q.quizId} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-neutral-100 last:border-0">
                  <span className="text-neutral-900 truncate font-medium">{q.title || `Quiz #${q.quizId}`}</span>
                  <span className="text-neutral-500 text-xs shrink-0">{q.questionCount} Qs</span>
                  <span className="font-bold text-neutral-900 w-8 text-right shrink-0">{q.difficulty?.charAt(0).toUpperCase() || 'M'}</span>
                </li>
              ))}
              {quizzesList.length === 0 && (
                <li className="text-neutral-500 text-sm italic">You haven't generated any quizzes yet.</li>
              )}
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
              <li className="flex justify-between"><span className="text-neutral-600">Total study time</span><strong className="text-neutral-900">{Math.round(totalExp / 60)}h</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Completed tasks</span><strong className="text-neutral-900">{completedTasks.length}</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Notes created</span><strong className="text-neutral-900">{notesList.length}</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Streak</span><strong className="text-neutral-900">{user?.streak ?? 0} days</strong></li>
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
      
      {/* Edit Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => !isSaving && setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
            disabled={isSaving}
          />
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-sm font-semibold text-neutral-700">Avatar</span>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center overflow-hidden shrink-0">
                {editForm.avatarUrl ? (
                  <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-block cursor-pointer bg-[var(--color-cream-100)] border border-[var(--color-border)] hover:bg-[var(--color-cream-200)] text-sm font-medium px-4 py-2 rounded-[var(--radius-button)] transition-colors active:scale-95 disabled:opacity-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isSaving}
                  />
                  Choose Image
                </label>
                <p className="text-xs text-neutral-500 mt-1">Recommended size: 256x256 (Max 2MB)</p>
              </div>
            </div>
            
            <details className="mt-2 text-sm text-neutral-500">
              <summary className="cursor-pointer font-medium hover:text-neutral-700">Advanced: Use Avatar URL</summary>
              <div className="mt-2">
                <Input
                  label=""
                  placeholder="https://example.com/avatar.png"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  disabled={isSaving}
                />
              </div>
            </details>
          </div>
          <Input
            label="Skills (comma separated)"
            placeholder="Java, React, SQL..."
            value={editForm.skills}
            onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
            disabled={isSaving}
          />
          <Input
            label="Learning Goals (comma separated)"
            placeholder="Learn Spring Boot, Read 10 books..."
            value={editForm.learningGoals}
            onChange={(e) => setEditForm(prev => ({ ...prev, learningGoals: e.target.value }))}
            disabled={isSaving}
          />
          {editError && <p className="text-sm text-red-500 font-medium">{editError}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Profile Modal */}
      <Modal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Profile"
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-neutral-600">Choose how you want to share your profile with others.</p>
          <div className="flex flex-col gap-3">
            <Button variant="secondary" className="justify-center gap-2 py-3" onClick={handleCopyLink}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Profile Link
            </Button>
            <Button variant="primary" className="justify-center gap-2 py-3" onClick={handleExportPDF}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as PDF
            </Button>
          </div>
          {shareCopied && <p className="text-sm text-green-600 text-center font-medium mt-2">Link copied to clipboard!</p>}
        </div>
      </Modal>

      {/* Hidden PDF Export Template */}
      <div id="pdf-export-content" className="hidden bg-white w-[800px] p-10 text-neutral-900 absolute top-0 left-0 -z-50" style={{ fontFamily: 'sans-serif' }}>
        <div className="flex items-center gap-6 mb-10 border-b pb-6">
          <div className="w-24 h-24 rounded-full bg-neutral-200 overflow-hidden shrink-0">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-[#6C5CE7] text-white">{user?.fullName?.charAt(0) || 'U'}</div>}
          </div>
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tight">{user?.fullName || 'User'}</h1>
            <p className="text-lg text-neutral-600 mt-1">{user?.planType ?? 'FREE'} · Level {userLevel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4 uppercase text-[#6C5CE7] border-b pb-2 border-neutral-200">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user?.skills?.map(s => (
                <span key={s} className="px-3 py-1 bg-neutral-100 rounded-full text-sm font-medium">{s}</span>
              ))}
              {(!user?.skills || user.skills.length === 0) && <p className="text-neutral-500 italic">No skills added yet.</p>}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 uppercase text-[#6C5CE7] border-b pb-2 border-neutral-200">Statistics</h2>
            <ul className="space-y-3">
              <li className="flex justify-between"><span className="text-neutral-600">Total study time</span><strong>{Math.round(totalExp / 60)}h</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Completed tasks</span><strong>{completedTasks.length}</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Notes created</span><strong>{notesList.length}</strong></li>
              <li className="flex justify-between"><span className="text-neutral-600">Streak</span><strong>{user?.streak ?? 0} days</strong></li>
            </ul>
          </div>

          <div className="col-span-2 mt-4">
            <h2 className="text-xl font-bold mb-4 uppercase text-[#6C5CE7] border-b pb-2 border-neutral-200">Learning Goals</h2>
            <ul className="list-disc pl-5 space-y-2">
              {user?.learningGoals?.map(g => (
                <li key={g} className="text-neutral-700">{g}</li>
              ))}
              {(!user?.learningGoals || user.learningGoals.length === 0) && <p className="text-neutral-500 italic">No learning goals added yet.</p>}
            </ul>
          </div>
          
          <div className="col-span-2 mt-4">
            <h2 className="text-xl font-bold mb-4 uppercase text-[#6C5CE7] border-b pb-2 border-neutral-200">Achievements</h2>
            <div className="grid grid-cols-3 gap-4">
              {achievementsList.filter(a => a.unlocked).map(a => (
                <div key={a.id} className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 flex items-center gap-3">
                  <span className="text-2xl">{a.icon}</span>
                  <div>
                    <p className="font-bold text-sm text-neutral-900">{a.name}</p>
                    <p className="text-xs text-neutral-500">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {selectedAchievement && (
        <Modal
          open={!!selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          title="Chi Tiết Thành Tựu"
          size="max-w-md"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center p-2 border-2 ${
                selectedAchievement.isUnlocked
                  ? 'bg-amber-50 border-amber-300 shadow-md'
                  : 'bg-neutral-50 border-dashed border-neutral-350 opacity-60'
              }`}
            >
              <img
                src={selectedAchievement.iconUrl || 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png'}
                alt={selectedAchievement.displayName}
                className={`w-full h-full object-contain ${
                  selectedAchievement.isUnlocked ? '' : 'grayscale'
                }`}
              />
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-neutral-800">{selectedAchievement.displayName}</h3>
              <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider mt-1">
                Yêu cầu: {selectedAchievement.requirementType}
              </p>
            </div>

            <p className="text-sm text-neutral-600 px-2 leading-relaxed">
              {selectedAchievement.description}
            </p>

            <div className="w-full bg-neutral-50 rounded-xl p-3 border border-neutral-100 mt-2 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-semibold">Mục tiêu</span>
                <span className="text-neutral-800 font-bold">
                  {selectedAchievement.requirementValue} {selectedAchievement.requirementType === 'STREAK' ? 'Ngày liên tiếp' : selectedAchievement.requirementType === 'LEVEL' ? 'Cấp độ' : 'EXP'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-2">
                <span className="text-neutral-500 font-semibold">Phần thưởng</span>
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  +{selectedAchievement.expReward} EXP · +{selectedAchievement.coinReward} xu
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-2">
                <span className="text-neutral-500 font-semibold">Trạng thái</span>
                {selectedAchievement.isUnlocked ? (
                  <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">
                    Đã mở khóa
                  </span>
                ) : (
                  <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    Chưa đạt được
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="mt-4 w-full py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}