import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, DocumentIcon, IconButton, SegmentedControl } from '../../../components/common'
import { TaskEditSidebar, type TaskForEdit } from '../../../components/TaskEditSidebar'
import {
  TEAM_TABS,
  TEAM_MEMBERS,
  SCRUM_COLUMNS_INIT,
  SPRINT_COLUMNS_INIT,
  type TabId,
  type ScrumTask,
  type SprintTask,
} from '../../../mocks'

function getAssigneeDisplay(assigneeCode: string): { name: string; skills: string[] } | undefined {
  const m = TEAM_MEMBERS.find((mem) => mem.code === assigneeCode)
  return m ? { name: m.name, skills: m.skills } : undefined
}

export default function BoardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as TabId) || 'management'
  const setTab = (id: TabId) => setSearchParams({ tab: id })

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2 mb-2">
        <SegmentedControl
          value={tab}
          onChange={(next) => setTab(next as TabId)}
          options={TEAM_TABS.map((t) => ({ value: t.id, label: t.label }))}
        />
      </div>
      {tab === 'management' && <TeamManagementContent members={TEAM_MEMBERS} />}
      {tab === 'scrum' && <ScrumBoardContent />}
      {tab === 'sprint' && <SprintBoardContent />}
    </div>
  )
}

function TeamManagementContent({ members }: { members: typeof TEAM_MEMBERS }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Team management</h1>
      <Card heading="Members" className="border border-[var(--color-border)] shadow-none">
      <ul className="space-y-0">
        {members.map((m, i) => (
          <li
            key={m.id}
            className={`flex justify-between items-start gap-4 py-3 ${i < members.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
          >
            <div className="min-w-0 flex-1">
              <span className="text-neutral-900 font-medium">
                {m.name}
                {m.role && <span className="text-neutral-500 font-normal"> ({m.role})</span>}
              </span>
              {m.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.skills.map((skill, j) => (
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
            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900 shrink-0">
              Edit
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-4 border border-[var(--color-border)]">
        Invite member
      </Button>
    </Card>
    </div>
  )
}

function scrumTaskToForEdit(t: ScrumTask): TaskForEdit {
  return { ...t, desc: undefined }
}

function ScrumBoardContent() {
  const [columns, setColumns] = useState(SCRUM_COLUMNS_INIT)
  const [selected, setSelected] = useState<{ task: ScrumTask; columnId: string; taskIndex: number } | null>(null)

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
                      startDate: updated.startDate,
                      endDate: updated.endDate,
                      due: updated.due,
                      status: updated.status,
                      completed: updated.completed,
                      priority: updated.priority,
                      estimate: updated.estimate,
                      reporter: updated.reporter,
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
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">SP Project Alpha</h2>
            <SegmentedControl
              value="Board"
              onChange={() => {}}
              options={[{ value: 'Board', label: 'Board' }, { value: 'Timeline', label: 'Timeline' }, { value: 'Files', label: 'Files' }]}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500">JD AM SK +3</span>
            <Button variant="secondary" size="sm" className="py-1 px-2 text-xs h-7">Share</Button>
            <IconButton label="Settings" icon={<svg className="w-4 h-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>} />
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 overflow-x-auto pb-1 min-h-0">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col min-w-[220px] bg-[var(--color-accent-muted)] rounded-2xl border border-[var(--color-border)] p-2.5 shadow-none">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-neutral-900">{col.title} ({col.tasks.length})</span>
                <IconButton type="button" size="sm" variant="ghost" className="p-0.5 text-neutral-400 hover:text-neutral-600 text-[10px]" label="Options" icon={<span>⋯</span>} />
              </div>
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
                {col.tasks.map((task, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected({ task, columnId: col.id, taskIndex: i })}
                    className="w-full !justify-start text-left p-2 bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] shadow-none relative hover:border-primary/40 transition-colors"
                  >
                    {task.flagged && (
                      <span className="absolute top-1 right-1 text-neutral-400" aria-hidden>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                      </span>
                    )}
                    {task.done && (
                      <span className="absolute top-1 right-1 text-success" aria-hidden>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                    {task.missed && (
                      <span className="absolute top-1 right-1 text-neutral-700 dark:text-highlight" aria-hidden>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                    )}
                    <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] mb-1">{task.tag}</Badge>
                    <p className="text-xs font-medium text-neutral-900 leading-tight">{task.title}</p>
                    {task.due && <p className="text-xs text-neutral-500 mt-0.5">Due: {task.due}</p>}
                    {task.status && <p className="text-xs text-neutral-600 mt-0.5">{task.status}</p>}
                    {task.completed && <p className="text-xs text-neutral-500 mt-0.5">Done: {task.completed}</p>}
                    <div className="mt-1 flex items-center gap-1">
                      <span className="w-5 h-5 rounded bg-neutral-300 text-[9px] font-bold flex items-center justify-center text-neutral-700">{task.assignee}</span>
                    </div>
                  </Button>
                ))}
              </div>
              <Button variant="tonal" size="sm" className="w-full mt-2 text-xs">+ Add Task</Button>
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
            statusOptions={['TO-DO', 'DOING', 'In Progress', 'DONE', 'MISSED', 'OVERDUE 3D']}
            assigneeDisplay={getAssigneeDisplay(selected.task.assignee)}
          />
        ) : (
          <div className="flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3 h-full overflow-y-auto shadow-none">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-900">AI Task Insights</span>
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" /></svg>
            </div>
            <p className="text-xs text-neutral-500 mb-2">Click a task to edit.</p>
            <section className="mb-2">
              <h3 className="text-[10px] font-bold uppercase text-neutral-600 mb-1">Priority Alerts</h3>
              <div className="flex gap-1.5 p-2 rounded-md bg-highlight/10 border border-highlight/30">
                <span className="text-neutral-700 dark:text-highlight text-[10px]">▲</span>
                <p className="text-[10px] text-neutral-800">Bottleneck: &quot;Integrate AI Dashboard UI&quot; delayed.</p>
              </div>
            </section>
            <section className="mb-2">
              <h3 className="text-[10px] font-bold uppercase text-neutral-600 mb-1">Workload</h3>
              <ul className="space-y-1">
                {[{ name: 'James (JD)', pct: 85 }, { name: 'Anna (AM)', pct: 40 }, { name: 'Sam (SK)', pct: 95 }].map((u) => (
                  <li key={u.name} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-700 w-16 truncate">{u.name}</span>
                    <div className="flex-1 h-1.5 bg-[var(--color-charcoal)] rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${u.pct}%` }} />
                    </div>
                    <span className="text-[9px] font-medium text-neutral-600 w-6">{u.pct}%</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="mb-2">
              <h3 className="text-[10px] font-bold uppercase text-neutral-600 mb-1">Suggestions</h3>
              <ul className="space-y-0.5 text-[10px] text-neutral-700">
                <li className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Completion Oct 24.
                </li>
                <li className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Anna free for review.
                </li>
              </ul>
            </section>
            <Button variant="primary" size="sm" className="w-full py-1 text-xs h-7">Generate Report</Button>
          </div>
        )}
      </aside>
    </div>
  )
}

function sprintTaskToForEdit(t: SprintTask): TaskForEdit {
  return { ...t }
}

function SprintBoardContent() {
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
        <p className="text-xs text-neutral-500 mb-1">Workspace / Team Alpha / Q4 Goals</p>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-neutral-900">Sprint Board</h2>
            <Badge variant="default" className="px-1.5 py-0.5 text-[10px] normal-case tracking-normal">Active</Badge>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span>● {columns.reduce((acc, c) => acc + c.tasks.length, 0)} Tasks</span>
              <span>● 4 Members</span>
              <span>● 2 Days left</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="primary" size="sm" className="py-1 px-2 text-xs h-7">Start meeting</Button>
            <Button variant="secondary" size="sm" className="py-1 px-2 text-xs h-7">New Task</Button>
          </div>
        </div>
        <div className="flex gap-1 border-b border-[var(--color-border)] pb-1.5 mb-2">
          <SegmentedControl
            value="task-board"
            onChange={() => {}}
            options={[{ value: 'task-board', label: 'Task Board' }, { value: 'members', label: 'Members' }]}
          />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 overflow-x-auto pb-1 min-h-0">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col min-w-[220px] bg-[var(--color-accent-muted)] rounded-2xl border border-[var(--color-border)] p-2.5 shadow-none">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-neutral-900">{col.title}</span>
                <IconButton type="button" size="sm" variant="ghost" className="p-0.5 text-neutral-400 hover:text-neutral-600 text-[10px]" label="Add" icon={<span>+</span>} />
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
                    {task.progress != null && (
                      <div className="mt-1">
                        <div className="h-1 w-full bg-[var(--color-charcoal)] rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-neutral-300 text-[10px] font-bold flex items-center justify-center text-neutral-700">{task.assignee}</span>
                      <div className="flex items-center gap-0.5">
                        {task.due && <span className="text-[10px] text-neutral-500">{task.due}</span>}
                        {task.status && <span className="text-[10px] text-neutral-600">{task.status}</span>}
                        {task.needsFeedback && <Badge variant="warning" className="px-1.5 py-0.5 text-[10px] normal-case tracking-normal">Feedback</Badge>}
                      </div>
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
            task={sprintTaskToForEdit(selected.task)}
            onSave={handleSaveTask}
            onClose={() => setSelected(null)}
            statusOptions={['TO DO', 'IN PROGRESS', 'In review', 'REVIEW', 'DONE']}
            assigneeDisplay={getAssigneeDisplay(selected.task.assignee)}
          />
        ) : (
          <div className="flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3 h-full overflow-y-auto space-y-3 shadow-none">
            <p className="text-[10px] text-neutral-500">Click a task to edit.</p>
            <section>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-900">Recent Files</h3>
                <Button type="button" variant="ghost" size="sm" className="text-[10px] !px-0 !py-0 min-h-0 text-neutral-500 hover:text-neutral-700">View All</Button>
              </div>
              <ul className="space-y-1">
                <li className="flex items-center gap-1.5 text-[10px] text-neutral-700">
                  <DocumentIcon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  project_spec_v2.pdf <span className="text-[9px] text-neutral-400">2h</span>
                </li>
                <li className="flex items-center gap-1.5 text-[10px] text-neutral-700">
                  <svg className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  moodboard_final.png <span className="text-[9px] text-neutral-400">5h</span>
                </li>
              </ul>
            </section>
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-900 mb-1">Team <span className="text-neutral-500 font-normal">4/5</span></h3>
              <ul className="space-y-1">
                {['Alice Chen', 'Bob Smith', 'Charlie Kim'].map((line) => (
                  <li key={line} className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-200 flex-shrink-0" />
                    <span className="text-[10px] text-neutral-700">{line}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="p-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-900 mb-1 flex items-center gap-0.5">
                AI Assistant <span className="text-neutral-700 dark:text-primary">◆</span>
              </h3>
              <p className="text-[10px] text-neutral-700 mb-1.5">Update documentation.</p>
              <Button variant="primary" size="sm" className="py-1 text-xs h-6">Accept</Button>
            </section>
          </div>
        )}
      </aside>
    </div>
  )
}
