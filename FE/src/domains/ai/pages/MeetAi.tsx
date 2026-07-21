import { useState, useRef, useEffect, useCallback } from 'react'
import { AiBotIcon, Button, CloseIcon, IconButton } from '../../../components/common'
import { QUICK_PROMPTS, MAX_FILE_SIZE_MB, ACCEPT_FILES } from '../../../mocks'
import { workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'

type ChatMessage = {
  messageId: number | string
  sender: string
  messageText: string
  sentAt?: string
  pending?: boolean
}

const MessageRenderer = ({ text }: { text: string }) => {
  try {
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleanText.substring(firstBrace, lastBrace + 1)
      const parsed = JSON.parse(jsonStr)
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        return (
          <>
            {firstBrace > 0 && (
              <p className="text-[15px] leading-7 whitespace-pre-wrap mb-3 text-neutral-800">
                {cleanText.substring(0, firstBrace).trim()}
              </p>
            )}
            <div className="mt-1 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm">
              <p className="font-semibold mb-3 text-neutral-900">{parsed.title || 'Mindmap'}</p>
              <ul className="pl-2 space-y-2 border-l-2 border-neutral-300 ml-1">
                {parsed.nodes.map((node: any) => (
                  <li key={node.id}>
                    <span className="font-medium text-neutral-800">{node.label}</span>
                    {node.children?.length > 0 && (
                      <ul className="pl-4 mt-1.5 space-y-1 text-neutral-600">
                        {node.children.map((child: any) => (
                          <li key={child.id}>{child.label}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {lastBrace < cleanText.length - 1 && (
              <p className="text-[15px] leading-7 whitespace-pre-wrap mt-3 text-neutral-800">
                {cleanText.substring(lastBrace + 1).trim()}
              </p>
            )}
          </>
        )
      }
    }
  } catch {
    // plain text
  }
  return <p className="text-[15px] leading-7 whitespace-pre-wrap text-neutral-800">{text}</p>
}

export default function MeetAi() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
  )
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<{ id: string; file: File }[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await workflowApi.getConversations()
      if (res.success && res.data) {
        setConversations(res.data)
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
    void fetchConversations()
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      void fetchMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending, scrollToBottom])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const handleNewChat = async () => {
    setActiveConversationId(null)
    setMessages([])
    setInput('')
    setAttachments([])
    textareaRef.current?.focus()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    const newEntries = Array.from(list)
      .filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
      .map((f) => ({ id: `${Date.now()}-${f.name}`, file: f }))
    setAttachments((prev) => [...prev, ...newEntries])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id))

  const handleSend = async (presetText?: string) => {
    const text = (presetText ?? input).trim()
    const currentAttachments = [...attachments]
    if ((!text && currentAttachments.length === 0) || sending) return

    setSending(true)
    setInput('')
    setAttachments([])

    let convId = activeConversationId
    if (!convId) {
      try {
        const title = text.slice(0, 48) || `Chat ${new Date().toLocaleDateString('vi-VN')}`
        const res = await workflowApi.createConversation(title)
        if (res.success && res.data) {
          convId = res.data.conversationId
          setConversations((prev) => [res.data, ...prev])
          setActiveConversationId(convId)
        } else {
          setSending(false)
          return
        }
      } catch (err) {
        console.error(err)
        setSending(false)
        return
      }
    }

    if (!convId) {
      setSending(false)
      return
    }

    const tempUserMsg: ChatMessage = {
      messageId: `temp-${Date.now()}`,
      sender: 'USER',
      messageText: text || `[Đã gửi ${currentAttachments.length} tệp]`,
      sentAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      let uploadedDocumentId: number | undefined
      if (currentAttachments.length > 0) {
        for (const att of currentAttachments) {
          const res = await workflowApi.uploadDocument(att.file)
          if (res.success && res.data?.documentId) {
            uploadedDocumentId = res.data.documentId
          }
        }
      }

      if (text) {
        await workflowApi.sendChatMessage(convId, text, uploadedDocumentId)
      }
      await fetchMessages(convId)
      await fetchConversations()
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          messageId: `err-${Date.now()}`,
          sender: 'ASSISTANT',
          messageText: 'Xin lỗi, đã có lỗi khi gửi tin nhắn. Vui lòng thử lại.',
          sentAt: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const hasChat = messages.length > 0 || sending
  const displayName = user?.fullName?.split(' ')[0] || 'bạn'

  return (
    <div className="-m-2 sm:-m-3 md:-m-4 md:-my-6 flex h-[calc(100dvh-8rem)] md:h-[calc(100vh-3.5rem)] min-h-[480px] overflow-hidden rounded-none bg-[var(--color-surface)] relative md:rounded-2xl md:border md:border-[var(--color-border)]">
      {/* Sidebar — overlay on mobile when open */}
      {sidebarOpen && (
        <button
          type="button"
          className="md:hidden absolute inset-0 z-10 bg-black/30"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`${
          sidebarOpen ? 'w-[min(260px,85vw)]' : 'w-0'
        } shrink-0 overflow-hidden border-r border-[var(--color-border)] bg-neutral-50 transition-[width] duration-200 ease-out absolute md:static inset-y-0 left-0 z-20 md:z-auto`}
      >
        <div className="flex h-full w-[min(260px,85vw)] md:w-[260px] flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-3">
            <Button variant="secondary" size="sm" className="flex-1 justify-start gap-2 rounded-xl" onClick={handleNewChat}>
              <span className="text-base leading-none">+</span>
              New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Chats</p>
            {conversations.length === 0 ? (
              <p className="px-2 text-xs text-neutral-400">Chưa có hội thoại.</p>
            ) : (
              <ul className="space-y-0.5">
                {conversations.map((c) => {
                  const active = c.conversationId === activeConversationId
                  return (
                    <li key={c.conversationId}>
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(c.conversationId)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? 'bg-neutral-200/90 font-medium text-neutral-900'
                            : 'text-neutral-700 hover:bg-neutral-200/60'
                        }`}
                      >
                        <svg className="h-4 w-4 shrink-0 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="min-w-0 flex-1 truncate">{c.title || 'Untitled'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Main chat */}
      <section className="relative flex min-w-0 flex-1 flex-col bg-[var(--color-surface)]">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3">
          <IconButton
            type="button"
            size="sm"
            variant="ghost"
            label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-lg text-neutral-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-neutral-900">Together AI</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!hasChat ? (
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 pb-8 pt-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                  <AiBotIcon className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  Xin chào, {displayName}
                </h2>
                <p className="max-w-md text-sm text-neutral-500">
                  Hỏi bất cứ điều gì về học tập — giải thích khái niệm, tóm tắt ghi chú, hoặc luyện bài tập.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2">
                {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
              <div className="space-y-6">
                {messages.map((msg) => {
                  const isUser = String(msg.sender).toUpperCase() === 'USER'
                  return (
                    <div key={msg.messageId} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                          <AiBotIcon className="h-7 w-7" />
                        </div>
                      )}
                      <div className={`max-w-[min(100%,42rem)] ${isUser ? '' : 'min-w-0 flex-1'}`}>
                        {!isUser && (
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Together AI</p>
                        )}
                        <div
                          className={
                            isUser
                              ? 'rounded-3xl bg-neutral-900 px-4 py-3 text-[15px] leading-7 text-white'
                              : 'rounded-2xl text-neutral-800'
                          }
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{msg.messageText}</p>
                          ) : (
                            <MessageRenderer text={msg.messageText} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {sending && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                      <AiBotIcon className="h-7 w-7" />
                    </div>
                    <div className="flex items-center gap-1.5 pt-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 pb-4 pt-3 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map(({ id, file }) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                  >
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <IconButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      label={`Remove ${file.name}`}
                      onClick={() => removeAttachment(id)}
                      className="!min-h-0 !p-0 text-neutral-500"
                      icon={<CloseIcon className="h-3.5 w-3.5" />}
                    />
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-[28px] border border-[var(--color-border)] bg-neutral-50 px-2 py-2 shadow-sm focus-within:border-neutral-400 focus-within:bg-[var(--color-surface)]">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_FILES}
                className="hidden"
                onChange={handleFileChange}
                aria-label="Attach file"
              />
              <IconButton
                type="button"
                size="sm"
                variant="ghost"
                label="Attach file"
                onClick={() => fileInputRef.current?.click()}
                className="mb-0.5 shrink-0 rounded-full text-neutral-600"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              />
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="Nhắn tin cho Together AI..."
                className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-neutral-900 outline-none placeholder:text-neutral-400"
                aria-label="Message"
              />
              <Button
                variant="primary"
                size="sm"
                className="mb-0.5 h-9 w-9 shrink-0 rounded-full !px-0"
                disabled={sending || (!input.trim() && attachments.length === 0)}
                onClick={() => void handleSend()}
                aria-label="Send"
              >
                <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
                </svg>
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-neutral-400">
              Together AI có thể sai. Hãy kiểm tra thông tin quan trọng.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
