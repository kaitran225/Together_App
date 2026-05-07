import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AiBotIcon, AttachIcon, Button, Card, ChatInputBar, CloseIcon, DocumentIcon, IconButton, Input, MenuIcon, Modal, Textarea } from '../../../components/common'
import { QUICK_PROMPTS, RECENT_CHATS, MEET_AI_MESSAGES as MESSAGES, MAX_FILE_SIZE_MB, ACCEPT_FILES, MAX_PDF_MB, SUMMARY_HISTORY } from '../../../mocks'

export default function MeetAi() {
  const [query, setQuery] = useState('')
  const [attachments, setAttachments] = useState<{ id: string; file: File }[]>([])
  const [chatDialogOpen, setChatDialogOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [summarizeOpen, setSummarizeOpen] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [summaryText, setSummaryText] = useState('')
  const summarizeInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    const newEntries = Array.from(list)
      .filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
      .map((f) => ({ id: `${Date.now()}-${f.name}`, file: f }))
    setAttachments((prev) => [...prev, ...newEntries])
  }

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id))

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
      <header className="lg:col-span-3">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Meet AI Tutor</h1>
        <p className="text-neutral-600 mt-1">Get instant help with concepts, summaries, and practice. Ask anything or paste your notes.</p>
      </header>

      {/* Column 1: Ask a question */}
      <Card className="p-5 shadow-sm border-2 border-neutral-200 min-w-0">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3">Ask a question or paste content</h2>
        <div className="relative mb-4">
          <Textarea
            id="ai-question"
            placeholder="e.g. Explain photosynthesis, summarize chapter 3, or paste your notes..."
            className="min-h-[100px] resize-y pr-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <IconButton
            type="button"
            onClick={() => setSummarizeOpen(true)}
            className="absolute bottom-3 right-3 w-9 h-9 border-2 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
            label="Attach file — open Summarize"
            icon={<AttachIcon className="w-4 h-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Button variant="primary" size="md">Send</Button>
          <Link to="/ai-support">
            <Button variant="secondary" size="md">Open full chat</Button>
          </Link>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setChatDialogOpen(true)} className="!px-0 !py-0 min-h-0 text-xs font-medium text-neutral-700 hover:text-neutral-900 mb-4">
          Open chat in popup
        </Button>
        <div className="pt-4 border-t border-neutral-200">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Quick prompts</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setQuery(prompt)}
                className="px-3 py-1.5 min-h-0 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Column 2: Recent conversations */}
      <Card heading="Recent conversations" className="shadow-sm border-2 border-neutral-200 min-w-0 lg:max-w-[480px]">
        <p className="text-sm text-neutral-500 mb-4">Pick up where you left off or start a new chat.</p>
        <ul className="space-y-2">
          {RECENT_CHATS.map((c) => (
            <li key={c.id}>
              <Link
                to="/ai-support"
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors group"
              >
                <span className="w-10 h-10 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center text-neutral-800 dark:text-primary group-hover:bg-primary/20" aria-hidden>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{c.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{c.preview}</p>
                </div>
                <span className="text-xs text-neutral-400 flex-shrink-0">{c.time}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/ai-support" className="inline-block mt-4 pt-4 border-t border-neutral-200">
          <Button variant="ghost" size="sm">View all in AI Support</Button>
        </Link>
      </Card>

      {/* Right column: info + CTA (fills bottom on tall screens) */}
      <aside className="hidden lg:flex flex-col gap-4 w-[300px] shrink-0 min-h-[420px]">
        <Card className="p-5 shadow-sm border-2 border-neutral-200 bg-neutral-50/50 shrink-0">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">How AI Tutor helps</h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex gap-2">
              <span className="text-neutral-700 dark:text-primary shrink-0">•</span>
              Explain concepts in simpler terms
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-700 dark:text-primary shrink-0">•</span>
              Summarize long notes or chapters
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-700 dark:text-primary shrink-0">•</span>
              Generate practice questions
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-700 dark:text-primary shrink-0">•</span>
              Walk through problem solving
            </li>
          </ul>
        </Card>
        <Card className="p-5 shadow-sm border-2 border-neutral-200 shrink-0">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Tip</h3>
          <p className="text-sm text-neutral-600">
            Paste your lecture notes or a paragraph, then ask &quot;Summarize this&quot; or &quot;Quiz me on this&quot; for best results.
          </p>
        </Card>
        <Link
          to="/ai-support"
          className="flex-1 min-h-[120px] flex flex-col justify-center p-5 rounded-xl border-2 border-primary/20 bg-accent-muted hover:bg-primary/10 transition-colors"
        >
          <p className="text-sm font-semibold text-neutral-900">Open full chat</p>
          <p className="text-xs text-neutral-700 dark:text-primary mt-0.5">Continue in AI Support with full conversation history.</p>
        </Link>
      </aside>

      {/* Summarize popup — opened by attachment icon; user drops/selects file here */}
      <Modal open={summarizeOpen} onClose={() => setSummarizeOpen(false)} title="Summarize" size="max-w-4xl">
          <div className="bg-[var(--color-surface)] rounded-2xl border-2 border-neutral-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-neutral-200">
              <div className="flex items-center gap-2">
                <Link to="/focus-room">
                  <Button variant="primary" size="sm" className="rounded-lg text-xs font-bold">Focus room</Button>
                </Link>
                <IconButton type="button" onClick={() => setSummarizeOpen(false)} className="p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900" label="Close" icon={<CloseIcon className="w-5 h-5" />} />
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

      {/* Chat dialog popup */}
      <Modal open={chatDialogOpen} onClose={() => setChatDialogOpen(false)} title="Together AI - Chat" size="max-w-2xl">
          <div className="bg-[var(--color-surface)] rounded-2xl border-2 border-neutral-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <AiBotIcon className="w-8 h-8" />
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Together AI — Chat</h2>
              </div>
              <IconButton type="button" onClick={() => setChatDialogOpen(false)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900" label="Close" icon={<CloseIcon className="w-5 h-5" />} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {MESSAGES.map((msg) => (
                <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                  {msg.role === 'assistant' && (
                    <span className="w-8 h-8 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center overflow-hidden" aria-hidden>
                      <AiBotIcon className="w-7 h-7" />
                    </span>
                  )}
                  <div className={`rounded-xl px-3 py-2 text-sm ${msg.role === 'assistant' ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' : 'bg-accent-muted text-neutral-900 border border-primary/20'}`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t-2 border-neutral-200">
              <ChatInputBar
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onSend={() => {}}
                onFileChange={handleFileChange}
                acceptFiles={ACCEPT_FILES}
                placeholder="Ask anything..."
                attachmentsSlot={
                  attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.map(({ id, file }) => (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs">
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
    </div>
  )
}
