import { useState, useMemo } from 'react'
import { Button, Input } from '../../../components/common'
import { WEEKDAYS, INITIAL_AI_MESSAGE, buildFakeEvents, getMockAiReply, EVENT_STYLES, type ChatMessage } from '../../../mocks'
import { toDateKey, isSameDay, getCalendarDays } from '../../../utils/calendarUtils'

export default function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([INITIAL_AI_MESSAGE])
  const [chatInput, setChatInput] = useState('')
  const fakeEvents = useMemo(buildFakeEvents, [])

  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const days = useMemo(
    () => getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate.getFullYear(), viewDate.getMonth()]
  )

  const goPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
  const goNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
  const isViewingCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth()

  const sendMessage = () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text }])
    const reply = getMockAiReply(text, viewDate)
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: 'ai', text: reply }])
    }, 400)
  }

  const runOptimizeWeek = () => {
    setChatMessages((prev) => [...prev, { role: 'user', text: 'Optimize my week' }])
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: 'ai', text: "I've looked at your week. I suggest blocking 9–11 AM on Tue and Thu for deep work, and keeping Wed afternoon free for meetings. Want me to add these blocks?" }])
    }, 400)
  }

  const runFindFocusTime = () => {
    setChatMessages((prev) => [...prev, { role: 'user', text: 'Find my focus time' }])
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: 'ai', text: "Based on your calendar, you have focus time: Tue 9–11 AM, Thu 2–4 PM, and Sat morning. I can add a recurring 'Focus' block for these slots if you'd like." }])
    }, 400)
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Calendar column */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-900 tracking-tight">{monthLabel}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={goPrev} aria-label="Previous month">
                ← Prev
              </Button>
              <Button
                variant={isViewingCurrentMonth ? 'primary' : 'secondary'}
                size="sm"
                onClick={goToday}
                aria-label="Go to current month"
              >
                Today
              </Button>
              <Button variant="secondary" size="sm" onClick={goNext} aria-label="Next month">
                Next →
              </Button>
              <Button variant="ghost" size="sm" className="ml-2">
                + Add event
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-neutral-200 dark:border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] overflow-hidden shadow-sm">
            {/* Weekday labels — separate row */}
            <div className="grid grid-cols-7 border-b-2 border-neutral-200 dark:border-[var(--color-charcoal)] bg-neutral-100 dark:bg-[var(--color-surface)] [&>*]:border-r [&>*]:border-neutral-200 [&>*]:dark:border-[var(--color-charcoal)] [&>*:nth-child(7)]:border-r-0">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-500"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells grid */}
            <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:pb-0 [&>*:nth-last-child(-n+7)]:border-b-0">
              {days.map(({ date, isCurrentMonth }, i) => {
                const key = toDateKey(date)
                const isToday = isSameDay(date, today)
                const events = fakeEvents[key] ?? []
                return (
                  <div
                    key={i}
                    className={`min-h-[100px] p-2 flex flex-col border-b border-r border-neutral-200 dark:border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] hover:bg-neutral-50/80 dark:hover:bg-neutral-200/30 transition-colors ${!isCurrentMonth ? 'bg-neutral-50/60 dark:bg-[var(--color-surface)]/50' : ''
                      }`}
                  >
                    <span
                      className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-semibold shrink-0 ${isToday
                        ? 'bg-primary text-primary-foreground'
                        : isCurrentMonth
                          ? 'text-neutral-900 dark:text-neutral-900'
                          : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex flex-col gap-1 mt-1 flex-1 min-h-0 overflow-hidden">
                      {events.slice(0, 3).map((ev, j) => (
                        <div
                          key={j}
                          className={`px-2 py-1 rounded-md text-[11px] leading-tight truncate ${EVENT_STYLES[ev.type]}`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-medium">+{events.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Support panel — fixed width, consistent input/Send height */}
        <aside className="w-full lg:w-[340px] shrink-0 flex flex-col rounded-2xl border-2 border-neutral-200 dark:border-[var(--color-charcoal)] bg-white dark:bg-[var(--color-surface)] shadow-sm overflow-hidden max-h-[calc(100vh-8rem)]">
          <div className="shrink-0 px-4 py-2.5 bg-accent-muted dark:bg-primary/20 border-b-2 border-accent/20 dark:border-primary/30">
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="text-primary font-bold">∞</span>
              Together AI
            </h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
            {chatMessages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                <div
                  className={`max-w-[92%] rounded-lg px-2.5 py-1.5 ${m.role === 'user'
                    ? 'bg-accent-muted dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-neutral-900 dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-[var(--color-surface)] border border-neutral-200 dark:border-[var(--color-charcoal)] text-neutral-900 dark:text-neutral-900'
                    }`}
                >
                  {m.role === 'ai' && <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase block mb-0.5">AI Assistant</span>}
                  {m.role === 'user' && <span className="text-[9px] font-semibold text-primary uppercase block mb-0.5">You</span>}
                  <p className="text-xs font-medium leading-snug">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 p-3 border-t-2 border-neutral-200 dark:border-[var(--color-charcoal)] space-y-2">
            <div className="flex gap-2 items-stretch">
              <Input
                placeholder="Ask anything..."
                className="flex-1 min-w-0 h-9 min-h-0 px-3 py-0 rounded-lg border-2 border-neutral-200 dark:border-[var(--color-charcoal)] text-sm"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button variant="primary" size="sm" onClick={sendMessage} className="shrink-0 h-9 min-h-0 px-3 rounded-lg text-xs font-semibold">
                Send
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="secondary" size="sm" className="h-8 min-h-0 py-0 px-2.5 text-xs rounded-lg" onClick={runOptimizeWeek}>
                Optimize week
              </Button>
              <Button variant="secondary" size="sm" className="h-8 min-h-0 py-0 px-2.5 text-xs rounded-lg" onClick={runFindFocusTime}>
                Find focus time
              </Button>
            </div>
          </div>
        </aside>
      </div>
      {/* Event types legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary" /> Today
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-highlight" /> Deadline
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[var(--color-focus-area)] border border-[var(--color-focus-area)]/30" /> Class
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> Meeting
        </span>
      </div>
    </div>
  )
}
