import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  authenticate,
  changeUserPassword,
  createUser,
  listUsers,
  toggleUserStatus,
  updateUser,
  verifyUserPassword,
  type UserRole,
} from '../mocks/auth'
import { authApi, getStoredToken, setStoredToken, clearStoredToken } from '../api/client'
import type { UserDto } from '../types/dto'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const mapToUserDto = (dto: any): UserDto => {
  return {
    ...dto,
    userId: dto.userId ?? null,
    userSso: dto.userSso ?? String(dto.id || dto.username || ''),
    email: dto.email,
    fullName: dto.fullName || dto.email?.split('@')[0],
    systemRole: dto.systemRole || (dto.role === 'ADMIN' ? 'ADMIN' : 'USER'),
    status: dto.status || (dto.active === false ? 'DISABLED' : 'ACTIVE'),
    avatarUrl: dto.avatarUrl || '',
  }
}

// Temporary debug switch: bypass login gates while UI debugging.
const DEBUG_AUTH_BYPASS = false

type LoginInput = { identifier: string; password: string }
type ProfileInput = { fullName: string; email: string; avatarUrl?: string; skills?: string[]; learningGoals?: string[] }
type CreateUserInput = { username: string; email: string; fullName: string; role: UserRole; password: string; avatarUrl?: string }

type AuthContextValue = {
  user: UserDto | null
  users: any[] // Mock users array kept for legacy fallback
  isAuthenticated: boolean
  isAdmin: boolean
  login: (input: LoginInput) => Promise<{ ok: boolean; error?: string; user?: UserDto }>
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; error?: string; user?: UserDto }>
  logout: () => void
  refreshUsers: () => void
  refreshProfile: () => Promise<void>
  createMockUser: (input: CreateUserInput) => { ok: boolean; error?: string }
  updateMockUser: (id: string, updates: Partial<any>) => { ok: boolean; error?: string }
  toggleMockUserStatus: (id: string) => { ok: boolean; error?: string }
  updateOwnProfile: (input: ProfileInput) => Promise<{ ok: boolean; error?: string }>
  changeOwnPassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ ok: boolean; error?: string }>
  updateOwnPreferences: (preferences: any) => { ok: boolean; error?: string }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [users, setUsers] = useState<any[]>(() => listUsers())
  const bypassUser = useMemo<UserDto | null>(() => {
    if (!DEBUG_AUTH_BYPASS) return null
    const all = listUsers()
    const found = all.find((u) => u.role === 'ADMIN') ?? all[0] ?? null
    return found ? mapToUserDto(found) : null
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
            setUser(mapToUserDto(res.data))
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
      const mapped = mapToUserDto(result.user)
      setUser(mapped)
      refreshUsers()
      return { ok: true, user: mapped }
    }

    try {
      const res = await authApi.login(input.identifier, input.password)
      if (res.success && res.data?.accessToken) {
        const { accessToken, refreshToken } = res.data
        setStoredToken(accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        const profileRes = await authApi.me(accessToken)
        if (profileRes.success && profileRes.data) {
          const mappedUser = mapToUserDto(profileRes.data)
          setUser(mappedUser)
          return { ok: true, user: mappedUser }
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
      const mapped = mapToUserDto(mockUser)
      setUser(mapped)
      return { ok: true, user: mapped }
    }

    try {
      const res = await authApi.googleLogin(idToken)
      if (res.success && res.data?.accessToken) {
        const { accessToken, refreshToken } = res.data
        setStoredToken(accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        const profileRes = await authApi.me(accessToken)
        if (profileRes.success && profileRes.data) {
          const mappedUser = mapToUserDto(profileRes.data)
          setUser(mappedUser)
          return { ok: true, user: mappedUser }
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

  const updateMockUser = useCallback((id: string, updates: Partial<any>) => {
    const updated = updateUser(id, updates)
    if (!updated) return { ok: false, error: 'User not found.' }
    if (user?.userSso === updated.id) setUser(mapToUserDto(updated))
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user?.userSso])

  const toggleMockUserStatus = useCallback((id: string) => {
    const updated = toggleUserStatus(id)
    if (!updated) return { ok: false, error: 'User not found.' }
    if (user?.userSso === updated.id && !updated.active) setUser(null)
    if (user?.userSso === updated.id && updated.active) setUser(mapToUserDto(updated))
    refreshUsers()
    return { ok: true }
  }, [refreshUsers, user?.userSso])

  const updateOwnProfile = useCallback(async (input: ProfileInput) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    if (useMock) {
      const updated = updateUser(user.userSso, {
        fullName: input.fullName.trim(),
        email: input.email.trim(),
        avatarUrl: input.avatarUrl?.trim() ?? '',
        skills: input.skills ?? user.skills ?? undefined,
        learningGoals: input.learningGoals ?? user.learningGoals ?? undefined
      })
      if (!updated) return { ok: false, error: 'Unable to update profile.' }
      setUser(mapToUserDto(updated))
      refreshUsers()
      return { ok: true }
    } else {
      const token = getStoredToken()
      if (!token) return { ok: false, error: 'No token' }
      try {
        const res = await authApi.updateProfile(token, input.fullName.trim(), input.avatarUrl?.trim(), input.skills, input.learningGoals)
        if (res.success && res.data) {
          setUser(mapToUserDto(res.data))
          return { ok: true }
        }
        return { ok: false, error: res.message || 'Update failed' }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  }, [refreshUsers, user])

  const changeOwnPassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    if (newPassword !== confirmPassword) return { ok: false, error: 'Password confirmation does not match.' }

    if (useMock) {
      if (!verifyUserPassword(user.userSso, currentPassword)) return { ok: false, error: 'Current password is incorrect.' }
      const changed = changeUserPassword(user.userSso, newPassword)
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

  const updateOwnPreferences = useCallback((preferences: any) => {
    if (!user) return { ok: false, error: 'Not authenticated.' }
    const updated = updateUser(user.userSso, { preferences })
    if (!updated) return { ok: false, error: 'Unable to update preferences.' }
    setUser(mapToUserDto(updated))
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
          setUser(mapToUserDto(res.data))
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
    isAdmin: effectiveUser?.systemRole === 'ADMIN',
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
