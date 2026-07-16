import { useState, useEffect } from 'react'
import { Button, CloseIcon } from './common'
import { DEFAULT_STATUS_OPTIONS } from '../mocks'
import { workflowApi } from '../api/client'

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
  /** Optional list of team members for assignee dropdown selection */
  members?: { id: string; name: string }[]
  /** When set, assignee is shown as a card with name and skill tags instead of an input */
  assigneeDisplay?: { name: string; skills: string[] }
  /** Real board task id — enables submit / review */
  taskId?: number
  currentUserSso?: string
  isOwner?: boolean
  onWorkflowChange?: () => void
}

export function TaskEditSidebar({
  task,
  onSave,
  onClose,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  assigneeDisplay,
  members,
  taskId,
  currentUserSso,
  isOwner = false,
  onWorkflowChange,
}: TaskEditSidebarProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.desc ?? '')
  const [assignee, setAssignee] = useState(task.assignee)
  const [status, setStatus] = useState(task.status ?? '')
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [endDate, setEndDate] = useState(task.endDate ?? '')
  const [due, setDue] = useState(task.due ?? '')
  const [tag, setTag] = useState(task.tag ?? '')
  const [progress, setProgress] = useState(task.progress ?? 0)
  const [priority, setPriority] = useState(task.priority || 'Medium')
  const [estimate, setEstimate] = useState(task.estimate ?? '')
  const [reporter, setReporter] = useState(task.reporter ?? '')
  const [completed, setCompleted] = useState(task.completed ?? '')

  const [submissions, setSubmissions] = useState<any[]>([])
  const [submitContent, setSubmitContent] = useState('')
  const [submitLink, setSubmitLink] = useState('')
  const [submitBusy, setSubmitBusy] = useState(false)
  const [reviewGrade, setReviewGrade] = useState('8')
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [workflowError, setWorkflowError] = useState('')

  const normalizedStatus = String(task.status || status || '').toUpperCase().replace(/\s+/g, '_')
  const isAssignee = !!currentUserSso && task.assignee === currentUserSso
  const canSubmit =
    !!taskId &&
    isAssignee &&
    (normalizedStatus === 'IN_PROGRESS' ||
      normalizedStatus === 'INPROGRESS' ||
      normalizedStatus === 'OPEN' ||
      String(task.status || '').toLowerCase() === 'in progress' ||
      String(task.status || '').toLowerCase() === 'to do')
  const pendingSubmissions = submissions.filter((s) => String(s.status).toUpperCase() === 'PENDING')
  const canReview = !!taskId && isOwner && (normalizedStatus === 'IN_REVIEW' || String(task.status || '').toLowerCase() === 'in review' || pendingSubmissions.length > 0)

  const loadSubmissions = async () => {
    if (!taskId) return
    try {
      const res = await workflowApi.getTaskSubmissions(taskId)
      if (res.success && Array.isArray(res.data)) {
        setSubmissions(res.data)
      }
    } catch (e) {
      console.warn('Failed to load submissions', e)
    }
  }

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
    setPriority(task.priority || 'Medium')
    setEstimate(task.estimate ?? '')
    setReporter(task.reporter ?? '')
    setCompleted(task.completed ?? '')
    setSubmitContent('')
    setSubmitLink('')
    setWorkflowError('')
  }, [task])

  useEffect(() => {
    void loadSubmissions()
  }, [taskId])

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
      priority: priority || 'Medium',
      estimate: estimate || undefined,
      reporter: reporter || undefined,
    })
    onClose()
  }

  const handleSubmitWork = async () => {
    if (!taskId) return
    const content = submitContent.trim() || (submitLink.trim() ? `Link bài làm: ${submitLink.trim()}` : '')
    if (!content) {
      setWorkflowError('Nhập mô tả bài làm hoặc dán link.')
      return
    }
    setSubmitBusy(true)
    setWorkflowError('')
    try {
      const attachments = submitLink.trim()
        ? JSON.stringify([{ type: 'link', url: submitLink.trim() }])
        : undefined
      const res = await workflowApi.submitTask(taskId, content, attachments)
      if (res.success) {
        setSubmitContent('')
        setSubmitLink('')
        await loadSubmissions()
        onWorkflowChange?.()
      } else {
        setWorkflowError(res.message || 'Nộp bài thất bại.')
      }
    } catch (e: any) {
      setWorkflowError(e?.message || 'Nộp bài thất bại.')
    } finally {
      setSubmitBusy(false)
    }
  }

  const handleEvaluate = async (submissionId: number, decision: 'APPROVED' | 'REJECTED') => {
    setReviewBusy(true)
    setWorkflowError('')
    try {
      const grade = Number(reviewGrade)
      const res = await workflowApi.evaluateSubmission(
        submissionId,
        Number.isFinite(grade) ? grade : 0,
        reviewFeedback.trim() || (decision === 'APPROVED' ? 'Đạt yêu cầu' : 'Cần chỉnh sửa'),
        decision
      )
      if (res.success) {
        setReviewFeedback('')
        await loadSubmissions()
        onWorkflowChange?.()
      } else {
        setWorkflowError(res.message || 'Đánh giá thất bại.')
      }
    } catch (e: any) {
      setWorkflowError(e?.message || 'Đánh giá thất bại.')
    } finally {
      setReviewBusy(false)
    }
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
              {members && members.length > 0 ? (
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : assigneeDisplay ? (
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
            <div className="grid grid-cols-2 gap-2">
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
            </div>
            <div className="grid grid-cols-2 gap-2">
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

        {taskId && (
          <section className="rounded-md border border-neutral-200 bg-neutral-50/80 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Nộp bài / Review</h3>
            {workflowError && <p className="text-[10px] text-red-600">{workflowError}</p>}

            {canSubmit && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-neutral-600">Task đang In Progress — nộp bài làm hoặc dán link để chuyển sang In Review.</p>
                <textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  placeholder="Mô tả bài làm..."
                />
                <input
                  type="url"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  placeholder="Link (Google Drive, GitHub, ...)"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full py-1 text-xs h-7"
                  disabled={submitBusy}
                  onClick={handleSubmitWork}
                >
                  {submitBusy ? 'Đang nộp...' : 'Nộp bài → In Review'}
                </Button>
              </div>
            )}

            {submissions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-neutral-700">Bài đã nộp</p>
                {submissions.map((s) => (
                  <div key={s.submissionId} className="rounded border border-neutral-200 bg-white p-1.5 space-y-1">
                    <p className="text-[10px] text-neutral-800 whitespace-pre-wrap">{s.content}</p>
                    <p className="text-[9px] text-neutral-500">
                      {s.status}
                      {s.grade != null ? ` · Điểm: ${s.grade}` : ''}
                      {s.feedback ? ` · ${s.feedback}` : ''}
                    </p>
                    {canReview && String(s.status).toUpperCase() === 'PENDING' && (
                      <div className="space-y-1 pt-1 border-t border-neutral-100">
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={reviewGrade}
                            onChange={(e) => setReviewGrade(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md"
                            placeholder="Điểm"
                          />
                          <input
                            type="text"
                            value={reviewFeedback}
                            onChange={(e) => setReviewFeedback(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md"
                            placeholder="Nhận xét"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 py-1 text-xs h-7"
                            disabled={reviewBusy}
                            onClick={() => handleEvaluate(s.submissionId, 'APPROVED')}
                          >
                            Duyệt → Done
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 py-1 text-xs h-7"
                            disabled={reviewBusy}
                            onClick={() => handleEvaluate(s.submissionId, 'REJECTED')}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!canSubmit && !canReview && submissions.length === 0 && (
              <p className="text-[10px] text-neutral-500">
                Khi task In Progress, thành viên được giao có thể nộp bài. Trưởng nhóm review khi ở In Review.
              </p>
            )}
          </section>
        )}

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Activity</h3>
          <p className="text-[10px] text-neutral-500">
            {submissions.length > 0 ? `${submissions.length} submission(s)` : 'No activity yet.'}
          </p>
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
