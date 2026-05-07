import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  authenticate,
  changeUserPassword,
  createUser,
  listUsers,
  toggleUserStatus,
  updateUser,
  verifyUserPassword,
  type PublicUser,
  type UserPreferences,
  type UserRole,
} from '../mocks/auth'

// Temporary debug switch: bypass login gates while UI debugging.
const DEBUG_AUTH_BYPASS = false

type LoginInput = { identifier: string; password: string }
type ProfileInput = { fullName: string; email: string; avatarUrl?: string }
type CreateUserInput = { username: string; email: string; fullName: string; role: UserRole; password: string; avatarUrl?: string }

type AuthContextValue = {
  user: PublicUser | null
  users: PublicUser[]
  isAuthenticated: boolean
  isAdmin: boolean
  login: (input: LoginInput) => { ok: boolean; error?: string; user?: PublicUser }
  logout: () => void
  refreshUsers: () => void
  createMockUser: (input: CreateUserInput) => { ok: boolean; error?: string }
  updateMockUser: (id: string, updates: Partial<PublicUser>) => { ok: boolean; error?: string }
  toggleMockUserStatus: (id: string) => { ok: boolean; error?: string }
  updateOwnProfile: (input: ProfileInput) => { ok: boolean; error?: string }
  changeOwnPassword: (currentPassword: string, newPassword: string, confirmPassword: string) => { ok: boolean; error?: string }
  updateOwnPreferences: (preferences: UserPreferences) => { ok: boolean; error?: string }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [users, setUsers] = useState<PublicUser[]>(() => listUsers())
  const bypassUser = useMemo<PublicUser | null>(() => {
    if (!DEBUG_AUTH_BYPASS) return null
    const all = listUsers()
    return all.find((u) => u.role === 'ADMIN') ?? all[0] ?? null
  }, [])
  const effectiveUser = DEBUG_AUTH_BYPASS ? bypassUser : user

  const refreshUsers = useCallback(() => setUsers(listUsers()), [])

  const login = useCallback((input: LoginInput) => {
    const result = authenticate(input)
    if (!result.user) return { ok: false, error: result.error ?? 'Login failed.' }
    setUser(result.user)
    refreshUsers()
    return { ok: true, user: result.user }
  }, [refreshUsers])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const createMockUser = useCallback((input: CreateUserInput) => {
    const existing = listUsers().find(
      (item) =>
        item.username.toLowerCase() === input.username.trim().toLowerCase() ||
        item.email.toLowerCase() === input.email.trim().toLowerCase()
    )
    if (existing) return { ok: false, error: 'Username or email already exists.' }
    createUser(input)
    refreshUsers()
    return { ok: true }
  }, [refreshUsers])

  const updateMockUser = useCallback((id: string, updates: Partial<PublicUser>) => {
    const updated = updateUser(id, updates)
    if (!updated) return { ok: false, error: 'User not found.' }
    if (user?.id === updated.id) setUser(updated)
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user?.id])

  const toggleMockUserStatus = useCallback((id: string) => {
    const updated = toggleUserStatus(id)
    if (!updated) return { ok: false, error: 'User not found.' }
    if (user?.id === updated.id && !updated.active) setUser(null)
    if (user?.id === updated.id && updated.active) setUser(updated)
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user?.id])

  const updateOwnProfile = useCallback((input: ProfileInput) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    const updated = updateUser(user.id, {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      avatarUrl: input.avatarUrl?.trim() ?? '',
    })
    if (!updated) return { ok: false, error: 'Unable to update profile.' }
    setUser(updated)
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user])

  const changeOwnPassword = useCallback((currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    if (!verifyUserPassword(user.id, currentPassword)) return { ok: false, error: 'Current password is incorrect.' }
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    if (newPassword !== confirmPassword) return { ok: false, error: 'Password confirmation does not match.' }
    const changed = changeUserPassword(user.id, newPassword)
    if (!changed) return { ok: false, error: 'Unable to update password.' }
    return { ok: true }
  }, [user])

  const updateOwnPreferences = useCallback((preferences: UserPreferences) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    const updated = updateUser(user.id, { preferences })
    if (!updated) return { ok: false, error: 'Unable to update preferences.' }
    setUser(updated)
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user])

  const value = useMemo<AuthContextValue>(() => ({
    user: effectiveUser,
    users,
    isAuthenticated: DEBUG_AUTH_BYPASS ? true : !!effectiveUser,
    isAdmin: effectiveUser?.role === 'ADMIN',
    login,
    logout,
    refreshUsers,
    createMockUser,
    updateMockUser,
    toggleMockUserStatus,
    updateOwnProfile,
    changeOwnPassword,
    updateOwnPreferences,
  }), [
    createMockUser,
    changeOwnPassword,
    login,
    logout,
    refreshUsers,
    toggleMockUserStatus,
    updateMockUser,
    updateOwnPreferences,
    updateOwnProfile,
    effectiveUser,
    users,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
