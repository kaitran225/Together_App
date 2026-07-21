import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiBotIcon, Button, Card, ChatInputBar, Modal, QuizletQuizModal, Textarea } from '../../../components/common'
import { ThemeSwitch } from '../../../components/ThemeSwitch'
import { LanguageSwitch } from '../../../components/LanguageSwitch'
import { FlashcardModal } from '../../../components/FlashcardModal'
import { ACCEPT_FILES, MAX_FILE_SIZE_MB } from '../../../mocks'
import { workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'

const MessageRenderer = ({ text }: { text: string }) => {
  try {
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleanText.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        return (
          <>
            {firstBrace > 0 && <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{cleanText.substring(0, firstBrace).trim()}</p>}
            <div className="mt-2 text-xs bg-white/50 p-3 rounded-lg border border-primary/20 shadow-sm">
              <p className="font-bold mb-3 text-primary text-sm">{parsed.title || 'Mindmap'}</p>
            <ul className="pl-2 space-y-2 border-l-2 border-primary/30 ml-1">
              {parsed.nodes.map((node: any) => (
                <li key={node.id} className="relative before:absolute before:-left-[9px] before:top-2 before:w-2 before:h-0.5 before:bg-primary/30">
                  <span className="font-semibold text-neutral-800 bg-white px-1.5 py-0.5 rounded border border-neutral-200">{node.label}</span>
                  {node.children && node.children.length > 0 && (
                    <ul className="pl-4 mt-2 space-y-2 border-l-2 border-primary/20 ml-2">
                      {node.children.map((child: any) => (
                        <li key={child.id} className="relative before:absolute before:-left-[9px] before:top-2 before:w-2 before:h-0.5 before:bg-primary/20">
                          <span className="text-neutral-600">{child.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            </div>
            {lastBrace < cleanText.length - 1 && <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{cleanText.substring(lastBrace + 1).trim()}</p>}
          </>
        )
      }
    }
  } catch (e) {
    // ignore
  }
  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
}

export default function FocusRoom() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [showEndModal, setShowEndModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [quizletCards, setQuizletCards] = useState<any[] | null>(null)
  const [selectedFlashcardQuizId, setSelectedFlashcardQuizId] = useState<number | null>(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<number | undefined>(undefined)
  const [showQuizSection, setShowQuizSection] = useState(true)

  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaries, setSummaries] = useState<any[]>([])
  
  const [showMindmapModal, setShowMindmapModal] = useState(false)
  const [mindmaps, setMindmaps] = useState<any[]>([])

  const fetchQuizSets = async () => {
    try {
      const res = await workflowApi.getQuizSets()
      if (res.success && res.data) {
        setQuizletCards(res.data.map((q: any) => ({
          id: q.quizId,
          title: q.title,
          subtitle: q.description || `${q.questionCount || 0} questions`,
          source: q.source || 'AI_GENERATED',
          questionCount: q.questionCount || 0,
        })))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadSummaries = async () => {
    try {
      const res = await workflowApi.getSummaries()
      if (res.success && res.data) {
        setSummaries(res.data)
        setShowSummaryModal(true)
      }
    } catch (e) { console.error(e) }
  }

  const loadMindmaps = async () => {
    try {
      const res = await workflowApi.getMindmaps()
      if (res.success && res.data) {
        setMindmaps(res.data)
        setShowMindmapModal(true)
      }
    } catch (e) { console.error(e) }
  }

  const renderMindmapNodes = (nodes: any[]): any => {
    if (!nodes || !nodes.length) return null
    return (
      <ul className="pl-6 list-disc space-y-2 mt-2">
        {nodes.map((node: any, idx: number) => (
          <li key={idx} className="text-sm text-neutral-800 dark:text-neutral-200">
            <span className="font-semibold">{node.label}</span>
            {node.children && renderMindmapNodes(node.children)}
          </li>
        ))}
      </ul>
    )
  }

  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<{ id: string; file: File }[]>([])
  const [summarizeOpen, setSummarizeOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Timer & Session state
  const [seconds, setSeconds] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [expEarned, setExpEarned] = useState(0)
  const [isEnded, setIsEnded] = useState(false)

  const startedRef = useRef(false)

  // Real Chat states
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real Tasks states
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  const [lastUploadedDocumentId, setLastUploadedDocumentId] = useState<number | undefined>(undefined)
  const [sessionDocuments, setSessionDocuments] = useState<{ id: number; name: string; status?: string }[]>([])

  useEffect(() => {
    const hasActiveProcessing = sessionDocuments.some(
      doc => !doc.status || doc.status === 'PROCESSING' || doc.status === 'PENDING'
    )
    if (!hasActiveProcessing) return

    const interval = setInterval(async () => {
      try {
        const res = await workflowApi.getDocuments()
        if (res.success && res.data) {
          const documents = res.data
          setSessionDocuments(prev => {
            let changed = false
            const next = prev.map(doc => {
              const matched = documents.find((d: any) => d.documentId === doc.id)
              if (matched && matched.processingStatus !== doc.status) {
                changed = true
                return { ...doc, status: matched.processingStatus }
              }
              return doc
            })
            return changed ? next : prev
          })
        }
      } catch (err) {
        console.error('Error polling document statuses:', err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [sessionDocuments])

  useEffect(() => {
    // Start study session if not already in one
    const savedSessionId = localStorage.getItem('active_study_session_id')
    const savedStartTime = localStorage.getItem('active_study_session_start_time')

    if (savedSessionId) {
      setSessionId(Number(savedSessionId))
      if (savedStartTime) {
        const elapsed = Math.floor((Date.now() - new Date(savedStartTime).getTime()) / 1000)
        setSeconds(elapsed > 0 ? elapsed : 0)
      }
    } else {
      if (!startedRef.current) {
        startedRef.current = true
        const startTimeStr = new Date().toISOString()
        localStorage.setItem('active_study_session_start_time', startTimeStr)
        workflowApi.startSession(null, 'SELF_STUDY')
          .then((res) => {
            if (res.success && res.data) {
              setSessionId(res.data.sessionId)
              localStorage.setItem('active_study_session_id', String(res.data.sessionId))
            }
          })
          .catch((err) => console.error(err))
      }
    }

    loadNotes()
    loadTasks()
    initChat()
    fetchQuizSets()
  }, [])

  // Focus timer — stops when End is pressed or session ends
  useEffect(() => {
    if (isEnded || showEndModal) return
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isEnded, showEndModal])

  const initChat = async () => {
    try {
      const res = await workflowApi.getConversations()
      if (res.success && res.data && res.data.length > 0) {
        // Find solo or general conversations
        const activeConv = res.data.find((c: any) => c.contextType === 'SOLO') || res.data[0]
        setConversationId(activeConv.conversationId)
        loadChatMessages(activeConv.conversationId)
      } else {
        const createRes = await workflowApi.createConversation('Focus Study Session', 'SOLO')
        if (createRes.success && createRes.data) {
          setConversationId(createRes.data.conversationId)
        }
      }
    } catch (e) {
      console.error('Error initializing chat:', e)
    }
  }

  const loadChatMessages = async (convId: number) => {
    try {
      const res = await workflowApi.getChatMessages(convId)
      if (res.success && res.data) {
        setMessages(res.data)
      }
    } catch (e) {
      console.error('Error loading chat messages:', e)
    }
  }

  const loadNotes = () => {
    workflowApi.getNotes()
      .then((res) => {
        if (res.success && res.data) {
          setSavedNotes(res.data)
        }
      })
      .catch((err) => console.error(err))
  }

  const loadTasks = async () => {
    setIsLoadingTasks(true)
    try {
      const res = await workflowApi.getFocusRoomTasks()
      if (res.success && res.data) {
        const mapped = res.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          due: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Personal Task',
          isCompleted: t.isCompleted
        }))
        const sorted = [...mapped].sort((a: any, b: any) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1
          }
          return 0
        })
        setTasks(sorted)
      }
    } catch (e) {
      console.error('Error loading tasks:', e)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    try {
      const res = await workflowApi.createFocusRoomTask(
        newTaskTitle.trim(),
        newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
      )
      if (res.success) {
        setNewTaskTitle('')
        setNewTaskDueDate('')
        setShowAddTaskModal(false)
        await loadTasks()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleTaskCompletion = async (task: any) => {
    try {
      const res = await workflowApi.updateFocusRoomTask(task.id, undefined, undefined, !task.isCompleted)
      if (res.success) {
        await loadTasks()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await workflowApi.deleteFocusRoomTask(taskId)
      if (res.success) {
        await loadTasks()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddNote = async () => {
    if (!notes.trim()) return
    try {
      const res = await workflowApi.createNote(notes.trim())
      if (res.success) {
        setNotes('')
        loadNotes()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await workflowApi.deleteNote(noteId)
      if (res.success) {
        loadNotes()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (text: string) => {
    const currentAttachments = [...attachments]
    if (!text.trim() && currentAttachments.length === 0) return
    if (!conversationId) return

    setInput('')
    setAttachments([])

    const tempUserMsg = {
      messageId: Date.now() + Math.random(),
      sender: 'USER',
      messageText: text.trim() || `[Đã gửi ${currentAttachments.length} tệp]`,
      sentAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      if (currentAttachments.length > 0) {
        setMessages(prev => [...prev, {
          messageId: Date.now() + Math.random(),
          sender: 'ASSISTANT',
          messageText: `Đã tải lên ${currentAttachments.length} file. Hệ thống đang tiến hành xử lý ngầm (trích xuất văn bản, tạo Mindmap, tạo 10 câu hỏi Flashcard). Quá trình này có thể mất vài phút. Bạn có thể nhấn 'Refresh Quizzes' sau đó để tải lại danh sách.`,
          sentAt: new Date().toISOString()
        }])
        for (const att of currentAttachments) {
          const res = await workflowApi.uploadDocument(att.file)
          if (res.success && res.data && res.data.documentId) {
            const docId = res.data.documentId
            setLastUploadedDocumentId(docId)
            setSessionDocuments(prev => {
              // Avoid duplicates
              if (prev.some(d => d.id === docId)) return prev
              return [...prev, { id: docId, name: att.file.name, status: res.data.processingStatus || 'PROCESSING' }]
            })
          }
        }
      }
      if (text.trim()) {
        await workflowApi.sendChatMessage(conversationId, text.trim(), lastUploadedDocumentId)
      }
      await loadChatMessages(conversationId)
      setTimeout(fetchQuizSets, 5000)
    } catch (e) {
      console.error('Error sending message:', e)
    }
  }

  const handleDeleteDocument = async (e: React.MouseEvent, docId: number) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      const res = await workflowApi.deleteDocument(docId)
      if (res.success) {
        setSessionDocuments(prev => prev.filter(d => d.id !== docId))
        if (lastUploadedDocumentId === docId) {
          setLastUploadedDocumentId(undefined)
        }
      } else {
        alert('Failed to delete document.')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting document.')
    }
  }

  const handleEndSession = async () => {
    if (sessionId) {
      try {
        const res = await workflowApi.endSession(sessionId)
        if (res.success && res.data) {
          setExpEarned(res.data.expEarned || 0)
          localStorage.removeItem('active_study_session_id')
          localStorage.removeItem('active_study_session_start_time')
          await refreshProfile()
          setIsEnded(true)
        }
      } catch (err) {
        console.error(err)
        localStorage.removeItem('active_study_session_id')
        localStorage.removeItem('active_study_session_start_time')
        setIsEnded(true)
      }
    } else {
      setIsEnded(true)
    }
  }

  const handleNewChatSession = async () => {
    try {
      const createRes = await workflowApi.createConversation('Focus Study Session', 'SOLO')
      if (createRes.success && createRes.data) {
        setConversationId(createRes.data.conversationId)
        setMessages([])
      }
    } catch (e) {
      console.error('Error starting new chat session:', e)
    }
  }

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    const newEntries = Array.from(list)
      .filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
      .map((f) => ({ id: `${Date.now()}-${f.name}`, file: f }))
    setAttachments((prev) => [...prev, ...newEntries])
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[var(--color-background)] overflow-hidden">
      {/* Header: just Focus Room bar */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 dark:text-neutral-500" aria-hidden>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </span>
          <h1 className="text-xl font-bold text-neutral-900 uppercase tracking-wide">Focus Room</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <LanguageSwitch />
          <span className="px-4 py-2 rounded-lg bg-[var(--color-charcoal)] border border-[var(--color-border)] font-mono text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatTime(seconds)}
          </span>
          <Button
            variant="primary"
            size="sm"
            className="!bg-error !border-error hover:!opacity-90"
            onClick={() => {
              setIsEnded(false)
              setShowEndModal(true)
            }}
          >
            End
          </Button>
          <span className="w-9 h-9 rounded-full bg-[var(--color-charcoal)] border border-[var(--color-border)]" aria-hidden />
        </div>
      </header>

      {/* Main: 3 columns on md+; stacked on mobile with center first */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[20fr_60fr_20fr] min-h-0 bg-[var(--color-background)] overflow-y-auto md:overflow-hidden">
        {/* Left sidebar */}
        <aside className="order-2 md:order-1 min-w-0 flex flex-col gap-4 p-4 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto max-h-72 md:max-h-none">
          <Card className="p-4 border border-[var(--color-border)] shadow-none">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-highlight mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 23c-.2 0-.4-.1-.5-.2-.3-.2-7.5-5.2-9.2-6.4-.4-.3-.5-.8-.2-1.2.3-.4.8-.5 1.2-.2 1.5 1 7.3 5 8.7 5.9.4.2.6.6.6 1.1 0 .5-.2.9-.6 1.1l-1.2.8c-.3.2-.7.2-1 .1l-1.2-.6c-.2-.1-.4-.3-.5-.5l-.6-1.2c-.2-.3-.1-.7.1-1l.8-1.2c.2-.4.2-.9-.1-1.3-.6-.8-1.4-1.5-2.2-2.1-1.2-.9-2.5-1.6-3.8-2.1-.4-.2-.9-.1-1.2.2l-1 1.2c-.2.3-.2.7 0 1l.6 1.2c.1.2.3.4.5.5l1.2.6c.3.1.7.1 1-.1l1.2-.8c.4-.2.9-.2 1.3.1.8.6 1.6 1.3 2.2 2.1.2.4.2.9-.1 1.3l-.8 1.2c-.2.3-.2.7-.1 1l.6 1.2c.1.2.3.4.5.5l1.2.6c.3.1.7.2 1-.1l1.2-.8c.5-.3 1.1-.2 1.4.3.2.3.2.7.1 1.1-1.7 1.2-9.2 6.4-9.2 6.4-.2.1-.3.2-.5.2z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-400">Current streak</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-highlight">{user?.streak ?? 0} Days</p>
          </Card>
          
          <Card className="p-4 border border-[var(--color-border)] shadow-none flex-1 min-h-0 flex flex-col rounded-2xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-accent mb-3">Today's work</h2>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5">
              {isLoadingTasks ? (
                <p className="text-xs text-neutral-500">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-xs text-neutral-500">No tasks assigned today.</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className={`flex items-center gap-3 bg-[var(--color-background)] border p-2.5 rounded-xl group transition-all duration-200 ${
                    t.isCompleted 
                      ? 'border-[var(--color-border)] opacity-60' 
                      : 'border-[var(--color-border)] hover:border-primary hover:shadow-sm'
                  }`}>
                    <button
                      type="button"
                      onClick={() => handleToggleTaskCompletion(t)}
                      className={`w-6 h-6 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                        t.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'border-neutral-450 hover:bg-primary/10 hover:border-primary'
                      }`}
                      title={t.isCompleted ? "Mark as uncompleted" : "Mark as completed"}
                    >
                      {t.isCompleted ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate transition-all ${
                        t.isCompleted ? 'text-neutral-450 line-through' : 'text-neutral-900 dark:text-neutral-100'
                      }`}>{t.title}</p>
                      <p className={`text-[10px] truncate transition-all ${
                        t.isCompleted ? 'text-neutral-450 line-through' : 'text-neutral-500'
                      }`}>{t.due}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-450 hover:text-error ml-auto shrink-0 transition-all p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                      title="Delete task"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full border border-[var(--color-border)] text-xs rounded-xl"
              onClick={() => setShowAddTaskModal(true)}
            >
              + Add Task
            </Button>
          </Card>

          <Card className="p-4 border border-[var(--color-border)] shadow-none">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-400 mb-3">Achievements</h2>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <span key={i} className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-charcoal)]" aria-hidden />
              ))}
            </div>
          </Card>
        </aside>

        {/* Center: AI Assistant & Tools */}
        <main className="order-1 md:order-2 min-w-0 flex flex-col p-4 md:p-6 gap-4 bg-[var(--color-surface)] border-b md:border-b-0 md:border-r border-[var(--color-border)] min-h-[55vh] md:min-h-0 md:h-[calc(100vh-4.5rem)] overflow-hidden">
          {/* Top section: AI tools */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-800 dark:text-neutral-400">AI Study Assistant</h2>
              <div className="flex gap-2">
                <Button
                  variant={showQuizSection ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => {
                    setShowQuizSection(!showQuizSection)
                    if (!showQuizSection) fetchQuizSets()
                  }}
                >
                 {showQuizSection ? 'Hide Quizzes' : 'Show Quizzes'}
                </Button>
                <Button variant="secondary" size="sm" onClick={loadSummaries}>Summary</Button>
                <Button variant="secondary" size="sm" onClick={loadMindmaps}>Mindmaps</Button>
              </div>
            </div>
            
            {/* Session Documents List (Context Selection) */}
            {sessionDocuments.length > 0 && (
              <div className="mb-2 shrink-0">
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Select Context for Chat Q&A
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessionDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setLastUploadedDocumentId(doc.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-medium border flex items-center gap-1.5 transition-all ${
                        lastUploadedDocumentId === doc.id
                          ? 'bg-primary text-white border-primary shadow-sm hover:opacity-90'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                      title={`${doc.name} (Trạng thái: ${doc.status || 'PROCESSING'})`}
                    >
                      <span className="truncate max-w-[120px]">{doc.name}</span>
                      
                      {/* Show spinner when processing */}
                      {(!doc.status || doc.status === 'PROCESSING' || doc.status === 'PENDING') && (
                        <svg className="animate-spin h-3 w-3 text-current shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}

                      {doc.status === 'FAILED' && (
                        <span className="text-red-500 shrink-0" title="Xử lý lỗi ⚠️">⚠️</span>
                      )}

                      {doc.status === 'COMPLETED' && lastUploadedDocumentId === doc.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      )}

                      {doc.status === 'COMPLETED' && lastUploadedDocumentId !== doc.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}

                      <div 
                        onClick={(e) => handleDeleteDocument(e, doc.id)} 
                        className="ml-1 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors flex items-center justify-center shrink-0"
                        title="Delete document"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </button>
                  ))}
                  {lastUploadedDocumentId && (
                     <button
                       onClick={() => setLastUploadedDocumentId(undefined)}
                       className="px-2 py-1.5 rounded-xl text-[10px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                     >
                       Clear Context
                     </button>
                  )}
                </div>
              </div>
            )}

            {/* Generated Quizlets */}
            {showQuizSection && (
              quizletCards && quizletCards.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 animate-scale-in snap-x shrink-0">
              {quizletCards.map((card) => {
                const isFlashcardSet = card.source === 'FLASHCARD'
                return (
                <Card 
                  key={card.id} 
                  className={`p-3 border flex flex-col justify-between min-h-[110px] w-[200px] shrink-0 rounded-2xl shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md snap-start group ${
                    isFlashcardSet 
                      ? 'border-amber-300/80 dark:border-amber-700 bg-amber-50 dark:bg-amber-950' 
                      : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isFlashcardSet
                          ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {isFlashcardSet ? '🃏 Flashcard' : '📝 Quiz'}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-neutral-800 dark:text-neutral-100 leading-tight line-clamp-2 min-h-[26px]">
                      {card.title}
                    </p>
                    <p className="text-[8px] text-neutral-500">{card.questionCount} câu</p>
                  </div>
                  <div className="flex gap-1.5 mt-1.5 w-full">
                    {isFlashcardSet ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-[9px] font-semibold py-1 rounded-xl transition-all duration-200 ease-in-out hover:scale-[1.03] active:scale-[0.98] hover:shadow-sm whitespace-nowrap px-0 !bg-amber-500 !border-amber-500 hover:!bg-amber-600"
                        onClick={() => setSelectedFlashcardQuizId(card.id)}
                      >
                        Open Flashcards
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-[9px] font-semibold py-1 rounded-xl transition-all duration-200 ease-in-out hover:scale-[1.03] active:scale-[0.98] hover:shadow-sm whitespace-nowrap px-0"
                          onClick={() => {
                            setSelectedQuizId(card.id)
                            setShowQuizModal(true)
                          }}
                        >
                          Start Quiz
                        </Button>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-[9px] font-semibold py-1 rounded-xl transition-all duration-200 ease-in-out hover:scale-[1.03] active:scale-[0.98] hover:bg-neutral-100 dark:hover:bg-neutral-800 whitespace-nowrap px-0"
                          onClick={() => setSelectedFlashcardQuizId(card.id)}
                        >
                          Flashcards
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
                )
              })}
            </div>
            ) : (
              <Card className="p-3 border border-[var(--color-border)] bg-[var(--color-accent-muted)] rounded-2xl flex items-center justify-center text-center">
                <div className="text-xs text-neutral-600 dark:text-neutral-450 font-medium">
                  ⚡ Use the AI tools above to generate interactive study sets, flashcards, or mindmaps!
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom section: Chat box (takes remaining height) */}
          <div className="flex-1 min-h-0 flex flex-col border border-[var(--color-border)] rounded-3xl bg-[var(--color-background)] overflow-hidden mt-4">
            <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-charcoal)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-300">AI Chat Help</span>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] h-6 py-0 px-2" onClick={handleNewChatSession}>
                New Session
              </Button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                  <AiBotIcon className="w-10 h-10 text-neutral-300 mb-2" />
                  <p className="text-sm font-semibold">Welcome to your Focus Room!</p>
                  <p className="text-xs max-w-xs mt-1">Ask questions or paste content to get detailed explanations from your AI assistant.</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isAi = m.sender?.toLowerCase() === 'assistant' || m.ai
                  return (
                    <div key={m.messageId || i} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                      <div className={`flex gap-2 max-w-[80%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                        {isAi && (
                          <span className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-850 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[var(--color-border)]">
                            <AiBotIcon className="w-5 h-5 text-primary" />
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm leading-relaxed border shadow-sm ${
                            isAi
                              ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-neutral-850 dark:text-neutral-200'
                              : 'bg-primary text-primary-foreground border-transparent'
                          }`}
                        >
                          {!isAi && (
                            <p className="text-[9px] font-bold opacity-75 mb-0.5">
                              You
                            </p>
                          )}
                          <MessageRenderer text={m.messageText || m.text} />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-charcoal)] shrink-0">
              <ChatInputBar
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={() => handleSendMessage(input)}
                onFileChange={handleFileChange}
                acceptFiles={ACCEPT_FILES}
                placeholder="Ask your AI assistant..."
                attachmentCount={attachments.length}
              />
            </div>
          </div>
        </main>

        {/* Right Sidebar: Quick Notes */}
        <aside className="order-3 min-w-0 flex flex-col p-4 border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-surface)] max-h-80 md:max-h-none md:h-[calc(100vh-4.5rem)] overflow-hidden">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-accent mb-3 shrink-0">Quick Notes</h2>
          
          {/* Notes list */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
            {savedNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500">
                <p className="text-xs">No saved notes yet.</p>
              </div>
            ) : (
              savedNotes.map((note) => (
                <div key={note.noteId} className="flex justify-between items-start gap-2 p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-neutral-800 hover:border-neutral-400 transition-colors">
                  <p className="flex-1 break-words whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.noteId)}
                    className="text-error hover:text-error/80 text-[10px] font-extrabold shrink-0 ml-1"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Note Input */}
          <div className="mt-auto shrink-0 border-t border-[var(--color-border)] pt-3 bg-[var(--color-surface)]">
            <Textarea
              placeholder="Start typing notes..."
              className="w-full min-h-[90px] resize-none border border-[var(--color-border)] text-xs py-2 px-3 rounded-xl focus:ring-1 focus:ring-primary bg-[var(--color-background)]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button variant="tonal" size="sm" className="w-full mt-2 rounded-xl" onClick={handleAddNote}>Save Note</Button>
          </div>
        </aside>
      </div>

      <Modal open={summarizeOpen} onClose={() => setSummarizeOpen(false)} title="Summarize">
        <p className="text-sm text-neutral-600 mb-4">Summarize feature — coming soon.</p>
        <Button variant="primary" size="sm" onClick={() => setSummarizeOpen(false)}>Close</Button>
      </Modal>
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Open chat in popup">
        <p className="text-sm text-neutral-600 mb-4">Chat popup — coming soon.</p>
        <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>Close</Button>
      </Modal>

      {showQuizModal && (
        <QuizletQuizModal quizId={selectedQuizId} onClose={() => setShowQuizModal(false)} />
      )}

      {/* Summary Modal */}
      <Modal open={showSummaryModal} onClose={() => setShowSummaryModal(false)} title="Document Summaries">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {summaries.length === 0 ? (
            <p className="text-sm text-neutral-500">No summaries found.</p>
          ) : (
            summaries.map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <p className="text-xs font-bold text-neutral-500 mb-3">{new Date(s.generatedAt).toLocaleString()}</p>
                <div className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">{s.content}</div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Mindmaps Modal */}
      <Modal open={showMindmapModal} onClose={() => setShowMindmapModal(false)} title="Document Mindmaps">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {mindmaps.length === 0 ? (
            <p className="text-sm text-neutral-500">No mindmaps found.</p>
          ) : (
            mindmaps.map((m, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <h3 className="text-md font-extrabold text-primary mb-4">{m.title}</h3>
                {(() => {
                  try {
                    const data = JSON.parse(m.content)
                    return (
                      <div className="mt-2 bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)] overflow-x-auto">
                        {data.title && <p className="font-bold text-base mb-3 text-neutral-900 dark:text-neutral-100">{data.title}</p>}
                        {renderMindmapNodes(data.nodes)}
                      </div>
                    )
                  } catch (e) {
                    return <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  }
                })()}
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal open={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} title="Create Personal Task">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Task Title</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-[var(--color-border)]">
            <Button variant="secondary" size="sm" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>Create Task</Button>
          </div>
        </div>
      </Modal>

      {/* End session modal — large, app theme, session statistics */}
      <Modal 
        open={showEndModal} 
        onClose={() => {
          if (!isEnded) {
            setShowEndModal(false)
          } else {
            navigate('/dashboard')
          }
        }} 
        size={isEnded ? "max-w-xl" : "max-w-md"} 
        title={isEnded ? "Session Completed!" : "End Study Session"}
      >
        <div className="w-full rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-none border border-[var(--color-border)] overflow-hidden">
          {!isEnded ? (
            <>
              <div className="bg-[var(--color-accent-muted)] px-8 pt-10 pb-12">
                <p className="text-xl font-bold text-neutral-900 text-center mb-6">
                  Are you sure you want to end your study session?
                </p>
                <div className="flex justify-center">
                  <div className="rounded-2xl bg-[var(--color-charcoal)] border border-[var(--color-border)] px-6 py-5 text-center min-w-[180px]">
                    <p className="text-3xl font-bold text-neutral-900 tabular-nums">{formatTime(seconds)}</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-500 uppercase tracking-wide mt-1.5">Time studied</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-[var(--color-border)] bg-[var(--color-background)]">
                <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowEndModal(false)}>
                  Continue study
                </Button>
                <Button variant="primary" size="md" className="flex-1 !bg-error !border-error hover:!opacity-90" onClick={handleEndSession}>
                  End Session
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[var(--color-accent-muted)] px-8 pt-10 pb-12">
                <p className="text-2xl md:text-3xl font-extrabold text-neutral-900 text-center mb-10 uppercase tracking-wide">
                  Done! You did well today.
                </p>
                <div className="flex justify-center gap-4 md:gap-8">
                  <div className="flex-1 max-w-[140px] rounded-2xl bg-[var(--color-charcoal)] border border-[var(--color-border)] px-4 py-5 text-center shadow-none">
                    <p className="text-2xl md:text-3xl font-bold text-neutral-900 tabular-nums">{formatTime(seconds)}</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-500 uppercase tracking-wide mt-1.5">Time studied</p>
                  </div>
                  <div className="flex-1 max-w-[140px] rounded-2xl bg-[var(--color-charcoal)] border border-[var(--color-border)] px-4 py-5 text-center shadow-none">
                    <p className="text-2xl md:text-3xl font-bold text-neutral-900 tabular-nums">+{expEarned}</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-500 uppercase tracking-wide mt-1.5">Exp Earned</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-[var(--color-border)] bg-[var(--color-background)]">
                <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {selectedFlashcardQuizId && (
        <FlashcardModal
          quizId={selectedFlashcardQuizId}
          onClose={() => setSelectedFlashcardQuizId(null)}
        />
      )}
    </div>
  )
}
