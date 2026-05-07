/** Calendar: weekdays, initial message, fake events builder, mock AI reply */

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type ChatMessage = { role: 'ai' | 'user'; text: string }

export const INITIAL_AI_MESSAGE: ChatMessage = {
  role: 'ai',
  text: "Hello, I can help you schedule your week. Try saying 'Schedule a study session for Biology next Tuesday' or 'Add a group project meeting for Monday at 4 PM'.",
}

export type CalendarEvent = { title: string; type: 'class' | 'deadline' | 'meeting' | 'today' }

export function buildFakeEvents(): Record<string, CalendarEvent[]> {
  const y = new Date().getFullYear()
  const m = new Date().getMonth()
  const todayKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  return {
    [todayKey]: [{ title: 'Today', type: 'today' }],
    [`${y}-${String(m + 1).padStart(2, '0')}-05`]: [{ title: 'Essay due', type: 'deadline' }],
    [`${y}-${String(m + 1).padStart(2, '0')}-08`]: [{ title: '10:00 Bio lab', type: 'class' }, { title: '2:00 Study group', type: 'meeting' }],
    [`${y}-${String(m + 1).padStart(2, '0')}-12`]: [{ title: 'Math quiz', type: 'class' }],
    [`${y}-${String(m + 1).padStart(2, '0')}-15`]: [{ title: 'Project draft due', type: 'deadline' }],
    [`${y}-${String(m + 1).padStart(2, '0')}-20`]: [{ title: 'Team sync', type: 'meeting' }],
  }
}

export function getMockAiReply(userText: string, viewDate: Date): string {
  const lower = userText.toLowerCase()
  const monthStr = viewDate.toLocaleString('en-US', { month: 'short' })
  const year = viewDate.getFullYear()
  if (lower.includes('meeting') || lower.includes('event') || lower.includes('add') || lower.includes('schedule')) {
    const dayMatch = lower.match(/(next )?monday|(next )?tuesday|(next )?wednesday|(next )?thursday|(next )?friday|(next )?saturday|(next )?sunday|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i)
    const timeMatch = lower.match(/\d{1,2}\s*(:\d{2})?\s*(am|pm)/i) || lower.match(/(\d{1,2})\s*(\d{2})?\s*(am|pm)/i)
    const dayName = dayMatch ? dayMatch[0].replace('next ', '').trim() : 'Monday'
    const timeStr = timeMatch ? timeMatch[0] : '4:00 PM'
    const titleMatch = userText.match(/(?:add|schedule)\s+(?:a\s+)?(?:group\s+)?(?:project\s+)?(?:meeting|event)\s+for\s+(.+?)(?:\s+at\s+|\s+on\s+|$)/i)
      || userText.match(/(.+?)\s+(?:on|for)\s+(?:next\s+)?(?:mon|tue|wed|thu|fri|sat|sun)/i)
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+at\s+\d.*$/i, '').trim() || 'Event' : 'Group Project Meeting'
    return `Sure! I've added "${title}" to ${dayName}, ${monthStr} ${year} at ${timeStr}. Would you like me to notify your squad?`
  }
  if (lower.includes('optimize') || lower.includes('week')) {
    return "I've looked at your week. I suggest blocking 9–11 AM on Tue and Thu for deep work, and keeping Wed afternoon free for meetings. Want me to add these blocks?"
  }
  if (lower.includes('focus') || lower.includes('time')) {
    return "Based on your calendar, you have focus time: Tue 9–11 AM, Thu 2–4 PM, and Sat morning. I can add a recurring 'Focus' block for these slots if you'd like."
  }
  return "I can add events, optimize your week, or find focus time. Try: 'Add a meeting for Monday at 4 PM' or tap Optimize week below."
}

export const EVENT_STYLES: Record<CalendarEvent['type'], string> = {
  today: 'bg-primary text-primary-foreground font-semibold',
  deadline: 'bg-highlight text-white font-medium',
  class: 'bg-[var(--color-focus-area)] text-black border border-[var(--color-focus-area)]/30',
  meeting: 'bg-success/20 text-neutral-900 border border-success/30',
}
