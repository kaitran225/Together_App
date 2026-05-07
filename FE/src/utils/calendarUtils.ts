/** Calendar utilities: shared helpers for date handling */

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function getCalendarDays(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = new Date(first)
  const startDow = start.getDay()
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow
  start.setDate(first.getDate() + mondayOffset)
  const out: { date: Date; isCurrentMonth: boolean }[] = []
  const cur = new Date(start)
  const end = new Date(last)
  end.setDate(end.getDate() + 1)
  while (cur < end || out.length % 7 !== 0) {
    out.push({ date: new Date(cur), isCurrentMonth: cur.getMonth() === month })
    cur.setDate(cur.getDate() + 1)
  }
  return out
}
