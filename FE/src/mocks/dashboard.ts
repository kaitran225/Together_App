/** Dashboard: today's work, study bars, upcoming, teams */

export const todayTasks = [
  { title: 'Read Chapter 4 – Biology', due: 'Due 2:00 PM' },
  { title: 'History Essay Outline', due: 'Due 6:00 PM' },
  { title: 'Python Quiz Prep', due: 'Due 11:59 PM' },
  { title: 'Physics Problem Set 3', due: 'Due 11:59 PM' },
]

export const studyBarsRaw = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4, active: true },
  { day: 'Fri', hours: 2 },
  { day: 'Sat', hours: 0.5 },
  { day: 'Sun', hours: 1.5 },
]

export const studyMaxHours = Math.max(...studyBarsRaw.map((b) => b.hours))

export const studyBars = studyBarsRaw.map((b) => ({
  ...b,
  h: Math.max(12, (b.hours / studyMaxHours) * 100),
  label: b.active ? `${b.hours}h` : undefined,
}))

export const upcomingItems = [
  { tag: 'DEADLINE', tagClass: 'bg-highlight/90 text-white', title: 'Physics Lab Report', time: 'Tomorrow, 11:59 PM' },
  { tag: 'PROJECT', tagClass: 'bg-highlight/30 text-neutral-800', title: 'Web Dev Mockups Review', time: 'Fri, 11 AM' },
  { tag: 'MEETING', tagClass: 'bg-accent/20 text-neutral-900', title: 'Calculus Study Group', time: 'Sat, 2:00 PM' },
]

export const teamCards = [
  { name: 'Calculus II Prep', active: '8 Active' },
  { name: 'Organic Chemistry', active: '14 Active' },
  { name: 'Web Dev Sprint', active: '5 Active' },
  { name: 'History Essay Group', active: '3 Active' },
]

export const cardCompact = 'p-4 [&_h3]:pb-1.5 [&_h3]:mb-3 [&_h3]:text-sm [&_h3]:font-semibold'
