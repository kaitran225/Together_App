import { useState, useEffect } from 'react'
import { Button, CloseIcon } from './common'
import { DEFAULT_STATUS_OPTIONS } from '../mocks'

/** Shared task shape for the edit sidebar (Scrum + Sprint) */
export type TaskForEdit = {
  title: string
  assignee: string
  tag?: string
  desc?: string
  startDate?: string
  endDate?: string
  due?: string
  status?: string
  progress?: number
  completed?: string
  priority?: string
  estimate?: string
  reporter?: string
  flagged?: boolean
  done?: boolean
  missed?: boolean
  needsFeedback?: boolean
  [key: string]: unknown
}

type TaskEditSidebarProps = {
  task: TaskForEdit
  onSave: (updated: TaskForEdit) => void
  onClose: () => void
  /** Optional column id for status dropdown context */
  statusOptions?: string[]
  /** When set, assignee is shown as a card with name and skill tags instead of an input */
  assigneeDisplay?: { name: string; skills: string[] }
}

export function TaskEditSidebar({ task, onSave, onClose, statusOptions = DEFAULT_STATUS_OPTIONS, assigneeDisplay }: TaskEditSidebarProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.desc ?? '')
  const [assignee, setAssignee] = useState(task.assignee)
  const [status, setStatus] = useState(task.status ?? '')
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [endDate, setEndDate] = useState(task.endDate ?? '')
  const [due, setDue] = useState(task.due ?? '')
  const [tag, setTag] = useState(task.tag ?? '')
  const [progress, setProgress] = useState(task.progress ?? 0)
  const [priority, setPriority] = useState(task.priority ?? '')
  const [estimate, setEstimate] = useState(task.estimate ?? '')
  const [reporter, setReporter] = useState(task.reporter ?? '')
  const [completed, setCompleted] = useState(task.completed ?? '')

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.desc ?? '')
    setAssignee(task.assignee)
    setStatus(task.status ?? '')
    setStartDate(task.startDate ?? '')
    setEndDate(task.endDate ?? '')
    setDue(task.due ?? '')
    setTag(task.tag ?? '')
    setProgress(task.progress ?? 0)
    setPriority(task.priority ?? '')
    setEstimate(task.estimate ?? '')
    setReporter(task.reporter ?? '')
    setCompleted(task.completed ?? '')
  }, [task])

  const handleSave = () => {
    onSave({
      ...task,
      title,
      desc: description,
      assignee,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      due: due || undefined,
      completed: completed || undefined,
      tag: tag || undefined,
      progress: progress,
      priority: priority || undefined,
      estimate: estimate || undefined,
      reporter: reporter || undefined,
    })
    onClose()
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="flex-shrink-0 flex items-start justify-between gap-1.5 p-2 border-b border-neutral-200">
        <div className="min-w-0 flex-1">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-0.5">Task details</h2>
          <p className="text-xs font-semibold text-neutral-900 truncate">{task.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1.5">Details</h3>
          <div className="space-y-1.5">
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Summary</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
              >
                <option value="">—</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Assignee</label>
              {assigneeDisplay ? (
                <div className="rounded-lg border-2 border-neutral-200 bg-neutral-50/80 p-2.5">
                  <p className="text-xs font-semibold text-neutral-900 mb-1.5">{assigneeDisplay.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {assigneeDisplay.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-[10px] font-medium text-neutral-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  placeholder="e.g. JD, AM"
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Due date</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Completed date</label>
              <input
                type="date"
                value={completed}
                onChange={(e) => setCompleted(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Label / Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                placeholder="e.g. BACKEND"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
              >
                <option value="">—</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Estimate</label>
                <input
                  type="text"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  placeholder="e.g. 2h or 3d"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Reporter</label>
                <input
                  type="text"
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  placeholder="e.g. AM"
                />
              </div>
            </div>
            {(task.progress != null || progress > 0) && (
              <div>
                <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Progress (%)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-neutral-200 accent-neutral-700"
                  />
                  <span className="text-[10px] font-medium text-neutral-600 w-6">{progress}%</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1.5">Description</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300 resize-y min-h-[60px]"
            placeholder="Add a description..."
          />
        </section>

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Activity</h3>
          <p className="text-[10px] text-neutral-500">No activity yet.</p>
        </section>
      </div>

      <div className="flex-shrink-0 flex gap-1.5 p-2 border-t border-neutral-200">
        <Button variant="primary" size="sm" className="flex-1 py-1 text-xs h-7" onClick={handleSave}>
          Save
        </Button>
        <Button variant="ghost" size="sm" className="py-1 text-xs h-7" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
