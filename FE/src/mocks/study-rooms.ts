/** Study rooms: discovery, recommend, focus room, create room */

export const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'math', label: 'Mathematics' },
  { key: 'science', label: 'Science' },
  { key: 'lang', label: 'Languages' },
] as const

export type Room = {
  id: string
  title: string
  topic: 'math' | 'science' | 'lang'
  tags: string[]
  description: string
  membersCurrent: number
  membersMax: number
}

export const FAKE_ROOMS: Room[] = [
  { id: '1', title: 'Advanced Calculus Group Session', topic: 'math', tags: ['calculus', 'chapter 4', 'exercises'], description: 'Reviewing Chapter 4 exercises. Join to study together.', membersCurrent: 4, membersMax: 10 },
  { id: '2', title: 'Linear Algebra Problem Solving', topic: 'math', tags: ['linear algebra', 'matrices', 'eigenvalues'], description: 'Working through problem set 3. All levels welcome.', membersCurrent: 2, membersMax: 8 },
  { id: '3', title: 'Statistics & Probability Prep', topic: 'math', tags: ['statistics', 'probability', 'exam prep'], description: 'Final exam review. Practice problems and Q&A.', membersCurrent: 6, membersMax: 12 },
  { id: '4', title: 'Organic Chemistry Study Group', topic: 'science', tags: ['chemistry', 'organic', 'reactions'], description: 'Mechanisms and synthesis. Bring your notes.', membersCurrent: 5, membersMax: 10 },
  { id: '5', title: 'Biology Lab Report Help', topic: 'science', tags: ['biology', 'lab', 'report writing'], description: 'Drafting lab reports. Peer review and feedback.', membersCurrent: 3, membersMax: 6 },
  { id: '6', title: 'Physics Mechanics Workshop', topic: 'science', tags: ['physics', 'mechanics', 'problem solving'], description: "Newton's laws and applications. Practice problems.", membersCurrent: 7, membersMax: 10 },
  { id: '7', title: 'Spanish Conversation Practice', topic: 'lang', tags: ['spanish', 'conversation', 'speaking'], description: 'Casual conversation in Spanish. All levels.', membersCurrent: 4, membersMax: 8 },
  { id: '8', title: 'French Grammar & Reading', topic: 'lang', tags: ['french', 'grammar', 'reading'], description: 'Subjonctif and reading comprehension. B1/B2.', membersCurrent: 2, membersMax: 6 },
  { id: '9', title: 'English Writing Workshop', topic: 'lang', tags: ['english', 'writing', 'essays'], description: 'Essay structure and peer editing. Academic writing.', membersCurrent: 5, membersMax: 8 },
  { id: '10', title: 'Differential Equations Review', topic: 'math', tags: ['differential equations', 'ODE', 'exam'], description: 'Pre-midterm review. Past papers and exercises.', membersCurrent: 3, membersMax: 8 },
  { id: '11', title: 'General Chemistry Concepts', topic: 'science', tags: ['chemistry', 'general', 'stoichiometry'], description: 'Stoichiometry and equilibrium. First-year focus.', membersCurrent: 8, membersMax: 12 },
  { id: '12', title: 'Japanese Kanji Practice', topic: 'lang', tags: ['japanese', 'kanji', 'N3'], description: 'Kanji drilling and vocabulary. JLPT N3 level.', membersCurrent: 4, membersMax: 6 },
]

export const MY_ROOM_IDS = ['1', '4', '6']
export const SUGGESTED_IDS = ['2', '3', '5', '7']

export const STUDY_ROOMS_TABS = [
  { key: 'explore', label: 'Explore' },
  { key: 'my', label: 'My rooms' },
  { key: 'suggested', label: 'Suggested' },
] as const

export const RECOMMENDED_ROOMS = [
  { id: '1', title: 'Advanced Calculus Group', subject: 'MATHEMATICS', active: 12 },
  { id: '2', title: 'Advanced Calculus Group', subject: 'MATHEMATICS', active: 8 },
  { id: '3', title: 'Advanced Calculus Group', subject: 'MATHEMATICS', active: 14 },
  { id: '4', title: 'Advanced Calculus Group', subject: 'MATHEMATICS', active: 6 },
  { id: '5', title: 'Advanced Calculus Group', subject: 'MATHEMATICS', active: 10 },
  { id: '6', title: 'Advanced Calculus Group', subject: 'MATHEMATICS', active: 12 },
]

export const STUDY_ROOM_CHAT_MESSAGES = [
  { user: 'Jordan', time: '2:45 PM', text: 'Anyone want to take a 5-min break at the top of the hour?', own: false },
  { user: 'Alex', time: '2:46 PM', text: "I'm down! I need to finish this set of derivatives first though.", own: true },
  { user: 'Together AI', time: '', text: 'Sam has been focused for 45 minutes.', ai: true },
  { user: 'Sam', time: '2:48 PM', text: 'Thanks all. Just finished Chapter 4.', own: false },
]

export const STUDY_ROOM_PARTICIPANTS = [
  { name: 'Alex', isYou: true },
  { name: 'Jordan', isYou: false },
  { name: 'Sam', isYou: false },
  { name: 'Taylor', isYou: false },
  { name: 'Casey', isYou: false },
  { name: 'Riley', isYou: false },
  { name: 'Morgan', isYou: false },
  { name: 'Quinn', isYou: false },
  { name: 'Drew', isYou: false },
]

export const FOCUS_ROOM_TODAY_TASKS = [
  { title: 'Read Chapter 4 Notes', due: 'Due 2:00 PM' },
  { title: 'History Essay Outline', due: 'Due 6:00 PM' },
  { title: 'Python Quiz Prep', due: 'Due 11:59 PM' },
]

export const FOCUS_ROOM_CHAT_MESSAGES = [
  { user: 'Together AI', time: '2:45 PM', text: 'Anyone want to take a 5-min break at the top of the hour?', own: false },
  { user: 'Alex', time: '2:46 PM', text: "I'm down! I need to finish this set of derivatives first though.", own: true },
  { user: 'Together AI', time: '', text: 'Sam has been focused for 45 minutes.', ai: true },
  { user: 'Together AI', time: '2:48 PM', text: 'Thanks all. Just finished Chapter 4.', own: false },
]

export const topicOptions = [
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'lang', label: 'Languages' },
]

export const durationOptions = [
  { value: 'none', label: 'No time limit' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
]
