import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiBotIcon, Button, Card, ChatInputBar, Modal, QuizletQuizModal, Textarea } from '../../../components/common'
import { ThemeSwitch } from '../../../components/ThemeSwitch'
import { MOCK_QUIZLET_CARDS, ACCEPT_FILES, MAX_FILE_SIZE_MB } from '../../../mocks'
import { workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'

export default function FocusRoom() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [showEndModal, setShowEndModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [quizletCards, setQuizletCards] = useState<typeof MOCK_QUIZLET_CARDS | null>(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
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

  // Real Tasks states
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  useEffect(() => {
    // Start study session if not already in one
    const savedSessionId = localStorage.getItem('active_study_session_id')
    if (savedSessionId) {
      setSessionId(Number(savedSessionId))
    } else {
      if (startedRef.current) return
      startedRef.current = true
      workflowApi.startSession(null, 'SELF_STUDY')
        .then((res) => {
          if (res.success && res.data) {
            setSessionId(res.data.sessionId)
            localStorage.setItem('active_study_session_id', String(res.data.sessionId))
          }
        })
        .catch((err) => console.error(err))
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    loadNotes()
    loadTasks()
    initChat()

    return () => clearInterval(interval)
  }, [])

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
        const uncompleted = res.data.filter((t: any) => !t.isCompleted).map((t: any) => ({
          id: t.id,
          title: t.title,
          due: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Personal Task',
          isCompleted: t.isCompleted
        }))
        setTasks(uncompleted)
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

  const handleCompleteTask = async (task: any) => {
    try {
      const res = await workflowApi.updateFocusRoomTask(task.id, undefined, undefined, true)
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
    if (!text.trim() || !conversationId) return
    const tempUserMsg = {
      messageId: Date.now(),
      sender: 'USER',
      messageText: text,
      sentAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])
    setInput('')

    try {
      const res = await workflowApi.sendChatMessage(conversationId, text.trim())
      if (res.success) {
        await loadChatMessages(conversationId)
      }
    } catch (e) {
      console.error('Error sending message:', e)
    }
  }

  const handleEndSession = async () => {
    if (sessionId) {
      try {
        const res = await workflowApi.endSession(sessionId)
        if (res.success && res.data) {
          setExpEarned(res.data.expEarned || 0)
          localStorage.removeItem('active_study_session_id')
          await refreshProfile()
          setIsEnded(true)
        }
      } catch (err) {
        console.error(err)
        setIsEnded(true)
      }
    } else {
      setIsEnded(true)
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
          <span className="px-4 py-2 rounded-lg bg-[var(--color-charcoal)] border border-[var(--color-border)] font-mono text-sm tabular-nums text-neutral-900">
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

      {/* Main: 3 columns 20% | 60% | 20% */}
      <div className="flex-1 grid grid-cols-[20fr_60fr_20fr] min-h-0 bg-[var(--color-background)]">
        {/* Left sidebar */}
        <aside className="min-w-0 flex flex-col gap-4 p-4 border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto">
          <Card className="p-4 border border-[var(--color-border)] shadow-none">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-highlight mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 23c-.2 0-.4-.1-.5-.2-.3-.2-7.5-5.2-9.2-6.4-.4-.3-.5-.8-.2-1.2.3-.4.8-.5 1.2-.2 1.5 1 7.3 5 8.7 5.9.4.2.6.6.6 1.1 0 .5-.2.9-.6 1.1l-1.2.8c-.3.2-.7.2-1 .1l-1.2-.6c-.2-.1-.4-.3-.5-.5l-.6-1.2c-.2-.3-.1-.7.1-1l.8-1.2c.2-.4.2-.9-.1-1.3-.6-.8-1.4-1.5-2.2-2.1-1.2-.9-2.5-1.6-3.8-2.1-.4-.2-.9-.1-1.2.2l-1 1.2c-.2.3-.2.7 0 1l.6 1.2c.1.2.3.4.5.5l1.2.6c.3.1.7.1 1-.1l1.2-.8c.4-.2.9-.2 1.3.1.8.6 1.6 1.3 2.2 2.1.2.4.2.9-.1 1.3l-.8 1.2c-.2.3-.2.7-.1 1l.6 1.2c.1.2.3.4.5.5l1.2.6c.3.1.7.2 1-.1l1.2-.8c.5-.3 1.1-.2 1.4.3.2.3.2.7.1 1.1-1.7 1.2-9.2 6.4-9.2 6.4-.2.1-.3.2-.5.2z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-400">Current streak</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-highlight">{(user as any)?.streak ?? 0} Days</p>
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
                  <div key={t.id} className="flex items-start gap-2 bg-[var(--color-background)] border border-[var(--color-border)] p-2 rounded-xl group hover:border-primary transition-colors">
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(t)}
                      className="w-4 h-4 rounded-full border border-neutral-400 mt-0.5 shrink-0 flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-colors"
                      title="Mark as completed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">{t.title}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{t.due}</p>
                    </div>
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
        <main className="min-w-0 flex flex-col p-6 gap-4 bg-[var(--color-surface)] border-r border-[var(--color-border)] h-[calc(100vh-4.5rem)] overflow-hidden">
          {/* Top section: AI tools */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-neutral-800 dark:text-neutral-400">AI Study Assistant</h2>
              <div className="flex gap-2">
                <Button
                  variant={quizletCards ? "tonal" : "secondary"}
                  size="sm"
                  onClick={() => setQuizletCards(quizletCards ? null : MOCK_QUIZLET_CARDS)}
                >
                  {quizletCards ? 'Hide Quizlet' : 'Generate Quizlet'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => alert('Flashcards generation coming soon...')}>Flashcards</Button>
                <Button variant="secondary" size="sm" onClick={() => alert('Mindmaps generation coming soon...')}>Mindmaps</Button>
              </div>
            </div>

            {/* Generated Quizlets */}
            {quizletCards ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-scale-in">
                {quizletCards.map((card) => (
                  <Card key={card.id} className="p-3 border border-[var(--color-border)] flex flex-col justify-between bg-[var(--color-background)] min-h-[110px] rounded-2xl shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-tight">{card.title}</p>
                      <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{card.subtitle}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full mt-2 text-[10px]"
                      onClick={() => setShowQuizModal(true)}
                    >
                      Start Quiz
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-3 border border-[var(--color-border)] bg-[var(--color-accent-muted)] rounded-2xl flex items-center justify-center text-center">
                <div className="text-xs text-neutral-600 dark:text-neutral-450 font-medium">
                  ⚡ Use the AI tools above to generate interactive study sets, flashcards, or mindmaps!
                </div>
              </Card>
            )}
          </div>

          {/* Bottom section: Chat box (takes remaining height) */}
          <div className="flex-1 min-h-0 flex flex-col border border-[var(--color-border)] rounded-3xl bg-[var(--color-background)] overflow-hidden">
            <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-charcoal)] flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-300">AI Chat Help</span>
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
                          <p className="whitespace-pre-wrap">{m.messageText || m.text}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
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
                secondaryActions={
                  <>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSummarizeOpen(true)} className="!px-0 !py-0 min-h-0 text-[10px] font-bold text-neutral-500 hover:text-neutral-800">Summarize</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(true)} className="!px-0 !py-0 min-h-0 text-[10px] font-bold text-neutral-500 hover:text-neutral-800">Open Popup</Button>
                  </>
                }
              />
            </div>
          </div>
        </main>

        {/* Right Sidebar: Quick Notes */}
        <aside className="min-w-0 flex flex-col p-4 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-[calc(100vh-4.5rem)] overflow-hidden">
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
        <QuizletQuizModal onClose={() => setShowQuizModal(false)} />
      )}

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
    </div>
  )
}
