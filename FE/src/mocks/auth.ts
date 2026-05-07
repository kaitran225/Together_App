export type UserRole = 'USER' | 'ADMIN'

export type NotificationPrefs = {
  email: boolean
  push: boolean
  inApp: boolean
}

export type UserPreferences = {
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationPrefs
}

export type MockUser = {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  active: boolean
  avatarUrl?: string
  password: string
  preferences: UserPreferences
}

export type PublicUser = Omit<MockUser, 'password'>

export type AuthCredentials = {
  identifier: string
  password: string
}

let mockUsers: MockUser[] = [
  {
    id: 'u-001',
    username: 'student',
    email: 'student@together.dev',
    fullName: 'Student User',
    role: 'USER',
    active: true,
    avatarUrl: '',
    password: 'student123',
    preferences: {
      theme: 'system',
      notifications: { email: true, push: true, inApp: true },
    },
  },
  {
    id: 'a-001',
    username: 'admin',
    email: 'admin@together.dev',
    fullName: 'Admin User',
    role: 'ADMIN',
    active: true,
    avatarUrl: '',
    password: 'admin123',
    preferences: {
      theme: 'dark',
      notifications: { email: true, push: false, inApp: true },
    },
  },
]

function toPublicUser(user: MockUser): PublicUser {
  const { password: _password, ...publicUser } = user
  return publicUser
}

export function getSeedCredentials() {
  return {
    admin: { identifier: 'admin', password: 'admin123' },
    user: { identifier: 'student', password: 'student123' },
  }
}

export function authenticate({ identifier, password }: AuthCredentials): { user: PublicUser | null; error?: string } {
  const normalized = identifier.trim().toLowerCase()
  const user = mockUsers.find(
    (item) =>
      item.username.toLowerCase() === normalized ||
      item.email.toLowerCase() === normalized
  )

  if (!user) return { user: null, error: 'Account not found.' }
  if (!user.active) return { user: null, error: 'This account is disabled.' }
  if (user.password !== password) return { user: null, error: 'Invalid password.' }

  return { user: toPublicUser(user) }
}

export function listUsers(): PublicUser[] {
  return mockUsers.map(toPublicUser)
}

export type CreateUserInput = {
  username: string
  email: string
  fullName: string
  role: UserRole
  password: string
  avatarUrl?: string
}

export function createUser(input: CreateUserInput): PublicUser {
  const user: MockUser = {
    id: `u-${Date.now()}`,
    username: input.username.trim(),
    email: input.email.trim(),
    fullName: input.fullName.trim(),
    role: input.role,
    active: true,
    avatarUrl: input.avatarUrl?.trim() ?? '',
    password: input.password,
    preferences: {
      theme: 'system',
      notifications: { email: true, push: true, inApp: true },
    },
  }
  mockUsers = [user, ...mockUsers]
  return toPublicUser(user)
}

export type UpdateUserInput = Partial<Omit<MockUser, 'id' | 'password'>> & { password?: string }

export function updateUser(userId: string, updates: UpdateUserInput): PublicUser | null {
  const index = mockUsers.findIndex((item) => item.id === userId)
  if (index < 0) return null

  mockUsers[index] = {
    ...mockUsers[index],
    ...updates,
  }
  return toPublicUser(mockUsers[index])
}

export function toggleUserStatus(userId: string): PublicUser | null {
  const index = mockUsers.findIndex((item) => item.id === userId)
  if (index < 0) return null
  mockUsers[index] = { ...mockUsers[index], active: !mockUsers[index].active }
  return toPublicUser(mockUsers[index])
}

export function changeUserPassword(userId: string, newPassword: string): boolean {
  const index = mockUsers.findIndex((item) => item.id === userId)
  if (index < 0) return false
  mockUsers[index] = { ...mockUsers[index], password: newPassword }
  return true
}

export function verifyUserPassword(userId: string, password: string): boolean {
  const user = mockUsers.find((item) => item.id === userId)
  if (!user) return false
  return user.password === password
}
