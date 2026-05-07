/** Teams: board tabs, members, scrum/sprint columns, my teams */

export const TEAM_TABS = [
  { id: 'management', label: 'Team management' },
  { id: 'scrum', label: 'Scrum Board' },
  { id: 'sprint', label: 'Sprint Board' },
] as const

export type TabId = (typeof TEAM_TABS)[number]['id']

export const TEAM_MEMBERS: { id: string; name: string; role?: string; skills: string[]; code: string }[] = [
  { id: 'alex', name: 'Alex', role: 'Owner', skills: ['Product', 'User Research', 'Roadmap'], code: 'AM' },
  { id: 'jordan', name: 'Jordan', skills: ['Frontend', 'React', 'UI/UX'], code: 'JD' },
  { id: 'sam', name: 'Sam', skills: ['Backend', 'API', 'Database'], code: 'SK' },
  { id: 'casey', name: 'Casey', skills: ['QA', 'Automation', 'Documentation'], code: 'AB' },
]

export type ScrumTask = {
  tag: string
  title: string
  assignee: string
  startDate?: string
  endDate?: string
  due?: string
  status?: string
  completed?: string
  priority?: string
  estimate?: string
  reporter?: string
  flagged?: boolean
  done?: boolean
  missed?: boolean
}

export type SprintTask = {
  title: string
  assignee: string
  tag?: string
  desc?: string
  startDate?: string
  endDate?: string
  due?: string
  progress?: number
  status?: string
  priority?: string
  estimate?: string
  reporter?: string
  completed?: string
  needsFeedback?: boolean
}

export const SCRUM_COLUMNS_INIT: { id: string; title: string; tasks: ScrumTask[] }[] = [
  {
    id: 'todo',
    title: 'TO-DO',
    tasks: [
      { tag: 'RESEARCH', title: 'Draft initial architecture diagram', startDate: 'Oct 1', endDate: 'Oct 12', due: 'Oct 12', assignee: 'JD', priority: 'High', estimate: '2d', reporter: 'AM' },
      { tag: 'DOCS', title: 'Write API specifications', startDate: 'Oct 5', due: 'Oct 15', assignee: 'AM', priority: 'Medium', estimate: '1d' },
      { tag: 'BACKEND', title: 'Set up CI pipeline', due: 'Oct 18', assignee: 'SK', priority: 'High', estimate: '3d' },
    ],
  },
  {
    id: 'doing',
    title: 'DOING',
    tasks: [
      { tag: 'FRONTEND', title: 'Integrate AI Dashboard UI', status: 'In Progress', assignee: 'SK', flagged: true, startDate: 'Oct 8', endDate: 'Oct 20', due: 'Oct 20', priority: 'Urgent', estimate: '5d', reporter: 'JD' },
    ],
  },
  {
    id: 'done',
    title: 'DONE',
    tasks: [
      { tag: 'BACKEND', title: 'Database schema refinement', completed: 'Oct 10', assignee: 'JD', done: true, startDate: 'Oct 1', endDate: 'Oct 10', due: 'Oct 10', priority: 'High', estimate: '1.5d', reporter: 'AM' },
      { tag: 'DESIGN', title: 'User Interview Analysis', completed: 'Oct 09', assignee: 'AM', done: true, startDate: 'Oct 3', endDate: 'Oct 9', due: 'Oct 9', reporter: 'SK' },
    ],
  },
  {
    id: 'missed',
    title: 'MISSED',
    tasks: [
      { tag: 'MEETING', title: 'Weekly Sync (Skipped)', status: 'OVERDUE 3D', assignee: 'AB', missed: true },
    ],
  },
]

export const SPRINT_COLUMNS_INIT: { id: string; title: string; tasks: SprintTask[] }[] = [
  {
    id: 'todo',
    title: 'TO DO',
    tasks: [
      { tag: 'DESIGN', title: 'Homepage Wireframe', desc: 'Create low fidelity wireframes for the new landing page structure.', due: 'Due tomorrow', assignee: 'A' },
      { tag: 'RESEARCH', title: 'Competitor Analysis', assignee: 'B' },
    ],
  },
  {
    id: 'progress',
    title: 'IN PROGRESS',
    tasks: [
      { tag: 'DEV', title: 'Setup React Repo', desc: 'Initialize project with Vite and Tailwind configuration.', progress: 60, assignee: 'C', status: 'In review' },
    ],
  },
  {
    id: 'review',
    title: 'REVIEW',
    tasks: [
      { tag: 'CONTENT', title: 'Copywriting Draft', desc: 'First pass at the About Us page text.', assignee: 'D', needsFeedback: true },
    ],
  },
  {
    id: 'done',
    title: 'DONE',
    tasks: [
      { title: 'Kickoff Meeting', assignee: 'A' },
    ],
  },
]

export const myTeamsData = [
  { id: '1', tag: 'ACADEMIC', code: 'CS101', subtitle: 'Fundamentals', members: 6 },
  { id: '2', tag: 'ACADEMIC', code: 'MATH201', subtitle: 'Calculus II', members: 8 },
  { id: '3', tag: 'ACADEMIC', code: 'BIO101', subtitle: 'Intro Biology', members: 5 },
  { id: '4', tag: 'ACADEMIC', code: 'CHEM101', subtitle: 'General Chem', members: 4 },
]

export const archivedData = [
  { id: 'a1', name: 'Calculus II Prep', active: '8 Active' },
  { id: 'a2', name: 'Organic Chemistry', active: '14 Active' },
  { id: 'a3', name: 'Web Dev Sprint', active: '5 Active' },
  { id: 'a4', name: 'History Essay Group', active: '3 Active' },
  { id: 'a5', name: 'Physics Lab', active: '6 Active' },
  { id: 'a6', name: 'Data Structures', active: '12 Active' },
]

export const DEFAULT_STATUS_OPTIONS = ['To Do', 'In Progress', 'Review', 'Done']
