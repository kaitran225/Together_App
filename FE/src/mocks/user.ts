import type { ApiResponse, MeResponse, UserDto } from '../types/dto'

/** Fake users matching BE UserDto shape (for mock mode). */
export const fakeUsers: UserDto[] = [
  {
    userId: 1,
    userSso: 'user-001',
    email: 'alice@example.com',
    fullName: 'Alice Demo',
    avatarUrl: null,
    planType: 'free',
    planExpiresAt: null,
    exp: 120,
    level: 2,
    streak: 5,
    longestStreak: 12,
    lastActiveDate: '2025-03-07',
    status: 'ACTIVE',
    emailVerified: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-03-07T08:00:00Z',
  },
  {
    userId: 2,
    userSso: 'user-002',
    email: 'bob@example.com',
    fullName: 'Bob Tester',
    avatarUrl: null,
    planType: 'premium',
    planExpiresAt: '2025-12-31T23:59:59Z',
    exp: 450,
    level: 4,
    streak: 0,
    longestStreak: 7,
    lastActiveDate: '2025-03-06',
    status: 'ACTIVE',
    emailVerified: true,
    createdAt: '2025-02-01T12:00:00Z',
    updatedAt: '2025-03-06T14:00:00Z',
  },
]

/** Default user used when mock /me is called (first fake user as MeResponse). */
export function getFakeMeResponse(): ApiResponse<MeResponse> {
  const u = fakeUsers[0]
  return {
    success: true,
    data: {
      userSso: u.userSso,
      email: u.email,
      fullName: u.fullName ?? undefined,
    },
  }
}
