import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, SegmentedControl, Modal, Input, Checkbox } from '../../../components/common'
import { TaskEditSidebar, type TaskForEdit } from '../../../components/TaskEditSidebar'
import {
  TEAM_TABS,
  TEAM_MEMBERS,
  SCRUM_COLUMNS_INIT,
  type TabId,
} from '../../../mocks'
import { workflowApi, authApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'

export default function BoardPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as TabId) || 'management'
  const setTab = (id: TabId) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', id)
    setSearchParams(nextParams)
  }

  const teamIdStr = searchParams.get('teamId')
  const teamId = teamIdStr ? Number(teamIdStr) : null

  const [teamName, setTeamName] = useState('Loading Team...')
  const [inviteCode, setInviteCode] = useState('')
  const [teamObj, setTeamObj] = useState<any | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  const isOwner = members.some((m) => m.id === user?.userSso && m.role === 'OWNER')

  const loadTeamData = () => {
    if (!teamId) return
    
    workflowApi.getTeamDetail(teamId)
      .then(async (res) => {
        if (res.success && res.data) {
          const detail = res.data
          setTeamObj(detail.team)
          setTeamName(detail.team.name)
          setInviteCode(detail.team.inviteCode)
          if (detail.members && detail.members.length > 0) {
            // Batch lookup user info from auth service
            const ssoList = detail.members.map((m: any) => m.userSso)
            let userMap: Record<string, { fullName?: string; email?: string; avatarUrl?: string }> = {}
            try {
              const lookupRes = await authApi.lookupUsers(ssoList)
              if (lookupRes.success && lookupRes.data) {
                lookupRes.data.forEach((u: any) => {
                  userMap[u.userSso] = { fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl }
                })
              }
            } catch (err) {
              console.warn('User lookup failed, falling back to nickname/userSso', err)
            }

            setMembers(detail.members.map((m: any) => {
              const userInfo = userMap[m.userSso]
              const displayName = m.nickname || userInfo?.fullName || userInfo?.email || m.userSso
              return {
                id: m.userSso,
                name: displayName,
                role: m.role,
                avatarUrl: m.avatarUrl || userInfo?.avatarUrl,
                skills: m.role === 'OWNER' ? ['Product', 'Strategy'] : ['Contributor'],
                code: displayName.slice(0, 2).toUpperCase()
              }
            }))
          }
        }
      })
      .catch((err) => {
        console.error(err)
      })

    // Get projects
    workflowApi.getProjects(teamId)
      .then((res) => {
        if (res.success && res.data) {
          setProjects(res.data)
          if (res.data.length > 0) {
            setSelectedProjectId(res.data[0].projectId)
          }
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  useEffect(() => {
    if (teamId) {
      loadTeamData()
    } else {
      setTeamName('Mock Team')
      setMembers(TEAM_MEMBERS)
    }
  }, [teamId])

  const handleCreateProject = async () => {
    if (!teamId || !newProjectName.trim()) return
    try {
      const res = await workflowApi.createProject(teamId, newProjectName.trim(), newProjectDesc.trim())
      if (res.success) {
        setCreateProjectOpen(false)
        setNewProjectName('')
        setNewProjectDesc('')
        loadTeamData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {teamId && (
        <div className="flex items-center justify-between gap-3 mb-4 bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-xl">
          <div className="flex items-center gap-3">
            {teamObj?.avatarUrl ? (
              <img src={teamObj.avatarUrl} alt={teamName} className="w-10 h-10 rounded-xl object-cover border border-[var(--color-border)]" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {teamName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-neutral-900">{teamName}</h2>
                {inviteCode && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-semibold bg-[var(--color-charcoal)] border border-[var(--color-border)] rounded-md text-neutral-850">
                    Code: {inviteCode}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode);
                        alert('Copied invite code: ' + inviteCode);
                      }}
                      title="Copy Code"
                      className="text-neutral-500 hover:text-neutral-950 font-sans ml-0.5 text-[10px]"
                    >
                      📋
                    </button>
                  </span>
                )}
              </div>
              {selectedProjectId ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-500">Project:</span>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className="px-2 py-1 text-xs border border-[var(--color-border)] rounded bg-white focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.projectId} value={p.projectId}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-neutral-500">No projects created yet.</span>
              )}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreateProjectOpen(true)}>
            + New Project
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2 mb-2">
        <SegmentedControl
          value={tab}
          onChange={(next) => setTab(next as TabId)}
          options={TEAM_TABS.map((t) => ({ value: t.id, label: t.label }))}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'management' && (
          <TeamManagementContent
            members={members}
            teamId={teamId}
            teamObj={teamObj}
            onTeamUpdated={loadTeamData}
          />
        )}
        {tab === 'scrum' && (
          <ScrumBoardContent
            projectId={selectedProjectId}
            teamMembers={members}
            projectName={projects.find(p => p.projectId === selectedProjectId)?.name || 'Project Board'}
            isOwner={isOwner}
            currentUserSso={user?.userSso}
          />
        )}
      </div>

      {/* Create Project Modal */}
      <Modal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} size="max-w-md" title="Create New Project">
        <Card className="p-5 w-full">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Create New Project</h3>
          <div className="flex flex-col gap-4 mb-4">
            <Input
              label="Project Name"
              placeholder="e.g. Sprint Phase 1"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="What is this project about?"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateProjectOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreateProject}>Create</Button>
          </div>
        </Card>
      </Modal>
    </div>
  )
}

function TeamManagementContent({
  members,
  teamId,
  teamObj,
  onTeamUpdated,
}: {
  members: any[]
  teamId: number | null
  teamObj: any | null
  onTeamUpdated: () => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isOwner = members.some((m) => m.id === user?.userSso && m.role === 'OWNER')

  const [createMeetingOpen, setCreateMeetingOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingAgenda, setMeetingAgenda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeMeeting, setActiveMeeting] = useState<any>(null)

  // Edit Team state
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [editMaxMembers, setEditMaxMembers] = useState(20)

  useEffect(() => {
    if (teamObj) {
      setEditName(teamObj.name || '')
      setEditDesc(teamObj.description || '')
      setEditAvatar(teamObj.avatarUrl || '')
      setEditIsPrivate(teamObj.isPrivate || false)
      setEditMaxMembers(teamObj.maxMembers || 20)
    }
  }, [teamObj, editOpen])

  useEffect(() => {
    if (teamId) {
      workflowApi.getActiveMeeting(teamId).then(res => {
        if (res.success && res.data) {
          setActiveMeeting(res.data)
        } else {
          setActiveMeeting(null)
        }
      }).catch(console.error)
    }
  }, [teamId])

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId) return
    if (!meetingTitle.trim()) {
      setError('Vui lòng nhập tiêu đề cuộc họp.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await workflowApi.createMeeting(
        teamId,
        meetingTitle.trim(),
        undefined,
        meetingAgenda.trim() || undefined
      )
      if (res.success && res.data) {
        await workflowApi.joinMeeting(res.data.meetingId)
        navigate(`/meetings/room?meetingId=${res.data.meetingId}`)
      } else {
        setError(res.message || 'Không thể tạo cuộc họp.')
      }
    } catch (err) {
      console.error(err)
      setError('Lỗi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!teamId || !editName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await workflowApi.updateTeam(teamId, {
        name: editName.trim(),
        description: editDesc.trim(),
        avatarUrl: editAvatar.trim(),
        isPrivate: editIsPrivate,
        maxMembers: editMaxMembers
      })
      if (res.success) {
        setEditOpen(false)
        onTeamUpdated()
      } else {
        setError(res.message || 'Không thể cập nhật thông tin nhóm.')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  const handleKickMember = async (memberSso: string) => {
    if (!teamId) return
    if (!window.confirm('Bạn có chắc chắn muốn mời thành viên này rời khỏi nhóm?')) return
    setLoading(true)
    setError('')
    try {
      const res = await workflowApi.removeTeamMember(teamId, memberSso)
      if (res.success) {
        onTeamUpdated()
      } else {
        setError(res.message || 'Không thể xóa thành viên.')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          {teamObj?.avatarUrl ? (
            <img src={teamObj.avatarUrl} alt={teamObj.name} className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)]" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
              {teamObj?.name?.slice(0, 1).toUpperCase() || 'T'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Team management</h1>
            {teamObj?.description && <p className="text-xs text-neutral-500 mt-0.5">{teamObj.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} className="flex items-center gap-1 font-bold">
              ⚙️ Chỉnh sửa nhóm
            </Button>
          )}
          {teamId && (
            activeMeeting ? (
              <Button variant="primary" size="sm" onClick={() => navigate(`/meetings/room?meetingId=${activeMeeting.meetingId}`)} className="flex items-center gap-1.5 font-bold shadow-none !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
                🟢 Tham gia ngay
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setCreateMeetingOpen(true)} className="flex items-center gap-1.5 font-bold shadow-none">
                🎥 Tạo cuộc họp mới
              </Button>
            )
          )}
        </div>
      </div>
      
      <Card heading="Members" className="border border-[var(--color-border)] shadow-none">
        {error && <div className="p-3 mb-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">{error}</div>}
        <ul className="space-y-0">
          {members.map((m, i) => (
            <li
              key={m.id || i}
              className={`flex justify-between items-center gap-4 py-3 ${i < members.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-neutral-900 font-medium">
                  {m.name}
                  {m.role && <span className="text-neutral-500 font-normal"> ({m.role})</span>}
                </span>
                {m.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.skills.map((skill: string, j: number) => (
                      <span
                        key={j}
                        className="inline-block px-2.5 py-0.5 rounded-md bg-[var(--color-charcoal)] border border-[var(--color-border)] text-xs font-medium text-neutral-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isOwner && m.id !== user?.userSso && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleKickMember(m.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-bold"
                  disabled={loading}
                >
                  Kick
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={createMeetingOpen} onClose={() => setCreateMeetingOpen(false)} size="max-w-md" title="Tạo cuộc họp mới">
        <Card className="p-5 w-full border-0 bg-transparent shadow-none">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Tạo cuộc họp nhóm</h3>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
            <Input
              label="Tiêu đề cuộc họp"
              placeholder="e.g. Họp thảo luận nhóm"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              required
            />
            <Input
              label="Chương trình họp (Agenda)"
              placeholder="e.g. Báo cáo tiến trình, phân chia task"
              value={meetingAgenda}
              onChange={(e) => setMeetingAgenda(e.target.value)}
            />
            <div className="flex gap-3 mt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateMeetingOpen(false)}>Hủy</Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Bắt đầu ngay'}
              </Button>
            </div>
          </form>
        </Card>
      </Modal>

      {/* Edit Team Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} size="max-w-md" title="Chỉnh Sửa Thông Tin Nhóm">
        <Card className="p-5 w-full border-0 bg-transparent shadow-none">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Chỉnh sửa thông tin nhóm</h3>
          {error && <div className="p-3 mb-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">{error}</div>}
          <div className="flex flex-col gap-4 mb-4">
            <Input
              label="Tên nhóm"
              placeholder="e.g. Science Study Group"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Input
              label="Mô tả"
              placeholder="Mô tả nhóm học tập này..."
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700">Ảnh đại diện nhóm</label>
              <div className="flex items-center gap-3">
                {editAvatar ? (
                  <img src={editAvatar} alt="Team Preview" className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)]" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-charcoal)] border border-[var(--color-border)] flex items-center justify-center text-neutral-400 font-bold text-xs uppercase">
                    No avt
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="team-edit-avatar-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          setError('Kích thước ảnh phải nhỏ hơn 2MB')
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setEditAvatar(event.target?.result as string)
                          setError('')
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <label
                    htmlFor="team-edit-avatar-upload"
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-[var(--color-border)] rounded-md text-xs font-semibold text-neutral-800 bg-[var(--color-charcoal)] hover:bg-[var(--color-border)] cursor-pointer transition-colors"
                  >
                    Tải ảnh lên
                  </label>
                  {editAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar('')}
                      className="ml-2 text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Input
              label="Số lượng thành viên tối đa"
              type="number"
              min={1}
              value={editMaxMembers}
              onChange={(e) => setEditMaxMembers(parseInt(e.target.value) || 20)}
            />
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                label="Nhóm riêng tư (Private Team)"
                checked={editIsPrivate}
                onChange={(e) => setEditIsPrivate(e.target.checked)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button variant="primary" className="flex-1" onClick={handleUpdateTeam} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  )
}

function scrumTaskToForEdit(t: {
  title?: string
  description?: string | null
  assignee?: string | null
  assignees?: string[] | null
  dueDate?: string | null
  due?: string | null
  duDate?: string | null
  startDate?: string | null
  completedAt?: string | null
  completeAt?: string | null
  status?: string | null
  priority?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  [key: string]: unknown
}): TaskForEdit {
  const dueDate = (t.dueDate || t.due || t.duDate || '') as string
  const completedAt = (t.completedAt || t.completeAt) as string | null | undefined
  return {
    ...t,
    title: t.title || '',
    desc: t.description || undefined,
    description: t.description || undefined,
    assignee: t.assignee || t.assignees?.[0] || '',
    due: dueDate,
    dueDate,
    endDate: dueDate,
    completed: completedAt ? new Date(completedAt).toISOString().split('T')[0] : '',
    completedAt: completedAt || undefined,
    estimatedHours: t.estimatedHours ?? null,
    actualHours: t.actualHours != null ? Number(t.actualHours) : null,
  }
}

function getDueDateBadgeClass(dueDateStr: string, isDone: boolean) {
  if (!dueDateStr || isDone) return 'bg-neutral-100 text-neutral-600 border-neutral-200'
  const dueDate = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return 'bg-red-50 text-red-600 border-red-200 font-semibold'
  } else if (diffDays <= 2) {
    return 'bg-orange-50 text-orange-600 border-orange-200 font-semibold'
  }
  return 'bg-neutral-100 text-neutral-600 border-neutral-200'
}

function ScrumBoardContent({
  projectId,
  teamMembers,
  projectName,
  isOwner = false,
  currentUserSso,
}: {
  projectId: number | null
  teamMembers: any[]
  projectName: string
  isOwner?: boolean
  currentUserSso?: string
}) {
  const [columns, setColumns] = useState<any[]>([])
  const [selected, setSelected] = useState<{ task: any; columnId: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // Add Task dialog state
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')
  const [newTaskEstHours, setNewTaskEstHours] = useState('0')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  // Add Column dialog state
  const [addColumnOpen, setAddColumnOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const loadBoard = () => {
    if (!projectId) {
      // Load mock columns if no project is active
      setColumns(SCRUM_COLUMNS_INIT.map((col, cIdx) => ({
        columnId: cIdx + 1,
        name: col.title,
        tasks: col.tasks.map((t, tIdx) => ({
          taskId: (cIdx + 1) * 100 + tIdx,
          title: t.title,
          description: t.startDate ? `Starts ${t.startDate}` : '',
          status: col.title,
          priority: t.priority || 'MEDIUM',
          assignee: t.assignee
        }))
      })))
      return
    }
    setLoading(true)
    workflowApi.getBoard(projectId)
      .then((res) => {
        if (res.success && res.data && res.data.boardColumns) {
          setColumns(res.data.boardColumns)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBoard()
  }, [projectId])

  const handleSaveTask = async (updated: TaskForEdit) => {
    if (!selected || !projectId) return
    const { task } = selected
    const isAssigned = !!(task.assignee || '').trim()

    // Khi đã giao: không đổi status qua move (kéo cột vẫn dùng board)
    if (!isAssigned) {
      const targetCol = columns.find((c) => c.name === updated.status || String(c.columnId) === String(updated.status))
      if (targetCol && String(targetCol.columnId) !== String(task.columnId)) {
        try {
          await workflowApi.moveTask(projectId, task.taskId, targetCol.columnId)
        } catch (err) {
          console.error(err)
        }
      }
    }

    // Handle assignee update — chỉ OWNER được giao task
    if (isOwner && updated.assignee !== task.assignee) {
      try {
        await workflowApi.assignTask(task.taskId, updated.assignee || '')
      } catch (err) {
        console.error(err)
      }
    }

    // Handle general task update
    try {
      const payload: Record<string, unknown> = {
        title: updated.title,
        description: updated.desc,
      }
      if (!isAssigned) {
        payload.priority = updated.priority || 'Medium'
        payload.startDate = updated.startDate || null
        payload.dueDate = updated.due || updated.endDate || null
        payload.status = updated.status
        payload.completedAt = updated.completed ? new Date(updated.completed).toISOString() : null
      }
      await workflowApi.updateTask(task.taskId, payload as any)
    } catch (err) {
      console.error(err)
    }

    setSelected(null)
    loadBoard()
  }

  const handleAddTask = async () => {
    if (!projectId || !newTaskTitle.trim()) return
    try {
      const res = await workflowApi.createTask(projectId, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        priority: newTaskPriority,
        estimatedHours: newTaskEstHours ? Number(newTaskEstHours) : 0,
        startDate: newTaskStartDate || null,
        dueDate: newTaskDueDate || null,
        columnId: targetColumnId || null
      })
      if (res.success) {
        setAddTaskOpen(false)
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskPriority('Medium')
        setNewTaskEstHours('0')
        setNewTaskStartDate('')
        setNewTaskDueDate('')
        loadBoard()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateColumn = async () => {
    if (!projectId || !newColumnName.trim()) return
    try {
      const res = await workflowApi.createColumn(
        projectId,
        newColumnName.trim(),
        columns.length + 1
      )
      if (res.success) {
        setAddColumnOpen(false)
        setNewColumnName('')
        loadBoard()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleExportReport = async () => {
    if (!projectId) return
    try {
      const blob = await workflowApi.exportProjectTasks(projectId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `project_${projectId}_tasks.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting tasks:', err)
    }
  }

  return (
    <div className="min-h-0 flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-neutral-900">{projectName}</h2>
          {loading && <span className="text-xs text-neutral-500">Loading...</span>}
          <Button variant="secondary" size="sm" onClick={() => setAddColumnOpen(true)}>
            + Add Column
          </Button>
          {projectId && (
            <Button variant="tonal" size="sm" onClick={handleExportReport} className="text-xs font-bold gap-1">
              📥 Export Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 overflow-x-auto pb-1 min-h-0">
        {columns.map((col) => (
          <div key={col.columnId || col.id} className="flex flex-col min-w-[220px] bg-[var(--color-accent-muted)] rounded-2xl border border-[var(--color-border)] p-2.5 shadow-none">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-neutral-900">{col.name} ({col.tasks?.length || 0})</span>
            </div>
            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
              {col.tasks && col.tasks.map((task: any, i: number) => (
                <Button
                  key={task.taskId || i}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected({ task, columnId: String(col.columnId) })}
                  className="w-full !justify-start text-left p-2 bg-white rounded-md border border-[var(--color-border)] shadow-none relative hover:border-primary/40 transition-colors"
                >
                  <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] mb-1">{task.priority || 'MEDIUM'}</Badge>
                  <p className="text-xs font-medium text-neutral-900 leading-tight">{task.title}</p>
                  {task.description && (
                    <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2">{task.description}</p>
                  )}
                  {/* Due Date & Completed Date Display */}
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    {(task.dueDate || task.duDate) && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] border ${getDueDateBadgeClass(task.dueDate || task.duDate, col.name.toUpperCase() === 'DONE')}`}>
                        📅 Due: {task.dueDate || task.duDate}
                      </span>
                    )}
                    {(task.completedAt || task.completeAt) && col.name.toUpperCase() === 'DONE' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-green-50 text-green-600 border border-green-200 font-semibold">
                        ✅ Completed: {new Date(task.completedAt || task.completeAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 min-w-0">
                    {(() => {
                      const m = teamMembers.find((mem) => mem.id === task.assignee)
                      const name = m ? m.name : (task.assignee || 'Unassigned')
                      const code = m ? m.code : (task.assignee ? task.assignee.slice(0, 2).toUpperCase() : 'UN')
                      return (
                        <>
                          <span 
                            className="w-5 h-5 rounded bg-neutral-300 text-[9px] font-bold flex items-center justify-center text-neutral-700 shrink-0"
                            title={name}
                          >
                            {code}
                          </span>
                          <span className="text-[10.5px] text-neutral-600 truncate max-w-[120px]" title={name}>
                            {name}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </Button>
              ))}
            </div>
            {projectId && (
              <Button
                variant="tonal"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => {
                  setTargetColumnId(col.columnId)
                  setAddTaskOpen(true)
                }}
              >
                + Add Task
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Task Details Popup Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} size="max-w-lg" title="Chi tiết Task">
        {selected && (
          <Card className="p-5 w-full border-0 bg-transparent shadow-none">
            <TaskEditSidebar
              task={scrumTaskToForEdit(selected.task)}
              onSave={handleSaveTask}
              onClose={() => setSelected(null)}
              statusOptions={columns.map((c) => c.name)}
              members={teamMembers}
              taskId={selected.task.taskId}
              currentUserSso={currentUserSso}
              isOwner={isOwner}
              onWorkflowChange={() => {
                loadBoard()
                setSelected(null)
              }}
              onDeleted={() => {
                setSelected(null)
                loadBoard()
              }}
            />
          </Card>
        )}
      </Modal>

      {/* Add Task Modal */}
      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} size="max-w-md" title="Add New Task">
        <Card className="p-5 w-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl rounded-2xl">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Add New Task</h3>
          <div className="flex flex-col gap-4 mb-5">
            <Input
              label="Task Title"
              placeholder="e.g. Design UI components"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="Details of the task"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
            
            {/* Priority Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500">Priority</label>
              <select
                className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl bg-white text-neutral-900 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Estimated Hours */}
            <Input
              label="Estimated Hours"
              type="number"
              placeholder="e.g. 5"
              value={newTaskEstHours}
              onChange={(e) => setNewTaskEstHours(e.target.value)}
            />

            {/* Start Date and Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={newTaskStartDate}
                onChange={(e) => setNewTaskStartDate(e.target.value)}
              />
              <Input
                label="Due Date"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleAddTask}>Add Task</Button>
          </div>
        </Card>
      </Modal>

      {/* Add Column Modal */}
      <Modal open={addColumnOpen} onClose={() => setAddColumnOpen(false)} size="max-w-md" title="Add Board Column">
        <Card className="p-5 w-full">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Add Board Column</h3>
          <div className="flex flex-col gap-4 mb-4">
            <Input
              label="Column Name"
              placeholder="e.g. Code Review"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAddColumnOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreateColumn}>Create Column</Button>
          </div>
        </Card>
      </Modal>
    </div>
  )
}


