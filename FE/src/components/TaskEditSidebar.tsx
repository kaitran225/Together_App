import { useState, useEffect, useRef } from 'react'
import { Button, CloseIcon } from './common'
import { DEFAULT_STATUS_OPTIONS } from '../mocks'
import { workflowApi } from '../api/client'
import type { TaskSubmissionResponse } from '../types/dto'

/** Shared task shape for the edit sidebar (Scrum + Sprint) */
export type TaskForEdit = {
  title: string
  assignee: string
  desc?: string
  description?: string
  startDate?: string
  endDate?: string
  due?: string
  dueDate?: string
  status?: string
  completed?: string
  completedAt?: string
  priority?: string
  estimatedHours?: number | null
  actualHours?: number | null
  [key: string]: unknown
}

export type TaskPhase = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'OTHER'

export function resolveTaskPhase(status?: string | null): TaskPhase {
  const n = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
  if (['OPEN', 'TO_DO', 'TODO', 'BACKLOG', 'DRAFT'].includes(n)) return 'TODO'
  if (['IN_PROGRESS', 'INPROGRESS', 'DOING', 'PROGRESS'].includes(n)) return 'IN_PROGRESS'
  if (['IN_REVIEW', 'INREVIEW', 'REVIEW'].includes(n)) return 'IN_REVIEW'
  if (['DONE', 'COMPLETED', 'COMPLETE'].includes(n)) return 'DONE'
  // Column display names
  const lower = String(status || '').trim().toLowerCase()
  if (lower === 'to do' || lower === 'todo' || lower === 'to-do') return 'TODO'
  if (lower === 'in progress') return 'IN_PROGRESS'
  if (lower === 'in review') return 'IN_REVIEW'
  if (lower === 'done') return 'DONE'
  return 'OTHER'
}

type TaskEditSidebarProps = {
  task: TaskForEdit
  onSave: (updated: TaskForEdit) => void
  onClose: () => void
  statusOptions?: string[]
  members?: { id: string; name: string }[]
  assigneeDisplay?: { name: string; skills: string[] }
  taskId?: number
  currentUserSso?: string
  isOwner?: boolean
  onWorkflowChange?: () => void
  onDeleted?: () => void
}

const inputClass =
  'w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300'
const labelClass = 'block text-[10px] font-medium text-neutral-600 mb-0.5'

export function TaskEditSidebar({
  task,
  onSave,
  onClose,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  members,
  assigneeDisplay,
  taskId,
  currentUserSso,
  isOwner = false,
  onWorkflowChange,
  onDeleted,
}: TaskEditSidebarProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.desc ?? task.description ?? '')
  const [assignee, setAssignee] = useState(task.assignee)
  const [status, setStatus] = useState(task.status ?? '')
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [endDate, setEndDate] = useState(task.endDate ?? task.due ?? task.dueDate ?? '')
  const [priority, setPriority] = useState(task.priority || 'Medium')
  const [completed, setCompleted] = useState(task.completed ?? '')

  const [submissions, setSubmissions] = useState<TaskSubmissionResponse[]>([])
  const [submitContent, setSubmitContent] = useState('')
  const [submitLink, setSubmitLink] = useState('')
  const [submitFileMeta, setSubmitFileMeta] = useState<{ name: string; size: number; dataUrl?: string } | null>(null)
  const [submitBusy, setSubmitBusy] = useState(false)
  const [reviewGrade, setReviewGrade] = useState('8')
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [workflowError, setWorkflowError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const phase = resolveTaskPhase(task.status || status)
  const isAssignee = !!currentUserSso && task.assignee === currentUserSso
  const isAssigned = !!(task.assignee || '').trim()
  /** Khi đã giao task: khóa status / priority / start / end */
  const lockWorkflowFields = isAssigned
  const canSubmit = !!taskId && isAssignee && phase === 'IN_PROGRESS'
  const canReview = !!taskId && isOwner && phase === 'IN_REVIEW'
  const isDone = phase === 'DONE'
  const isEditable = phase === 'TODO' || phase === 'IN_PROGRESS' || phase === 'IN_REVIEW'

  const getMemberName = (userSso?: string | null) => {
    if (!userSso) return 'Unknown'
    return members?.find((m) => m.id === userSso)?.name || userSso
  }

  const actualHours =
    task.actualHours != null && Number.isFinite(Number(task.actualHours))
      ? Number(task.actualHours)
      : null

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
    setDescription(task.desc ?? task.description ?? '')
    setAssignee(task.assignee)
    setStatus(task.status ?? '')
    setStartDate(task.startDate ?? '')
    setEndDate(task.endDate ?? task.due ?? task.dueDate ?? '')
    setPriority(task.priority || 'Medium')
    setCompleted(task.completed ?? '')
    setSubmitContent('')
    setSubmitLink('')
    setSubmitFileMeta(null)
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
      description,
      assignee,
      // Khi đã giao: giữ nguyên status / priority / dates gốc
      status: lockWorkflowFields ? task.status : status || undefined,
      startDate: lockWorkflowFields ? task.startDate : startDate || undefined,
      endDate: lockWorkflowFields ? (task.endDate || task.due || task.dueDate) : endDate || undefined,
      due: lockWorkflowFields ? (task.due || task.dueDate || task.endDate) : endDate || undefined,
      dueDate: lockWorkflowFields ? (task.dueDate || task.due || task.endDate) : endDate || undefined,
      completed: completed || undefined,
      priority: lockWorkflowFields ? task.priority : priority || 'Medium',
    })
    onClose()
  }

  const buildAttachmentsJson = () => {
    const items: Array<Record<string, unknown>> = []
    if (submitLink.trim()) {
      items.push({ type: 'link', url: submitLink.trim() })
    }
    if (submitFileMeta) {
      items.push({
        type: 'file',
        name: submitFileMeta.name,
        size: submitFileMeta.size,
        ...(submitFileMeta.dataUrl ? { dataUrl: submitFileMeta.dataUrl } : {}),
      })
    }
    return items.length > 0 ? JSON.stringify(items) : undefined
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSubmitFileMeta(null)
      return
    }
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setWorkflowError('File tối đa 2MB. Với file lớn hơn, hãy dán link Drive/GitHub.')
      setSubmitFileMeta({ name: file.name, size: file.size })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSubmitFileMeta({
        name: file.name,
        size: file.size,
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
      })
      setWorkflowError('')
    }
    reader.onerror = () => {
      setSubmitFileMeta({ name: file.name, size: file.size })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitWork = async () => {
    if (!taskId) return
    const content =
      submitContent.trim() ||
      (submitLink.trim() ? `Link bài làm: ${submitLink.trim()}` : '') ||
      (submitFileMeta ? `File: ${submitFileMeta.name}` : '')
    if (!content) {
      setWorkflowError('Nhập mô tả bài làm, dán link hoặc chọn tệp.')
      return
    }
    setSubmitBusy(true)
    setWorkflowError('')
    try {
      const res = await workflowApi.submitTask(taskId, content, buildAttachmentsJson())
      if (res.success) {
        setSubmitContent('')
        setSubmitLink('')
        setSubmitFileMeta(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
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

  const handleDelete = async () => {
    if (!taskId || !isOwner) return
    if (!window.confirm('Xóa task này? Hành động không thể hoàn tác.')) return
    setDeleteBusy(true)
    setWorkflowError('')
    try {
      const res = await workflowApi.deleteTask(taskId)
      if (res.success) {
        onDeleted?.()
        onClose()
      } else {
        setWorkflowError(res.message || 'Xóa task thất bại.')
      }
    } catch (e: any) {
      setWorkflowError(e?.message || 'Xóa task thất bại.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const parseAttachmentLinks = (attachments?: string | null) => {
    if (!attachments) return [] as Array<{ type?: string; url?: string; name?: string; dataUrl?: string; size?: number }>
    try {
      const parsed = JSON.parse(attachments)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const openFileViewer = (item: { name?: string; dataUrl?: string }) => {
    if (!item.dataUrl) return
    const win = window.open()
    if (!win) return
    const title = item.name || 'attachment'
    if (item.dataUrl.startsWith('data:image/')) {
      win.document.write(
        `<!doctype html><title>${title}</title><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh"><img src="${item.dataUrl}" alt="${title}" style="max-width:100%;max-height:100vh;object-fit:contain"/></body>`
      )
    } else if (item.dataUrl.startsWith('data:application/pdf')) {
      win.document.write(
        `<!doctype html><title>${title}</title><body style="margin:0"><iframe src="${item.dataUrl}" style="border:0;width:100%;height:100vh"></iframe></body>`
      )
    } else {
      win.location.href = item.dataUrl
    }
  }

  const downloadFile = (item: { name?: string; dataUrl?: string }) => {
    if (!item.dataUrl) return
    const a = document.createElement('a')
    a.href = item.dataUrl
    a.download = item.name || 'attachment'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const renderAttachments = (
    attachments?: string | null,
    opts?: { allowFileActions?: boolean }
  ) => {
    const items = parseAttachmentLinks(attachments)
    if (items.length === 0) return null
    const allowFileActions = opts?.allowFileActions !== false
    return (
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-[9px] text-neutral-600 flex flex-wrap items-center gap-1.5">
            {item.type === 'link' && item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="underline text-primary break-all"
              >
                🔗 {item.url}
              </a>
            ) : (
              <>
                <span className="text-neutral-700">📎 {item.name || 'Tệp đính kèm'}</span>
                {allowFileActions && item.dataUrl && (
                  <>
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => openFileViewer(item)}
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => downloadFile(item)}
                    >
                      Tải về
                    </button>
                  </>
                )}
                {allowFileActions && !item.dataUrl && (
                  <span className="text-neutral-400">(không có dữ liệu xem/tải)</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  const renderAssigneeField = () => (
    <div>
      <label className={labelClass}>Assignee{!isOwner ? ' (chỉ Owner được giao)' : ''}</label>
      {isOwner && isEditable && members && members.length > 0 ? (
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      ) : members && members.length > 0 ? (
        <div className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-neutral-50 text-neutral-700">
          {members.find((m) => m.id === assignee)?.name || assignee || 'Unassigned'}
        </div>
      ) : assigneeDisplay ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-2">
          <p className="text-xs font-semibold text-neutral-900">{assigneeDisplay.name}</p>
        </div>
      ) : (
        <div className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-neutral-50 text-neutral-700">
          {assignee || 'Unassigned'}
        </div>
      )}
    </div>
  )

  const renderCoreFields = () => (
    <section className="space-y-1.5">
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          readOnly={isDone}
          className={`${inputClass} ${isDone ? 'bg-neutral-50' : ''}`}
          placeholder="Task title"
        />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          readOnly={isDone}
          rows={3}
          className={`${inputClass} resize-y min-h-[60px] ${isDone ? 'bg-neutral-50' : ''}`}
          placeholder="Add a description..."
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Status</label>
          {isDone || !isEditable || lockWorkflowFields ? (
            <div className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-neutral-50 text-neutral-700">
              {status || phase}
            </div>
          ) : (
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {lockWorkflowFields && !isDone && (
            <p className="text-[9px] text-neutral-400 mt-0.5">Đã giao — không đổi status tại đây</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={isDone || lockWorkflowFields}
            className={`${inputClass} ${isDone || lockWorkflowFields ? 'bg-neutral-50' : ''}`}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>
      {renderAssigneeField()}
    </section>
  )

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="shrink-0 flex items-start justify-between gap-1.5 p-2 border-b border-neutral-200">
        <div className="min-w-0 flex-1">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-0.5">Chi tiết Task</h2>
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
        {workflowError && <p className="text-[10px] text-red-600">{workflowError}</p>}

        {renderCoreFields()}

        {/* To Do / In Progress / In Review: dates */}
        {(phase === 'TODO' || phase === 'IN_PROGRESS' || phase === 'IN_REVIEW' || phase === 'OTHER') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                readOnly={lockWorkflowFields}
                className={`${inputClass} ${lockWorkflowFields ? 'bg-neutral-50' : ''}`}
              />
            </div>
            <div>
              <label className={labelClass}>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                readOnly={lockWorkflowFields}
                className={`${inputClass} ${lockWorkflowFields ? 'bg-neutral-50' : ''}`}
              />
            </div>
          </div>
        )}

        {/* In Progress: nộp bài */}
        {phase === 'IN_PROGRESS' && taskId && (
          <section className="rounded-md border border-neutral-200 bg-neutral-50/80 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Nộp bài</h3>
            {canSubmit ? (
              <div className="space-y-1.5">
                <textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  rows={2}
                  className={inputClass}
                  placeholder="Mô tả bài làm..."
                />
                <input
                  type="url"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  className={inputClass}
                  placeholder="Dán link (Google Drive, GitHub, ...)"
                />
                <div>
                  <label className={labelClass}>Hoặc upload tệp (≤ 2MB)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-[10px] text-neutral-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-neutral-200 file:text-neutral-800"
                  />
                  {submitFileMeta && (
                    <p className="text-[9px] text-neutral-500 mt-0.5">
                      Đã chọn: {submitFileMeta.name} ({Math.round(submitFileMeta.size / 1024)} KB)
                    </p>
                  )}
                </div>
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
            ) : (
              <p className="text-[10px] text-neutral-500">
                Chỉ thành viên được giao task mới được nộp bài.
              </p>
            )}
            {submissions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-neutral-700">Lịch sử nộp</p>
                {submissions.map((s) => (
                  <div key={s.submissionId} className="rounded border border-neutral-200 bg-white p-1.5 space-y-1">
                    <p className="text-[9px] font-medium text-neutral-500">
                      {getMemberName(s.userSso)} · {s.status}
                    </p>
                    <p className="text-[10px] text-neutral-800 whitespace-pre-wrap">{s.content}</p>
                    {renderAttachments(s.attachments, {
                      allowFileActions: isOwner || s.userSso === currentUserSso,
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* In Review: review + grade */}
        {phase === 'IN_REVIEW' && taskId && (
          <section className="rounded-md border border-amber-200 bg-amber-50/50 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Review</h3>
            {submissions.length === 0 ? (
              <p className="text-[10px] text-neutral-500">Chưa có bài nộp.</p>
            ) : (
              submissions.map((s) => {
                return (
                  <div key={s.submissionId} className="rounded border border-neutral-200 bg-white p-1.5 space-y-1">
                    <p className="text-[10px] font-medium text-neutral-500">
                      {getMemberName(s.userSso)} · {s.status}
                      {s.submittedAt ? ` · ${new Date(s.submittedAt).toLocaleString('vi-VN')}` : ''}
                    </p>
                    <p className="text-[10px] text-neutral-800 whitespace-pre-wrap">{s.content}</p>
                    {renderAttachments(s.attachments, { allowFileActions: isOwner })}
                    {s.grade != null && (
                      <p className="text-[9px] text-neutral-600">
                        Điểm: {s.grade}{s.feedback ? ` · ${s.feedback}` : ''}
                      </p>
                    )}
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
                            className={inputClass}
                            placeholder="Điểm"
                          />
                          <input
                            type="text"
                            value={reviewFeedback}
                            onChange={(e) => setReviewFeedback(e.target.value)}
                            className={inputClass}
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
                )
              })
            )}
            {!isOwner && (
              <p className="text-[10px] text-neutral-500">Chỉ Owner được chấm điểm / duyệt bài.</p>
            )}
          </section>
        )}

        {/* Done */}
        {isDone && (
          <section className="space-y-1.5 rounded-md border border-emerald-200 bg-emerald-50/40 p-2">
            <div>
              <label className={labelClass}>Completed date</label>
              <div className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white text-neutral-800">
                {completed ||
                  (task.completedAt
                    ? new Date(String(task.completedAt)).toLocaleString('vi-VN')
                    : '—')}
              </div>
            </div>
            <div>
              <label className={labelClass}>Actual hours</label>
              <div className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-md bg-white text-neutral-800 font-semibold">
                {actualHours != null ? `${actualHours} h` : '—'}
              </div>
              <p className="text-[9px] text-neutral-500 mt-0.5">
                Tính từ lúc task vào In Progress đến khi Done.
              </p>
            </div>
            {submissions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-neutral-700">Bài đã duyệt</p>
                {submissions.map((s) => (
                  <div key={s.submissionId} className="rounded border border-neutral-200 bg-white p-1.5 space-y-1">
                    <p className="text-[9px] font-medium text-neutral-500">{getMemberName(s.userSso)}</p>
                    <p className="text-[10px] text-neutral-800 whitespace-pre-wrap">{s.content}</p>
                    {renderAttachments(s.attachments, { allowFileActions: isOwner })}
                    <p className="text-[9px] text-neutral-500">
                      {s.status}
                      {s.grade != null ? ` · Điểm: ${s.grade}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <div className="shrink-0 flex gap-1.5 p-2 border-t border-neutral-200">
        {!isDone && (
          <Button variant="primary" size="sm" className="flex-1 py-1 text-xs h-7" onClick={handleSave}>
            Save
          </Button>
        )}
        {isDone && isOwner && taskId && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 py-1 text-xs h-7 !bg-error/10 !border-error/40 !text-error hover:!bg-error/20"
            disabled={deleteBusy}
            onClick={handleDelete}
          >
            {deleteBusy ? 'Đang xóa...' : 'Xóa task'}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="py-1 text-xs h-7" onClick={onClose}>
          {isDone ? 'Đóng' : 'Cancel'}
        </Button>
      </div>
    </div>
  )
}
