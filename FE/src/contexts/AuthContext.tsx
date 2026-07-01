import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { authApi, getStoredToken, setStoredToken, clearStoredToken } from '../api/client'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const mapToPublicUser = (dto: any): PublicUser => {
  return {
    id: String(dto.userId || dto.userSso),
    username: dto.userSso,
    email: dto.email,
    fullName: dto.fullName || dto.email.split('@')[0],
    role: dto.systemRole === 'ADMIN' ? 'ADMIN' : 'USER',
    active: dto.status !== 'DISABLED',
    avatarUrl: dto.avatarUrl || '',
    preferences: {
      theme: 'system',
      notifications: { email: true, push: true, inApp: true },
    },
    ...dto // Spread all backend attributes so exp, level, streak, planType, etc., are accessible via (user as any)
  } as any
}

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
  login: (input: LoginInput) => Promise<{ ok: boolean; error?: string; user?: PublicUser }>
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; error?: string; user?: PublicUser }>
  logout: () => void
  refreshUsers: () => void
  refreshProfile: () => Promise<void>
  createMockUser: (input: CreateUserInput) => { ok: boolean; error?: string }
  updateMockUser: (id: string, updates: Partial<PublicUser>) => { ok: boolean; error?: string }
  toggleMockUserStatus: (id: string) => { ok: boolean; error?: string }
  updateOwnProfile: (input: ProfileInput) => { ok: boolean; error?: string }
  changeOwnPassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ ok: boolean; error?: string }>
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

  useEffect(() => {
    if (useMock) return
    const token = getStoredToken()
    if (token) {
      authApi.me(token)
        .then((res) => {
          if (res.success && res.data) {
            setUser(mapToPublicUser(res.data))
          } else {
            clearStoredToken()
            setUser(null)
          }
        })
        .catch(() => {
          clearStoredToken()
          setUser(null)
        })
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    if (useMock) {
      const result = authenticate(input)
      if (!result.user) return { ok: false, error: result.error ?? 'Login failed.' }
      setUser(result.user)
      refreshUsers()
      return { ok: true, user: result.user }
    }

    try {
      const res = await authApi.login(input.identifier, input.password)
      if (res.success && res.data?.accessToken) {
        const { accessToken, refreshToken } = res.data
        setStoredToken(accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        const profileRes = await authApi.me(accessToken)
        if (profileRes.success && profileRes.data) {
          const publicUser = mapToPublicUser(profileRes.data)
          setUser(publicUser)
          return { ok: true, user: publicUser }
        }
      }
      return { ok: false, error: res.message || 'Login failed.' }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error during login.' }
    }
  }, [refreshUsers])

  const loginWithGoogle = useCallback(async (idToken: string) => {
    if (useMock) {
      const mockUser = listUsers().find((u) => u.role === 'USER') || listUsers()[0]
      setUser(mockUser)
      return { ok: true, user: mockUser }
    }

    try {
      const res = await authApi.googleLogin(idToken)
      if (res.success && res.data?.accessToken) {
        const { accessToken, refreshToken } = res.data
        setStoredToken(accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        const profileRes = await authApi.me(accessToken)
        if (profileRes.success && profileRes.data) {
          const publicUser = mapToPublicUser(profileRes.data)
          setUser(publicUser)
          return { ok: true, user: publicUser }
        }
      }
      return { ok: false, error: res.message || 'Google Login failed.' }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error during Google Login.' }
    }
  }, [])

  const logout = useCallback(() => {
    if (!useMock) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        authApi.logout(refreshToken).catch((e) => console.error('Logout error:', e))
      }
      clearStoredToken()
      localStorage.removeItem('refresh_token')
    }
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

  const changeOwnPassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    if (newPassword !== confirmPassword) return { ok: false, error: 'Password confirmation does not match.' }

    if (useMock) {
      if (!verifyUserPassword(user.id, currentPassword)) return { ok: false, error: 'Current password is incorrect.' }
      const changed = changeUserPassword(user.id, newPassword)
      if (!changed) return { ok: false, error: 'Unable to update password.' }
      return { ok: true }
    }

    try {
      const token = getStoredToken()
      if (!token) return { ok: false, error: 'No authorization token found.' }
      const res = await authApi.changePassword(token, currentPassword, newPassword)
      if (res.success) {
        return { ok: true }
      }
      return { ok: false, error: res.message || 'Unable to update password.' }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error during password update.' }
    }
  }, [user])

  const updateOwnPreferences = useCallback((preferences: UserPreferences) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    const updated = updateUser(user.id, { preferences })
    if (!updated) return { ok: false, error: 'Unable to update preferences.' }
    setUser(updated)
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user])

  const refreshProfile = useCallback(async () => {
    if (useMock) return
    const token = getStoredToken()
    if (token) {
      try {
        const res = await authApi.me(token)
        if (res.success && res.data) {
          setUser(mapToPublicUser(res.data))
        }
      } catch (e) {
        console.error('Failed to refresh profile:', e)
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: effectiveUser,
    users,
    isAuthenticated: DEBUG_AUTH_BYPASS ? true : !!effectiveUser,
    isAdmin: effectiveUser?.role === 'ADMIN',
    login,
    loginWithGoogle,
    logout,
    refreshUsers,
    refreshProfile,
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
    loginWithGoogle,
    logout,
    refreshUsers,
    refreshProfile,
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
