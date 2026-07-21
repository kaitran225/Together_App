import { useState, useMemo, useEffect } from 'react'
import { Button, Input, Modal } from '../../../components/common'
import { WEEKDAYS, INITIAL_AI_MESSAGE, buildFakeEvents, getMockAiReply, EVENT_STYLES, type ChatMessage } from '../../../mocks'
import { toDateKey, isSameDay, getCalendarDays } from '../../../utils/calendarUtils'
import { workflowApi, useMock } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

function calculateDateTime(dayName: string, timeStr: string): Date {
  const now = new Date()
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDayIndex = daysOfWeek.indexOf(dayName.toLowerCase())
  if (targetDayIndex === -1) return now

  const currentDayIndex = now.getDay()
  let daysDiff = targetDayIndex - currentDayIndex
  if (daysDiff < 0) {
    daysDiff += 7 // next week
  }
  
  const targetDate = new Date(now)
  targetDate.setDate(now.getDate() + daysDiff)

  let hours = 12
  let minutes = 0
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i)
  if (match) {
    hours = parseInt(match[1])
    if (match[2]) {
      minutes = parseInt(match[2])
    }
    const ampm = match[3] ? match[3].toLowerCase() : ''
    if (ampm === 'pm' && hours < 12) {
      hours += 12
    } else if (ampm === 'am' && hours === 12) {
      hours = 0
    }
  }
  targetDate.setHours(hours, minutes, 0, 0)
  return targetDate
}

export default function Calendar() {
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([INITIAL_AI_MESSAGE])
  const [chatInput, setChatInput] = useState('')
  
  // Real schedules from backend
  const [schedules, setSchedules] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Add Event Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newCategoryId, setNewCategoryId] = useState<number | undefined>(undefined)
  const [newLocation, setNewLocation] = useState('')

  // Event Detail State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res = await workflowApi.getSchedules()
      if (res.success && res.data) {
        setSchedules(res.data)
      }
    } catch (err) {
      console.error('Error fetching schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await workflowApi.getScheduleCategories()
      if (res.success && res.data) {
        setCategories(res.data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  useEffect(() => {
    fetchSchedules()
    fetchCategories()
  }, [])

  // Merge mock events with backend schedules
  const fakeEvents = useMemo(() => useMock ? buildFakeEvents() : {}, [useMock])
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    
    // Add mock events
    Object.entries(fakeEvents).forEach(([dateKey, evList]) => {
      map[dateKey] = evList.map(e => ({ ...e, isMock: true }))
    })

    // Add real database events
    schedules.forEach((sch) => {
      if (!sch.startTime) return
      const date = new Date(sch.startTime)
      const key = toDateKey(date)
      if (!map[key]) {
        map[key] = []
      }
      
      let type: 'class' | 'meeting' | 'deadline' = 'meeting'
      if (sch.location) {
        type = 'class'
      } else if (sch.description && sch.description.toLowerCase().includes('due')) {
        type = 'deadline'
      }
      
      map[key].push({
        id: sch.scheduleId,
        title: sch.title,
        description: sch.description,
        startTime: sch.startTime,
        endTime: sch.endTime,
        location: sch.location,
        categoryId: sch.categoryId,
        type,
        isMock: false
      })
    })

    // Make sure today marker is placed
    const todayKey = toDateKey(today)
    if (!map[todayKey]) {
      map[todayKey] = []
    }
    if (!map[todayKey].some(e => e.title === 'Today' && e.type === 'today')) {
      map[todayKey].unshift({ title: 'Today', type: 'today', isMock: true })
    }

    return map
  }, [schedules, fakeEvents, today])

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

  const sendMessage = async () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text }])

    try {
      const res = await workflowApi.assistSchedule(text)
      if (res.success && res.data?.reply) {
        const data = res.data
        setChatMessages((prev) => [...prev, { role: 'ai', text: data.reply }])
        if (data.created) {
          fetchSchedules()
        }
        return
      }
    } catch (e) {
      console.warn('Schedule assist failed, falling back to mock', e)
    }

    const reply = getMockAiReply(text, viewDate)
    setChatMessages((prev) => [...prev, { role: 'ai', text: reply }])
    if (reply.startsWith("Sure! I've added")) {
      try {
        const titleMatch = reply.match(/added "([^"]+)"/)
        const dayMatch = reply.match(/to ([^,]+),/)
        const timeMatch = reply.match(/at ([^.]+)\./)
        if (titleMatch) {
          const title = titleMatch[1]
          const dayName = dayMatch ? dayMatch[1].trim() : 'Monday'
          const timeStr = timeMatch ? timeMatch[1].trim() : '4:00 PM'
          const computedStart = calculateDateTime(dayName, timeStr)
          const computedEnd = new Date(computedStart)
          computedEnd.setHours(computedEnd.getHours() + 1)
          const createRes = await workflowApi.createSchedule(
            title,
            computedStart.toISOString(),
            computedEnd.toISOString(),
            undefined,
            'Created automatically by Together AI.'
          )
          if (createRes.success) fetchSchedules()
        }
      } catch (e) {
        console.error('AI scheduling interception failed:', e)
      }
    }
  }

  const runOptimizeWeek = async () => {
    const text = t('calendar.optimizePrompt')
    setChatMessages((prev) => [...prev, { role: 'user', text }])
    try {
      const res = await workflowApi.assistSchedule(text)
      if (res.success && res.data?.reply) {
        const reply = res.data.reply
        setChatMessages((prev) => [...prev, { role: 'ai', text: reply }])
        return
      }
    } catch {
      /* fallback below */
    }
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        text: t('calendar.optimizeFallback'),
      },
    ])
  }

  const runFindFocusTime = async () => {
    const text = t('calendar.focusPrompt')
    setChatMessages((prev) => [...prev, { role: 'user', text }])
    try {
      const res = await workflowApi.assistSchedule(text)
      if (res.success && res.data?.reply) {
        const reply = res.data.reply
        setChatMessages((prev) => [...prev, { role: 'ai', text: reply }])
        return
      }
    } catch {
      /* fallback below */
    }
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        text: t('calendar.focusFallback'),
      },
    ])
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Calendar column */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-900 tracking-tight">{monthLabel}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={goPrev} aria-label={t('calendar.prevMonth')}>
                {t('calendar.prev')}
              </Button>
              <Button
                variant={isViewingCurrentMonth ? 'primary' : 'secondary'}
                size="sm"
                onClick={goToday}
                aria-label={t('calendar.goToday')}
              >
                {t('calendar.today')}
              </Button>
              <Button variant="secondary" size="sm" onClick={goNext} aria-label={t('calendar.nextMonth')}>
                {t('calendar.next')}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                {t('calendar.addEvent')}
              </Button>
            </div>
          </div>
          
          {loading && <div className="text-xs text-neutral-500">{t('calendar.updating')}</div>}

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
                const events = eventsByDate[key] ?? []
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
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(ev)
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] leading-tight truncate cursor-pointer select-none active:scale-95 transition-transform ${EVENT_STYLES[ev.type as 'class' | 'deadline' | 'meeting' | 'today']}`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-medium">{t('common.moreCount', { count: events.length - 3 })}</span>
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
              {t('calendar.aiTitle')}
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
                  {m.role === 'ai' && <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase block mb-0.5">{t('calendar.aiAssistant')}</span>}
                  {m.role === 'user' && <span className="text-[9px] font-semibold text-primary uppercase block mb-0.5">{t('calendar.you')}</span>}
                  <p className="text-xs font-medium leading-snug">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 p-3 border-t-2 border-neutral-200 dark:border-[var(--color-charcoal)] space-y-2">
            <div className="flex gap-2 items-stretch">
              <Input
                placeholder={t('calendar.askPlaceholder')}
                className="flex-1 min-w-0 h-9 min-h-0 px-3 py-0 rounded-lg border-2 border-neutral-200 dark:border-[var(--color-charcoal)] text-sm"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button variant="primary" size="sm" onClick={sendMessage} className="shrink-0 h-9 min-h-0 px-3 rounded-lg text-xs font-semibold">
                {t('common.send')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="secondary" size="sm" className="h-8 min-h-0 py-0 px-2.5 text-xs rounded-lg" onClick={runOptimizeWeek}>
                {t('calendar.optimizeWeek')}
              </Button>
              <Button variant="secondary" size="sm" className="h-8 min-h-0 py-0 px-2.5 text-xs rounded-lg" onClick={runFindFocusTime}>
                {t('calendar.findFocusTime')}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={t('calendar.createEvent')}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newTitle.trim()) {
                alert(t('calendar.titleRequired'))
                return
              }
              if (!newStart || !newEnd) {
                alert(t('calendar.timesRequired'))
                return
              }
              try {
                const res = await workflowApi.createSchedule(
                  newTitle,
                  new Date(newStart).toISOString(),
                  new Date(newEnd).toISOString(),
                  newCategoryId,
                  newDesc || undefined,
                  newLocation || undefined,
                  false
                )
                if (res.success) {
                  fetchSchedules()
                  setIsAddModalOpen(false)
                  setNewTitle('')
                  setNewDesc('')
                  setNewStart('')
                  setNewEnd('')
                  setNewLocation('')
                  setNewCategoryId(undefined)
                } else {
                  alert(res.message || t('calendar.createFailed'))
                }
              } catch (err) {
                console.error(err)
                alert(t('calendar.createError'))
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.titleLabel')}</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('calendar.titlePlaceholder')}
                required
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.description')}</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t('calendar.descriptionPlaceholder')}
                className="w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[5rem]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.location')}</label>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder={t('calendar.locationPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.startTime')}</label>
                <Input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.endTime')}</label>
                <Input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.category')}</label>
              <select
                value={newCategoryId || ''}
                onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('common.none')}</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit">
                {t('calendar.createEventBtn')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={t('calendar.eventDetails')}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('common.title')}</label>
              <p className="text-sm font-bold text-neutral-900">{selectedEvent.title}</p>
            </div>
            {selectedEvent.description && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.description')}</label>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>
            )}
            {selectedEvent.startTime && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.time')}</label>
                <p className="text-sm text-neutral-700">
                  {new Date(selectedEvent.startTime).toLocaleString()} -{' '}
                  {selectedEvent.endTime ? new Date(selectedEvent.endTime).toLocaleString() : ''}
                </p>
              </div>
            )}
            {selectedEvent.location && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">{t('calendar.location')}</label>
                <p className="text-sm text-neutral-700">{selectedEvent.location}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
              {!selectedEvent.isMock && selectedEvent.id ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="!bg-error/10 !border-error/50 !text-error hover:!bg-error/20"
                  onClick={async () => {
                    if (confirm(t('calendar.deleteConfirm'))) {
                      await workflowApi.deleteSchedule(selectedEvent.id)
                      fetchSchedules()
                      setSelectedEvent(null)
                    }
                  }}
                >
                  {t('calendar.deleteEvent')}
                </Button>
              ) : null}
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Event types legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary" /> {t('calendar.legendToday')}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-highlight" /> {t('calendar.legendDeadline')}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[var(--color-focus-area)] border border-[var(--color-focus-area)]/30" /> {t('calendar.legendClass')}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> {t('calendar.legendMeeting')}
        </span>
      </div>
    </div>
  )
}
