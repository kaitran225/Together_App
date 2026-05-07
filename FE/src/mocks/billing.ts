/** Billing: subscription features, shop packs */

export const FREE_FEATURES = [
  'Study rooms',
  'Meeting rooms',
  'Note storage',
  'Planner',
]

export const PERSONAL_FEATURES = [
  'Extra study rooms',
  'Extra meeting rooms',
  'Extra storage',
  'Extra planner',
  'Extra mind maps',
  'Extra flashcard',
  'Extra upload PDF',
  'Extra AI summarize',
  'AI analyzes quiz results',
  'Personalized learning roadmap',
  'Extra saveloads',
]

export const TEAMS_FEATURES = [
  'Create up to three teams',
  'Maximum of 6 members per team',
  'Extra AI summarize',
  'Member participation analysis',
  'Quick post-meeting quiz',
  'Smart Scheduling',
  'Extra saveloads',
  'Extra create teams',
  'Deadline reminders',
  'End-of-term contribution report',
]

export const COMBO_FEATURES = [
  'Study rooms',
  'Mind maps & flashcards',
  'PDF upload, full storage',
  'Create meetings',
  'AI summarize',
  'Advanced learning analytics',
  'Personalized learning roadmap',
  'Member participation analysis',
  'Quick post-meeting quiz',
  'Smart Scheduling',
  'Deadline reminders',
  'End-of-term contribution report',
]

export const PACKS = [
  { id: 'starter', name: 'Starter Pack', coins: 500, price: 4.99, iconKey: 'starter' },
  { id: 'student', name: 'Student Special', coins: 1200, price: 9.99, iconKey: 'student' },
  { id: 'pro', name: 'Pro Scholar', coins: 3000, price: 19.99, iconKey: 'pro', popular: true },
  { id: 'squad', name: 'Squad Bundle', coins: 7500, price: 39.99, iconKey: 'squad' },
  { id: 'mastery', name: 'Mastery Pack', coins: 18000, price: 79.99, iconKey: 'mastery' },
  { id: 'ultimate', name: 'Ultimate Treasury', coins: 45000, price: 149.99, iconKey: 'ultimate' },
]
