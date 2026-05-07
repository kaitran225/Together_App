import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AiBotIcon, Button, Card, ChatInputBar, CloseIcon, DocumentIcon, IconButton, Input, MenuIcon, Modal, Progress, QuizletQuizModal, Textarea } from '../../../components/common'
import { MOCK_QUIZLET_CARDS, SIDEBAR_CHATS, AI_SUPPORT_MESSAGES as MESSAGES, SUMMARY_HISTORY, MAX_FILE_SIZE_MB, ACCEPT_FILES, MAX_PDF_MB } from '../../../mocks'

export default function AiSupport() {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<{ id: string; file: File }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [summarizeOpen, setSummarizeOpen] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [summaryText, setSummaryText] = useState('')
  const [notes, setNotes] = useState('')
  const [quizletCards, setQuizletCards] = useState<typeof MOCK_QUIZLET_CARDS | null>(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const summarizeInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px]">
      <div className="flex-1 grid grid-cols-[20fr_50fr_30fr] min-h-0 rounded-2xl border-2 border-neutral-200 bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {/* Left: 20% */}
        <aside className="min-w-0 flex flex-col border-r-2 border-neutral-200 bg-neutral-50/80">
          <div className="p-3 border-b border-neutral-200">
            <Link
              to="/ai-support"
              className="inline-flex w-full items-center justify-center gap-2 font-medium rounded-xl px-4 py-2 text-sm min-h-[44px] bg-[var(--color-surface)] text-neutral-900 border border-neutral-900 hover:bg-[var(--color-cream-200)]"
            >
              + New chat
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <section>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-2 mb-2">Conversations</p>
              <ul className="space-y-0.5">
                {SIDEBAR_CHATS.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="#"
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        c.active
                          ? 'bg-accent-muted text-neutral-900'
                          : 'text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-neutral-200 flex-shrink-0 flex items-center justify-center text-neutral-500" aria-hidden>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </span>
                      <span className="min-w-0 truncate flex-1">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
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
              {quizletCards
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
              onClick={() => setQuizletCards(quizletCards ? null : MOCK_QUIZLET_CARDS)}
            >
              {quizletCards ? 'Hide Quizlet' : 'Generate Quizlet'}
            </Button>
            <Button variant="secondary" size="sm">Flashcards</Button>
            <Button variant="secondary" size="sm">Mindmaps</Button>
          </div>
          {quizletCards && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-2">Quizlet sets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quizletCards.map((card) => (
                  <Card key={card.id} className="p-4 border-2 border-neutral-200 flex flex-col min-h-[10rem]">
                    <div className="flex-1 min-h-0">
                      <p className="text-sm font-bold text-neutral-900">{card.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{card.subtitle}</p>
                    </div>
                    <div className="flex-shrink-0 pt-3 mt-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowQuizModal(true)}
                      >
                        Do the quiz
                      </Button>
                    </div>
                  </Card>
                ))}
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
            {MESSAGES.map((msg) => (
              <div key={msg.id} className={msg.role === 'assistant' ? 'flex justify-center' : 'flex justify-end'}>
                <div className={msg.role === 'assistant' ? 'flex gap-2 max-w-[85%]' : 'max-w-[85%]'}>
                  {msg.role === 'assistant' && (
                    <span className="w-7 h-7 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center overflow-hidden" aria-hidden>
                      <AiBotIcon className="w-6 h-6" />
                    </span>
                  )}
                  <div
                    className={`rounded-xl px-3 py-2 border-2 ${
                      msg.role === 'assistant'
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-600 text-xs'
                        : 'bg-accent-muted border-primary/20 text-neutral-900'
                    }`}
                  >
                    {msg.role === 'user' && <p className="text-[10px] font-semibold text-neutral-500 mb-0.5">You · {msg.time}</p>}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.role === 'assistant' && msg.time && <p className="text-[10px] text-neutral-500 mt-1">{msg.time}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t-2 border-neutral-200 shrink-0">
            <ChatInputBar
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSend={() => {}}
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
        <QuizletQuizModal onClose={() => setShowQuizModal(false)} />
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
              {MESSAGES.map((msg) => (
                <div key={msg.id} className={msg.role === 'assistant' ? 'flex justify-center' : 'flex justify-end'}>
                  <div className={msg.role === 'assistant' ? 'flex gap-2 max-w-[90%]' : 'max-w-[90%]'}>
                    {msg.role === 'assistant' && (
                      <span className="w-7 h-7 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center overflow-hidden" aria-hidden>
                        <AiBotIcon className="w-6 h-6" />
                      </span>
                    )}
                    <div
                      className={`rounded-xl px-3 py-2 border-2 ${
                        msg.role === 'assistant'
                          ? 'bg-neutral-100 border-neutral-200 text-neutral-600 text-xs'
                          : 'bg-accent-muted border-primary/20 text-neutral-900'
                      }`}
                    >
                      {msg.role === 'user' && <p className="text-[10px] font-semibold text-neutral-500 mb-0.5">You · {msg.time}</p>}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      {msg.role === 'assistant' && msg.time && <p className="text-[10px] text-neutral-500 mt-1">{msg.time}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t-2 border-neutral-200 bg-[var(--color-surface)]">
              <ChatInputBar
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={() => {}}
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
    </div>
  )
}
