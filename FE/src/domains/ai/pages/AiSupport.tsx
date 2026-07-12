import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AiBotIcon, Button, Card, ChatInputBar, CloseIcon, DocumentIcon, IconButton, Input, MenuIcon, Modal, Progress, QuizletQuizModal, Textarea } from '../../../components/common'
import { FlashcardModal } from '../../../components/FlashcardModal'
import { SUMMARY_HISTORY, MAX_FILE_SIZE_MB, ACCEPT_FILES, MAX_PDF_MB } from '../../../mocks'
import { workflowApi } from '../../../api/client'

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

export default function AiSupport() {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<{ id: string; file: File }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [summarizeOpen, setSummarizeOpen] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [summaryText, setSummaryText] = useState('')
  const [notes, setNotes] = useState('')
  const [quizletCards, setQuizletCards] = useState<any[] | null>(null)
  const [selectedFlashcardQuizId, setSelectedFlashcardQuizId] = useState<number | null>(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<number | undefined>(undefined)
  const summarizeInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    const newEntries = Array.from(list)
      .filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
      .map((f) => ({ id: `${Date.now()}-${f.name}`, file: f }))
    setAttachments((prev) => [...prev, ...newEntries])
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSummarizeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size <= MAX_PDF_MB * 1024 * 1024) setDroppedFile(file)
    if (summarizeInputRef.current) summarizeInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file?.type === 'application/pdf' && file.size <= MAX_PDF_MB * 1024 * 1024) setDroppedFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  // Real API state
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<any[]>([])

  const fetchConversations = async () => {
    try {
      const res = await workflowApi.getConversations()
      if (res.success && res.data) {
        setConversations(res.data)
        if (res.data.length > 0 && !activeConversationId) {
          setActiveConversationId(res.data[0].conversationId)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMessages = async (convId: number) => {
    try {
      const res = await workflowApi.getChatMessages(convId)
      if (res.success && res.data) {
        setMessages(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchConversations()
    fetchQuizSets()
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = async () => {
    try {
      const res = await workflowApi.createConversation(`Trò chuyện ngày ${new Date().toLocaleDateString()}`)
      if (res.success && res.data) {
        const newConv = res.data
        setConversations(prev => [newConv, ...prev])
        setActiveConversationId(newConv.conversationId)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async () => {
    const text = input.trim()
    const currentAttachments = [...attachments]
    if (!text && currentAttachments.length === 0) return
    setInput('')
    setAttachments([])

    let convId = activeConversationId
    if (!convId) {
      try {
        const res = await workflowApi.createConversation(`Trò chuyện ngày ${new Date().toLocaleDateString()}`)
        if (res.success && res.data) {
          convId = res.data.conversationId
          setConversations([res.data])
          setActiveConversationId(convId)
        } else {
          return
        }
      } catch (err) {
        console.error(err)
        return
      }
    }

    if (!convId) return

    // Optimistically add user message
    const tempUserMsg = {
      messageId: Date.now() + Math.random(),
      sender: 'USER',
      messageText: text || `[Đã gửi ${currentAttachments.length} tệp]`,
      sentAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      if (currentAttachments.length > 0) {
        setMessages(prev => [...prev, {
          messageId: Date.now() + Math.random(),
          sender: 'ASSISTANT',
          messageText: `Đã tải lên ${currentAttachments.length} file. Hệ thống đang tiến hành xử lý ngầm (tạo Mindmap, tạo 10 câu hỏi Flashcard). Quá trình này có thể mất vài phút. Hãy nhấn 'Refresh Quizzes' sau ít phút để kiểm tra.`,
          sentAt: new Date().toISOString()
        }])
        for (const att of currentAttachments) {
          const res = await workflowApi.uploadDocument(att.file)
          if (res.success && res.data && res.data.documentId) {
            const docId = res.data.documentId
            setLastUploadedDocumentId(docId)
            setSessionDocuments(prev => {
              if (prev.some(d => d.id === docId)) return prev
              return [...prev, { id: docId, name: att.file.name, status: res.data.processingStatus || 'PROCESSING' }]
            })
          }
        }
      }
      
      if (text) {
        await workflowApi.sendChatMessage(convId, text, lastUploadedDocumentId)
      }
      fetchMessages(convId)
      // Refresh quizzes in case BE generated new ones
      setTimeout(fetchQuizSets, 5000)
    } catch (err) {
      console.error(err)
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px]">
      <div className="flex-1 grid grid-cols-[20fr_50fr_30fr] min-h-0 rounded-2xl border-2 border-neutral-200 bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {/* Left: 20% */}
        <aside className="min-w-0 flex flex-col border-r-2 border-neutral-200 bg-neutral-50/80">
          <div className="p-3 border-b border-neutral-200">
            <Button
              variant="primary"
              onClick={handleNewChat}
              className="inline-flex w-full items-center justify-center gap-2 font-medium rounded-xl px-4 py-2 text-sm min-h-[44px]"
            >
              + New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <section>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-2">Conversations</p>
              <ul className="space-y-0.5">
                {conversations.map((c) => (
                  <li key={c.conversationId}>
                    <button
                      type="button"
                      onClick={() => setActiveConversationId(c.conversationId)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                        c.conversationId === activeConversationId
                          ? 'bg-accent-muted text-neutral-900 font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-neutral-200 flex-shrink-0 flex items-center justify-center text-neutral-500" aria-hidden>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </span>
                      <span className="min-w-0 truncate flex-1">{c.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            
            {/* Session Documents List (Context Selection) */}
            {sessionDocuments.length > 0 && (
              <section className="mt-4 border-t border-neutral-200 pt-4">
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-2">
                  Chat Context (Docs)
                </p>
                <div className="flex flex-col gap-2 px-2">
                  {sessionDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setLastUploadedDocumentId(doc.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 justify-between transition-all ${
                        lastUploadedDocumentId === doc.id
                          ? 'bg-primary text-white border-primary shadow-sm hover:opacity-90'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                      title={`${doc.name} (Trạng thái: ${doc.status || 'PROCESSING'})`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
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
                      </div>

                      <div 
                        onClick={(e) => handleDeleteDocument(e, doc.id)} 
                        className="ml-1 p-0.5 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center shrink-0"
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
                       className="px-2 py-1.5 mt-1 rounded-xl text-[10px] font-medium border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
                     >
                       Clear Context
                     </button>
                  )}
                </div>
              </section>
            )}
          </div>
          <div className="p-3 border-t border-neutral-200">
            <div className="rounded-xl bg-accent-muted border border-primary/20 p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-neutral-900">Tokens used</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-primary">64%</span>
              </div>
              <Progress value={64} max={100} className="h-2 rounded-full" />
            </div>
          </div>
        </aside>

        {/* Center: 50% — Focus Room layout */}
        <main className="min-w-0 flex flex-col p-6 gap-4 overflow-y-auto bg-[var(--color-surface)] border-r-2 border-neutral-200">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">Summary</h2>
            <Card className="p-4 min-h-[120px] border-2 border-neutral-200 text-neutral-500 text-sm">
              {quizletCards && quizletCards.length > 0
                ? 'AI has generated quizlet sets below. Click "Do the quiz" on any card to start.'
                : 'Session summary will appear here after you study.'}
            </Card>
          </section>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSummarizeOpen(true)}>
              Summarize
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchQuizSets}
            >
              Refresh Quizzes
            </Button>
            <Button variant="secondary" size="sm">Summary</Button>
            <Button variant="secondary" size="sm">Mindmaps</Button>
          </div>
          {quizletCards && quizletCards.length > 0 && (
            <section className="shrink-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">Quizlet sets</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {quizletCards.map((card) => {
                  const isFlashcardSet = card.source === 'FLASHCARD'
                  return (
                  <Card key={card.id} className={`p-4 border-2 flex flex-col min-h-[10rem] min-w-[220px] max-w-[280px] shrink-0 snap-start ${
                    isFlashcardSet 
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700' 
                      : 'border-neutral-200'
                  }`}>
                    <div className="flex-1 min-h-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          isFlashcardSet
                            ? 'bg-amber-200 text-amber-700'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {isFlashcardSet ? '🃏 Flashcard' : '📝 Quiz'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">{card.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{card.questionCount} câu</p>
                    </div>
                    <div className="flex-shrink-0 pt-3 mt-auto">
                      {isFlashcardSet ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full !bg-amber-500 !border-amber-500 hover:!bg-amber-600"
                          onClick={() => setSelectedFlashcardQuizId(card.id)}
                        >
                          Open Flashcards
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedQuizId(card.id)
                              setShowQuizModal(true)
                            }}
                          >
                            Do the quiz
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full mt-2"
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
            </section>
          )}
          <section className="mt-auto pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">Quick notes</h2>
            <div className="flex gap-2">
              <Textarea
                placeholder="Start writing notes..."
                className="flex-1 min-h-[80px] resize-y border-2 border-neutral-200"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button variant="secondary" size="sm" className="shrink-0 self-end">Add</Button>
            </div>
          </section>
        </main>

        {/* Right: 30% — Conversation chat */}
        <aside className="min-w-0 flex flex-col border-l-2 border-neutral-200 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-neutral-200">
            <AiBotIcon className="w-7 h-7" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-accent">
              Conversation
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'ASSISTANT';
              return (
                <div key={msg.messageId} className={isAssistant ? 'flex justify-start' : 'flex justify-end'}>
                  <div className={isAssistant ? 'flex gap-2 max-w-[85%]' : 'max-w-[85%]'}>
                    {isAssistant && (
                      <span className="w-7 h-7 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center overflow-hidden" aria-hidden>
                        <AiBotIcon className="w-6 h-6" />
                      </span>
                    )}
                    <div
                      className={`rounded-xl px-3 py-2 border-2 ${
                        isAssistant
                          ? 'bg-neutral-100 border-neutral-200 text-neutral-600 text-xs'
                          : 'bg-accent-muted border-primary/20 text-neutral-900'
                      }`}
                    >
                      {!isAssistant && <p className="text-[10px] font-semibold text-neutral-500 mb-0.5">You · {new Date(msg.sentAt).toLocaleTimeString()}</p>}
                      <p className="text-sm leading-relaxed">{msg.messageText}</p>
                      {isAssistant && msg.sentAt && <p className="text-[10px] text-neutral-500 mt-1">{new Date(msg.sentAt).toLocaleTimeString()}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t-2 border-neutral-200 shrink-0">
            <ChatInputBar
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSend={handleSendMessage}
              onFileChange={handleFileChange}
              acceptFiles={ACCEPT_FILES}
              placeholder="Type your question..."
              secondaryActions={
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSummarizeOpen(true)} className="!px-0 !py-0 min-h-0 text-xs font-medium text-neutral-700 hover:text-neutral-900">Summarize</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(true)} className="!px-0 !py-0 min-h-0 text-xs font-medium text-neutral-700 hover:text-neutral-900">Open chat in popup</Button>
                </>
              }
            />
          </div>
        </aside>
      </div>

      {showQuizModal && (
        <QuizletQuizModal quizId={selectedQuizId} onClose={() => setShowQuizModal(false)} />
      )}

      {/* Chat dialog popup */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Together AI - Chat" size="max-w-2xl">
          <div className="bg-[var(--color-surface)] rounded-2xl border-2 border-neutral-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <AiBotIcon className="w-8 h-8" />
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Together AI — Chat</h2>
              </div>
              <IconButton type="button" onClick={() => setDialogOpen(false)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900" label="Close" icon={<CloseIcon className="w-5 h-5" />} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'ASSISTANT';
                return (
                  <div key={msg.messageId} className={isAssistant ? 'flex justify-start' : 'flex justify-end'}>
                    <div className={isAssistant ? 'flex gap-2 max-w-[90%]' : 'max-w-[90%]'}>
                      {isAssistant && (
                        <span className="w-7 h-7 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center overflow-hidden" aria-hidden>
                          <AiBotIcon className="w-6 h-6" />
                        </span>
                      )}
                      <div
                        className={`rounded-xl px-3 py-2 border-2 ${
                          isAssistant
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-600 text-xs'
                            : 'bg-accent-muted border-primary/20 text-neutral-900'
                        }`}
                      >
                        {!isAssistant && <p className="text-[10px] font-semibold text-neutral-500 mb-0.5">You · {new Date(msg.sentAt).toLocaleTimeString()}</p>}
                        <MessageRenderer text={msg.messageText} />
                        {isAssistant && msg.sentAt && <p className="text-[10px] text-neutral-500 mt-1">{new Date(msg.sentAt).toLocaleTimeString()}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t-2 border-neutral-200 bg-[var(--color-surface)]">
              <ChatInputBar
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={handleSendMessage}
                onFileChange={handleFileChange}
                acceptFiles={ACCEPT_FILES}
                placeholder="Ask anything..."
                attachmentsSlot={
                  attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.map(({ id, file }) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs"
                        >
                          <span className="max-w-[100px] truncate">{file.name}</span>
                          <IconButton type="button" size="sm" variant="ghost" onClick={() => removeAttachment(id)} className="!p-0 min-h-0 text-neutral-500 hover:text-neutral-900" label={`Remove ${file.name}`} icon={<CloseIcon className="w-3 h-3" />} />
                        </span>
                      ))}
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>
      </Modal>

      {/* Summarize popup — same as outer (Meet AI / AI Support): drop file, history, executive summary */}
      <Modal open={summarizeOpen} onClose={() => setSummarizeOpen(false)} title="Summarize" size="max-w-4xl">
          <div className="bg-[var(--color-surface)] rounded-2xl border-2 border-neutral-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-neutral-200">
              <div className="flex items-center gap-2">
                <Link to="/focus-room">
                  <Button variant="primary" size="sm" className="rounded-lg text-xs font-bold">Focus room</Button>
                </Link>
                <IconButton type="button" onClick={() => setSummarizeOpen(false)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900" label="Close" icon={<CloseIcon className="w-5 h-5" />} />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1fr] min-h-0 overflow-hidden">
              <div className="p-4 border-r border-neutral-200 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide mb-2">Drop file here</p>
                  <Input ref={summarizeInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleSummarizeFile} aria-label="Choose PDF" />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => summarizeInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full min-h-[180px] rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
                  >
                    <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-sm font-semibold text-neutral-600">Drop PDF</span>
                    <span className="text-xs">Max {MAX_PDF_MB}MB</span>
                    {droppedFile && <span className="text-xs font-medium text-neutral-800 dark:text-primary mt-1 truncate max-w-full px-2">{droppedFile.name}</span>}
                  </Button>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">History</p>
                    <IconButton type="button" size="sm" variant="ghost" className="p-1 rounded text-neutral-500 hover:bg-neutral-200" label="Refresh" icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>} />
                  </div>
                  <ul className="space-y-1.5">
                    {SUMMARY_HISTORY.map((item) => (
                      <li key={item.id}>
                        <Button type="button" variant="ghost" size="sm" className="w-full !justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-left hover:bg-neutral-100 text-sm font-medium text-neutral-900">
                          <span className="text-neutral-400 shrink-0" aria-hidden><DocumentIcon className="w-4 h-4" /></span>
                          <span className="min-w-0 truncate flex-1">{item.name}</span>
                          <span className="text-[10px] text-neutral-500 shrink-0">{item.time}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-4 flex flex-col min-h-0">
                <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide mb-2 flex items-center gap-1">
                <MenuIcon className="w-3.5 h-3.5 text-neutral-500" />
                Executive summary</p>
                <div className="flex-1 min-h-[200px] rounded-xl border-2 border-neutral-200 bg-[var(--color-surface)] p-4 overflow-y-auto">
                  {summaryText ? (
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{summaryText}</p>
                  ) : (
                    <div className="space-y-2 text-neutral-300">
                      <div className="h-3 rounded bg-neutral-200 w-full" /><div className="h-3 rounded bg-neutral-200 w-4/5" /><div className="h-3 rounded bg-neutral-200 w-full" /><div className="h-3 rounded bg-neutral-200 w-3/4" /><div className="h-3 rounded bg-neutral-200 w-5/6" /><div className="h-3 rounded border border-dashed border-neutral-300 w-2/3" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" size="sm" className="rounded-lg bg-accent hover:bg-accent border-0" onClick={() => setSummaryText(droppedFile ? 'Summary will appear here after processing. (Mock: This is a placeholder summary for ' + droppedFile.name + '.)' : 'Drop or select a PDF first.')}>Summarize</Button>
                  <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => setSummaryText('')}>Download</Button>
                </div>
              </div>
            </div>
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
