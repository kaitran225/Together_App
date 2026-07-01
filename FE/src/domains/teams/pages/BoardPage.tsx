import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, SegmentedControl, Modal, Input } from '../../../components/common'
import { TaskEditSidebar, type TaskForEdit } from '../../../components/TaskEditSidebar'
import {
  TEAM_TABS,
  TEAM_MEMBERS,
  SCRUM_COLUMNS_INIT,
  SPRINT_COLUMNS_INIT,
  type TabId,
  type SprintTask,
} from '../../../mocks'
import { workflowApi } from '../../../api/client'

function getAssigneeDisplay(assigneeCode: string, members: any[]): { name: string; skills: string[] } | undefined {
  const m = members.find((mem) => mem.code === assigneeCode || mem.id === assigneeCode)
  return m ? { name: m.name, skills: m.skills } : undefined
}

export default function BoardPage() {
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
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  const loadTeamData = () => {
    if (!teamId) return
    
    // Get team detail
    workflowApi.getTeamDetail(teamId)
      .then((res) => {
        if (res.success && res.data) {
          const detail = res.data
          setTeamName(detail.team.name)
          setInviteCode(detail.team.inviteCode)
          if (detail.members) {
            setMembers(detail.members.map((m: any) => ({
              id: m.userSso,
              name: m.nickname || m.userSso,
              role: m.role,
              skills: m.role === 'OWNER' ? ['Product', 'Strategy'] : ['Contributor'],
              code: (m.nickname || m.userSso).slice(0, 2).toUpperCase()
            })))
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
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{teamName}</h2>
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
        {tab === 'management' && <TeamManagementContent members={members} inviteCode={inviteCode} />}
        {tab === 'scrum' && (
          <ScrumBoardContent
            projectId={selectedProjectId}
            teamMembers={members}
            projectName={projects.find(p => p.projectId === selectedProjectId)?.name || 'Project Board'}
          />
        )}
        {tab === 'sprint' && <SprintBoardContent teamMembers={members} />}
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

function TeamManagementContent({ members, inviteCode }: { members: any[]; inviteCode?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Team management</h1>
      
      {inviteCode && (
        <Card heading="Invite Members" className="border border-[var(--color-border)] shadow-none">
          <p className="text-xs text-neutral-500 mb-2">Share this invite code with your peers to let them join your team.</p>
          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              readOnly
              value={inviteCode}
              className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-border)] bg-[var(--color-charcoal)] rounded-md font-mono text-neutral-900 focus:outline-none"
            />
            <Button variant="primary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </Card>
      )}

      <Card heading="Members" className="border border-[var(--color-border)] shadow-none">
        <ul className="space-y-0">
          {members.map((m, i) => (
            <li
              key={m.id || i}
              className={`flex justify-between items-start gap-4 py-3 ${i < members.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
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
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function scrumTaskToForEdit(t: any): TaskForEdit {
  return {
    ...t,
    desc: t.description || undefined,
    assignee: t.assignee || ''
  }
}

function ScrumBoardContent({ projectId, teamMembers, projectName }: { projectId: number | null; teamMembers: any[]; projectName: string }) {
  const [columns, setColumns] = useState<any[]>([])
  const [selected, setSelected] = useState<{ task: any; columnId: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // Add Task dialog state
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')

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

    // Handle column movement
    const targetCol = columns.find((c) => c.name === updated.status || String(c.columnId) === String(updated.status))
    if (targetCol && String(targetCol.columnId) !== String(task.columnId)) {
      try {
        await workflowApi.moveTask(projectId, task.taskId, targetCol.columnId)
      } catch (err) {
        console.error(err)
      }
    }
    setSelected(null)
    loadBoard()
  }

  const handleAddTask = async () => {
    if (!projectId || !newTaskTitle.trim()) return
    try {
      const res = await workflowApi.createTask(
        projectId,
        newTaskTitle.trim(),
        newTaskDesc.trim(),
        targetColumnId || undefined
      )
      if (res.success) {
        setAddTaskOpen(false)
        setNewTaskTitle('')
        setNewTaskDesc('')
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 min-h-0">
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
                    <div className="mt-1 flex items-center gap-1">
                      <span className="w-5 h-5 rounded bg-neutral-300 text-[9px] font-bold flex items-center justify-center text-neutral-700">
                        {task.assignee || 'UN'}
                      </span>
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
      </div>

      <aside className="flex flex-col min-h-[240px] lg:max-h-[calc(100vh-10rem)] overflow-hidden">
        {selected ? (
          <TaskEditSidebar
            task={scrumTaskToForEdit(selected.task)}
            onSave={handleSaveTask}
            onClose={() => setSelected(null)}
            statusOptions={columns.map((c) => c.name)}
            assigneeDisplay={getAssigneeDisplay(selected.task.assignee, teamMembers)}
          />
        ) : (
          <div className="flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3 h-full overflow-y-auto shadow-none">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-900">AI Task Insights</span>
            </div>
            <p className="text-xs text-neutral-500 mb-2">Click a task to edit.</p>
            <section className="mb-2">
              <h3 className="text-[10px] font-bold uppercase text-neutral-600 mb-1">Priority Alerts</h3>
              <div className="flex gap-1.5 p-2 rounded-md bg-highlight/10 border border-highlight/30">
                <span className="text-[10px]">▲</span>
                <p className="text-[10px] text-neutral-800">Scrum Board is ready for action.</p>
              </div>
            </section>
          </div>
        )}
      </aside>

      {/* Add Task Modal */}
      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} size="max-w-md" title="Add New Task">
        <Card className="p-5 w-full">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Add New Task</h3>
          <div className="flex flex-col gap-4 mb-4">
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

function SprintBoardContent({ teamMembers }: { teamMembers: any[] }) {
  const [columns, setColumns] = useState(SPRINT_COLUMNS_INIT)
  const [selected, setSelected] = useState<{ task: SprintTask; columnId: string; taskIndex: number } | null>(null)

  const handleSaveTask = (updated: TaskForEdit) => {
    if (!selected) return
    const { columnId, taskIndex } = selected
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((t, i) =>
                i === taskIndex
                  ? {
                      ...t,
                      title: updated.title,
                      assignee: updated.assignee,
                      tag: updated.tag ?? t.tag,
                      desc: updated.desc ?? t.desc,
                      startDate: updated.startDate,
                      endDate: updated.endDate,
                      due: updated.due,
                      status: updated.status,
                      progress: updated.progress ?? t.progress,
                      priority: updated.priority,
                      estimate: updated.estimate,
                      reporter: updated.reporter,
                      completed: updated.completed,
                    }
                  : t
              ),
            }
          : col
      )
    )
    setSelected(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 min-h-0">
      <div className="min-h-0 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-neutral-900">Sprint Board</h2>
            <Badge variant="default" className="px-1.5 py-0.5 text-[10px] normal-case tracking-normal">Active</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 overflow-x-auto pb-1 min-h-0">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col min-w-[220px] bg-[var(--color-accent-muted)] rounded-2xl border border-[var(--color-border)] p-2.5 shadow-none">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-neutral-900">{col.title}</span>
              </div>
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
                {col.tasks.map((task, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected({ task, columnId: col.id, taskIndex: i })}
                    className="w-full !justify-start text-left p-2 bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] shadow-none hover:border-primary/40 transition-colors"
                  >
                    {task.tag && <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] mb-1">{task.tag}</Badge>}
                    <p className="text-xs font-medium text-neutral-900 leading-tight">{task.title}</p>
                    {task.desc && <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{task.desc}</p>}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-neutral-300 text-[10px] font-bold flex items-center justify-center text-neutral-700">{task.assignee}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="flex flex-col min-h-[240px] lg:max-h-[calc(100vh-10rem)] overflow-hidden">
        {selected ? (
          <TaskEditSidebar
            task={selected.task}
            onSave={handleSaveTask}
            onClose={() => setSelected(null)}
            statusOptions={['TO DO', 'IN PROGRESS', 'REVIEW', 'DONE']}
            assigneeDisplay={getAssigneeDisplay(selected.task.assignee, teamMembers)}
          />
        ) : (
          <div className="flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3 h-full overflow-y-auto space-y-3 shadow-none">
            <p className="text-[10px] text-neutral-500">Click a task to edit.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
