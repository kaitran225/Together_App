import type { ApiResponse, MeResponse } from '../types/dto'
import { getFakeMeResponse } from '../mocks/user'

export type { ApiResponse, MeResponse } from '../types/dto'

const AUTH_ISSUER = 'http://localhost:8880'

/** Set VITE_USE_MOCK=true in .env to use fake user and health responses without backend. */
export const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const authApi = {
  loginUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'exe101-web',
      redirect_uri: `${window.location.origin}/callback`,
      scope: 'openid read write',
    })
    return `${AUTH_ISSUER}/oauth2/authorize?${params}`
  },

  async me(token: string): Promise<ApiResponse<MeResponse>> {
    if (useMock) return Promise.resolve(getFakeMeResponse())
    const r = await fetch('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return r.json()
  },

  async updateProfile(token: string, fullName?: string, avatarUrl?: string, skills?: string[], learningGoals?: string[]): Promise<ApiResponse<MeResponse>> {
    if (useMock) return Promise.resolve(getFakeMeResponse())
    const r = await fetch('/api/v1/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fullName, avatarUrl, skills, learningGoals }),
    })
    return r.json()
  },

  async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    if (useMock) {
      return Promise.resolve({ success: true, data: { accessToken: 'mock-token', refreshToken: 'mock-refresh-token' } })
    }
    const r = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return r.json()
  },

  async register(email: string, password: string, fullName: string): Promise<ApiResponse<any>> {
    if (useMock) {
      return Promise.resolve({ success: true })
    }
    const r = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })
    return r.json()
  },

  async logout(refreshToken: string): Promise<ApiResponse<void>> {
    if (useMock) {
      return Promise.resolve({ success: true })
    }
    const r = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    return r.json()
  },

  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<ApiResponse<string>> {
    if (useMock) {
      return Promise.resolve({ success: true, data: 'Password changed successfully' })
    }
    const r = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    return r.json()
  },

  async googleLogin(idToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    if (useMock) {
      return Promise.resolve({ success: true, data: { accessToken: 'mock-token', refreshToken: 'mock-refresh-token' } })
    }
    const r = await fetch('/api/v1/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    return r.json()
  },

  async lookupUsers(userSsoList: string[]): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/users/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify(userSsoList),
    })
    return r.json()
  },

  async getPublicProfile(sso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { userSso: sso, fullName: 'Guest Mock', level: 5, exp: 1200, skills: ['Java'], learningGoals: [] } })
    const r = await fetch(`/api/v1/public/users/${sso}/profile`, {
      method: 'GET',
    })
    return r.json()
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    if (useMock) {
      return Promise.resolve({ success: true, data: { accessToken: 'mock-token', refreshToken: 'mock-refresh-token' } })
    }
    const r = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    return r.json()
  },

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    if (useMock) {
      return Promise.resolve({ success: true })
    }
    const r = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return r.json()
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<ApiResponse<string>> {
    if (useMock) {
      return Promise.resolve({ success: true, data: 'Password reset confirmed' })
    }
    const r = await fetch('/api/v1/auth/reset-password/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    return r.json()
  },

  async verifyEmail(rawToken: string): Promise<ApiResponse<string>> {
    if (useMock) {
      return Promise.resolve({ success: true, data: 'Email verified' })
    }
    const r = await fetch(`/api/v1/auth/verify-email?rawToken=${encodeURIComponent(rawToken)}`)
    return r.json()
  },

  async toggleUserStatus(userId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/admin/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
}
export const readApi = {
  async health(): Promise<ApiResponse<{ service: string; status: string }>> {
    if (useMock) return Promise.resolve({ success: true, data: { service: 'read', status: 'UP' } })
    const r = await fetch('/api/v1/read/health')
    return r.json()
  },
  async getRooms(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    // Prefer workflow (always needed for create/join). Fall back to read service if workflow list fails.
    try {
      const wr = await fetch('/api/v1/workflow/rooms', {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      if (wr.ok) return wr.json()
    } catch {
      // ignore and try read
    }
    const r = await fetch('/api/v1/read/rooms')
    return r.json()
  },
  async getSuggestedRooms(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    try {
      const wr = await fetch('/api/v1/workflow/rooms/suggested', {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      if (wr.ok) return wr.json()
    } catch {
      // ignore
    }
    const r = await fetch('/api/v1/read/rooms/suggested')
    return r.json()
  },
  async getRoomDetail(roomId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/read/rooms/${roomId}`)
    return r.json()
  },
  async getRoomTimeline(roomId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/read/rooms/${roomId}/events`)
    return r.json()
  },
  async getRoomParticipants(roomId: string | number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/read/rooms/${roomId}/participants`)
    return r.json()
  },
  async getMyRooms(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    try {
      const wr = await fetch('/api/v1/workflow/rooms/my', {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      if (wr.ok) return wr.json()
    } catch {
      // ignore
    }
    const r = await fetch('/api/v1/read/rooms/my', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
}

export const workflowApi = {
  async health(): Promise<ApiResponse<{ service: string; status: string }>> {
    if (useMock) return Promise.resolve({ success: true, data: { service: 'workflow', status: 'UP' } })
    const r = await fetch('/api/v1/workflow/health')
    return r.json()
  },
  async createRoom(
    title: string,
    description: string,
    goalDescription: string,
    goalDurationDays: number,
    maxMembers: number,
    isPremium: boolean,
    isPublic: boolean,
    roomType = 'SOCIAL',
    topic?: string
  ): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({
        title,
        description,
        goalDescription,
        goalDurationDays,
        maxMembers,
        isPremium,
        isPublic,
        roomType,
        topic,
      }),
    })
    return r.json()
  },
  async joinRoom(roomId: string | number, inviteCode = ''): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ inviteCode }),
    })
    return r.json()
  },
  async leaveRoom(roomId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
    })
    return r.json()
  },
  async getWebRtcConfig(roomId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/webrtc-config`, {
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
      },
    })
    return r.json()
  },
  async getUsers(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/users', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getNotifications(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/notifications', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/notifications/read-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getMyTeams(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/teams/my', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createTeam(
    name: string,
    description: string,
    avatarUrl?: string,
    isPrivate?: boolean,
    maxMembers?: number
  ): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ name, description, avatarUrl, isPrivate, maxMembers }),
    })
    return r.json()
  },
  async joinTeam(inviteCode: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/teams/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ inviteCode }),
    })
    return r.json()
  },
  async getTeamDetail(teamId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getProjects(teamId: string | number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/projects`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getProject(projectId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createProject(teamId: string | number, name: string, description: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ name, description }),
    })
    return r.json()
  },
  async getBoard(projectId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}/board`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async moveTask(projectId: string | number, taskId: string | number, targetColumnId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}/board/tasks/${taskId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ targetColumnId }),
    })
    return r.json()
  },
  async createColumn(projectId: string | number, name: string, position: number, colorCode = '#ffffff'): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}/board/columns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ name, position, colorCode }),
    })
    return r.json()
  },
  async createTask(projectId: string | number, data: {
    title: string
    description?: string
    priority?: string
    estimatedHours?: number
    startDate?: string | null
    dueDate?: string | null
    parentTaskId?: number | null
    sprintId?: number | null
    columnId?: number | null
  }): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify(data),
    })
    return r.json()
  },
  async getTask(taskId: string | number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getFocusRoomTasks(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/focus-room/tasks', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createFocusRoomTask(title: string, dueDate?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { id: Date.now(), title, isCompleted: false } })
    const r = await fetch('/api/v1/workflow/focus-room/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ title, dueDate }),
    })
    return r.json()
  },
  async updateFocusRoomTask(taskId: number, title?: string, dueDate?: string, isCompleted?: boolean): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/focus-room/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ title, dueDate, isCompleted }),
    })
    return r.json()
  },
  async deleteFocusRoomTask(taskId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/focus-room/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async startSession(roomId: number | null, sessionType: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { sessionId: 123 } })
    const r = await fetch('/api/v1/workflow/personal/tracking/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ roomId, sessionType }),
    })
    return r.json()
  },
  async endSession(sessionId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { expEarned: 50 } })
    const r = await fetch(`/api/v1/workflow/personal/tracking/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
      },
    })
    return r.json()
  },
  async getWeeklyStudyHours(): Promise<ApiResponse<number[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [1.2, 2.5, 0.8, 3.0, 0.5, 4.2, 1.0] })
    const r = await fetch('/api/v1/workflow/personal/tracking/sessions/weekly', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createNote(content: string, isPinned = false, tags = '', linkedToId?: number, linkedToType?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/tracking/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ content, isPinned, tags: tags || null, linkedToId, linkedToType }),
    })
    return r.json()
  },
  async getNotes(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/tracking/notes', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async deleteNote(noteId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/tracking/notes/${noteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async generateQuiz(documentId: number, prompt: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/quizzes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ documentId, prompt }),
    })
    return r.json()
  },
  async startQuizAttempt(quizId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { attemptId: 456 } })
    const r = await fetch('/api/v1/workflow/personal/quiz-attempts/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ quizId }),
    })
    return r.json()
  },
  async submitQuizAttempt(attemptId: number, answers: any[]): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/quiz-attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ answers }),
    })
    return r.json()
  },
  async getQuizAttemptHistory(quizId: number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/personal/quiz-attempts/history/${quizId}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getQuizAttemptDetail(attemptId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/quiz-attempts/${attemptId}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async checkoutPayOs(packageId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { checkoutUrl: 'http://localhost:5173/dashboard' } })
    const r = await fetch(`/api/v1/workflow/payment/checkout?packageId=${packageId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async checkoutSubscription(planId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { checkoutUrl: 'http://localhost:5173/subscription' } })
    const r = await fetch('/api/v1/workflow/payment/subscription/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ planId }),
    })
    return r.json()
  },
  async getCoinPackages(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/payment/coin-packages', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getUserWallet(): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { balance: 100 } })
    const r = await fetch('/api/v1/workflow/payment/wallet', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getTransactions(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/payment/transactions', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getSubscriptionPlans(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/payment/subscription/plans', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getQuizQuestions(quizId: number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/personal/quizzes/${quizId}/questions`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getSummaries(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/summaries/history', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getQuizSets(q?: string, difficulty?: string): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const params = new URLSearchParams()
    if (q) params.append('q', q)
    if (difficulty) params.append('difficulty', difficulty)
    const url = `/api/v1/workflow/personal/quiz-sets${params.toString() ? `?${params.toString()}` : ''}`
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    const res = await r.json()
    if (res.success && Array.isArray(res.data)) {
      res.data = [...res.data].sort((a: any, b: any) => b.quizId - a.quizId)
    }
    return res
  },
  async updateQuizSetSharing(quizId: number, visibility: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/quiz-sets/${quizId}/sharing`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ visibility }),
    })
    return r.json()
  },
  async uploadDocument(file: File, title?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { documentId: 789 } })
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)

    const r = await fetch('/api/v1/workflow/personal/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: formData,
    })
    return r.json()
  },
  async getDocuments(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/documents', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async askDocumentQuestion(documentId: number, question: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: "Mock answer" })
    const r = await fetch(`/api/v1/workflow/personal/documents/${documentId}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ question }),
    })
    return r.json()
  },
  async changeUserStatus(userSso: string, status: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/users/${userSso}/change-status?status=${encodeURIComponent(status)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async adjustUserWallet(userSso: string, amount: number, reason: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/users/${userSso}/adjust-wallet?amount=${amount}&reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createAdminUser(email: string, password: string, fullName: string, systemRole: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ email, password, fullName, systemRole }),
    })
    return r.json()
  },
  async updateAdminUserRole(userSso: string, systemRole: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/users/${userSso}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ systemRole }),
    })
    return r.json()
  },
  async updateAdminUserPlan(userSso: string, planType: string, durationDays?: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/users/${userSso}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ planType, durationDays: durationDays ?? null, planExpiresAt: null }),
    })
    return r.json()
  },
  async forceCloseAdminRoom(roomId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/rooms/${roomId}/force-close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getMySupportMessages(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/support/messages', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async sendSupportMessage(message: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/support/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ message }),
    })
    return r.json()
  },
  async getAdminSupportConversations(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/support/conversations', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminSupportConversation(userSso: string): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/personal/admin/support/conversations/${userSso}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async sendAdminSupportReply(userSso: string, message: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/support/conversations/${userSso}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ message }),
    })
    return r.json()
  },
  async setSystemConfig(key: string, value: string, description?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const url = `/api/v1/workflow/personal/admin/configs?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}${description ? `&description=${encodeURIComponent(description)}` : ''}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAuditLogs(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/audit-logs', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminOverview(): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { totalUsers: 0, activeUsers: 0 } })
    const r = await fetch('/api/v1/workflow/personal/admin/overview', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminRooms(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/rooms', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminUserGrowth(months = 6): Promise<ApiResponse<{ label: string; value: number }[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/personal/admin/overview/user-growth?months=${months}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminPlanDistribution(): Promise<ApiResponse<{ label: string; value: number }[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/overview/plan-distribution', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminRevenueKpis(): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { totalRevenue: 0, totalTransactions: 0, currency: 'VND' } })
    const r = await fetch('/api/v1/workflow/personal/admin/revenue/kpis', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminRevenueOverTime(months = 6): Promise<ApiResponse<{ label: string; value: number }[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/personal/admin/revenue/over-time?months=${months}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getAdminRevenueDistribution(): Promise<ApiResponse<{ label: string; value: number }[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/revenue/distribution', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getReportedUsers(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/reported-users', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async banReportedUser(userSso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/reported-users/${userSso}/ban`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Meetings ──
  async createMeeting(teamId: number, title: string, projectId?: number, agenda?: string, description?: string, scheduledStart?: string, scheduledEnd?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { meetingId: 1 } })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({
        title,
        projectId,
        agenda: agenda || 'Chương trình họp',
        description: description || 'Mô tả cuộc họp',
        scheduledStart: scheduledStart || new Date().toISOString(),
        scheduledEnd: scheduledEnd || new Date(Date.now() + 3600000).toISOString()
      }),
    })
    return r.json()
  },
  async getActiveMeeting(teamId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: null })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/meetings/active`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async joinMeeting(meetingId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/meetings/${meetingId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async addMeetingNote(meetingId: number, content: string, isShared?: boolean): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/meetings/${meetingId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ content, isShared }),
    })
    return r.json()
  },
  async endMeeting(meetingId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/meetings/${meetingId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getMeetingSummary(meetingId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/meetings/${meetingId}/summary`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async transcribeMeeting(meetingId: number, file: File): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const formData = new FormData()
    formData.append('file', file)
    const r = await fetch(`/api/v1/workflow/meetings/${meetingId}/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: formData,
    })
    return r.json()
  },
  async exportProjectTasks(projectId: number): Promise<Blob> {
    if (useMock) {
      const csvContent = "Task ID,Title,Description,Status,Priority\n1,Sample Task,This is mock data,OPEN,MEDIUM"
      return new Blob([csvContent], { type: 'text/csv' })
    }
    const r = await fetch(`/api/v1/workflow/projects/${projectId}/export`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.blob()
  },

  // ── Schedules / Calendar ──
  async createScheduleCategory(name: string, color?: string, icon?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/schedules/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ name, color, icon }),
    })
    return r.json()
  },
  async getScheduleCategories(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/schedules/categories', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createSchedule(title: string, startTime: string, endTime: string, categoryId?: number, description?: string, location?: string, isAllDay?: boolean): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ title, startTime, endTime, categoryId, description, location, isAllDay }),
    })
    return r.json()
  },
  async assistSchedule(prompt: string): Promise<ApiResponse<{ reply: string; created?: any }>> {
    if (useMock) {
      return Promise.resolve({
        success: true,
        data: { reply: `Sure! I've noted: ${prompt}`, created: null },
      })
    }
    const r = await fetch('/api/v1/workflow/personal/schedules/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ prompt }),
    })
    return r.json()
  },
  async getSchedules(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/schedules', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async deleteSchedule(scheduleId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Chat / AI Conversations ──
  async createConversation(title?: string, contextType?: string): Promise<ApiResponse<any>> {
    if (useMock) {
      return Promise.resolve({
        success: true,
        data: {
          conversationId: Date.now(),
          title: title || 'Trò chuyện mới',
          contextType: contextType || 'GENERAL',
          lastMessageAt: new Date().toISOString()
        }
      })
    }
    const r = await fetch('/api/v1/workflow/personal/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ title, contextType }),
    })
    return r.json()
  },
  async getConversations(): Promise<ApiResponse<any[]>> {
    if (useMock) {
      return Promise.resolve({
        success: true,
        data: [
          { conversationId: 1, title: 'Giải thích quang hợp', lastMessageAt: new Date().toISOString() },
          { conversationId: 2, title: 'Tóm tắt chương 3 Lịch sử', lastMessageAt: new Date().toISOString() }
        ]
      })
    }
    const r = await fetch('/api/v1/workflow/personal/chat/conversations', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async sendChatMessage(conversationId: number, content: string, documentId?: number): Promise<ApiResponse<any>> {
    if (useMock) {
      return Promise.resolve({
        success: true,
        data: {
          messageId: Date.now(),
          sender: 'ASSISTANT',
          messageText: `Đây là câu trả lời thử nghiệm từ AI cho câu hỏi: "${content}"`,
          sentAt: new Date().toISOString()
        }
      })
    }
    const r = await fetch(`/api/v1/workflow/personal/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ messageText: content, documentId }),
    })
    return r.json()
  },
  async getChatMessages(conversationId: number): Promise<ApiResponse<any[]>> {
    if (useMock) {
      return Promise.resolve({
        success: true,
        data: [
          { messageId: 101, sender: 'USER', messageText: 'Chào AI Tutor', sentAt: new Date().toISOString() },
          { messageId: 102, sender: 'ASSISTANT', messageText: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?', sentAt: new Date().toISOString() }
        ]
      })
    }
    const r = await fetch(`/api/v1/workflow/personal/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Room Posts ──
  async createRoomPost(roomId: number, content: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ content }),
    })
    return r.json()
  },
  async getRoomPosts(roomId: number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/posts`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async pinRoomPost(roomId: number, postId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/posts/${postId}/pin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async deleteRoomPost(roomId: number, postId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Room Matching ──
  async matchRoom(preferences: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/rooms/matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(preferences),
    })
    return r.json()
  },

  // ── Room Management ──
  async closeRoom(roomId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async openRoom(roomId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/open`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async kickRoomMember(roomId: number, targetUserSso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/members/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ targetUserSso }),
    })
    return r.json()
  },
  async promoteRoomHost(roomId: number, targetUserSso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/members/promote-host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ targetUserSso }),
    })
    return r.json()
  },
  async getRoomDetail(roomId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getRoomTimeline(roomId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/rooms/${roomId}/timeline`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Flashcard Review ──
  async reviewFlashcard(quizId: number, quizQuestionId: number, quality: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ quizId, quizQuestionId, quality }),
    })
    return r.json()
  },

  // ── Mindmaps ──
  async createMindmap(documentId: number, title: string, content: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/mindmaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ documentId, title, content }),
    })
    return r.json()
  },
  async getMindmaps(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/mindmaps', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async summarizeDocument(documentId: number, summaryType?: string, prompt?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true, data: { content: 'This is a mock summary.' } })
    const r = await fetch(`/api/v1/workflow/personal/documents/${documentId}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ summaryType, prompt }),
    })
    return r.json()
  },
  async getSummaryHistory(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/summaries/history', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Team Management ──
  async updateTeam(teamId: number, data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },
  async deleteTeam(teamId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async addTeamMember(teamId: number, userSso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ userSso }),
    })
    return r.json()
  },
  async getTeamMembers(teamId: number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/members`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async removeTeamMember(teamId: number, targetUserSso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/members/${targetUserSso}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async leaveTeam(teamId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async regenerateInviteCode(teamId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/teams/${teamId}/regenerate-invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },

  // ── Task Submissions ──
  async submitTask(taskId: number, content: string, attachments?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ content, attachments }),
    })
    return r.json()
  },
  async getTaskSubmissions(taskId: number): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}/submissions`, {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async evaluateSubmission(submissionId: number, grade: number, feedback: string, status?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/submissions/${submissionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ grade, feedback, status }),
    })
    return r.json()
  },

  // ── Task Extra ──
  async assignTask(taskId: number, targetUserSso: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ targetUserSso }),
    })
    return r.json()
  },
  async addTaskDependency(taskId: number, dependsOnTaskId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ dependsOnTaskId }),
    })
    return r.json()
  },
  async addTaskComment(taskId: number, content: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ content }),
    })
    return r.json()
  },
  async addTaskAttachment(taskId: number, title: string, url: string, attachmentType?: string): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify({ title, url, attachmentType }),
    })
    return r.json()
  },
  async updateTask(taskId: number, data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },

  // ── Admin Coin Packages ──
  async createCoinPackage(data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/admin/coin-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },
  async updateCoinPackage(packageId: number, data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/coin-packages/${packageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },

  // ── Admin Subscription Plans ──
  async getAdminSubscriptionPlans(): Promise<ApiResponse<any[]>> {
    if (useMock) return Promise.resolve({ success: true, data: [] })
    const r = await fetch('/api/v1/workflow/personal/admin/subscription-plans', {
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async createSubscriptionPlan(data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch('/api/v1/workflow/personal/admin/subscription-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },
  async updateSubscriptionPlan(planId: number, data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/admin/subscription-plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },

  // ── Project update/delete ──
  async updateProject(projectId: number, data: any): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` },
      body: JSON.stringify(data),
    })
    return r.json()
  },
  async deleteProject(projectId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async deleteDocument(documentId: number): Promise<ApiResponse<any>> {
    if (useMock) return Promise.resolve({ success: true })
    const r = await fetch(`/api/v1/workflow/personal/documents/${documentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getStoredToken()}` },
    })
    return r.json()
  },
  async getPublicAchievements(userSso: string): Promise<ApiResponse<any[]>> {
    if (useMock) {
      return Promise.resolve({
        success: true,
        data: [
          { achievementId: 1, name: 'FIRST_STEP', displayName: 'Khởi Đầu Vững Chắc', description: 'Đạt chuỗi học tập liên tiếp 1 ngày', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png', requirementType: 'STREAK', requirementValue: 1, progress: 1, isUnlocked: true },
          { achievementId: 2, name: 'THREE_DAY_STREAK', displayName: 'Nỗ Lực Không Ngừng', description: 'Duy trì chuỗi học tập 3 ngày liên tiếp', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583272.png', requirementType: 'STREAK', requirementValue: 3, progress: 1, isUnlocked: false }
        ]
      })
    }
    const r = await fetch(`/api/v1/workflow/public/achievements/${userSso}`, {
      method: 'GET'
    })
    return r.json()
  },
}

export function getStoredToken(): string | null {
  return localStorage.getItem('access_token')
}

export function setStoredToken(token: string): void {
  localStorage.setItem('access_token', token)
}

export function clearStoredToken(): void {
  localStorage.removeItem('access_token')
}
