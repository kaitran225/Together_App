/**
 * FE types mirroring BE DTOs in common/dto for type safety and fake data.
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errorCode?: string
}

/** Mirrors BE UserDto (Instant/LocalDate as ISO strings). */
export interface UserDto {
  userId?: number | null
  userSso: string
  email: string
  fullName?: string | null
  avatarUrl?: string | null
  planType?: string | null
  planExpiresAt?: string | null
  exp?: number | null
  level?: number | null
  streak?: number | null
  longestStreak?: number | null
  lastActiveDate?: string | null
  status?: string | null
  emailVerified?: boolean | null
  systemRole?: string | null
  isAdmin?: boolean | null
  createdBy?: string | null
  createdAt?: string | null
  updatedBy?: string | null
  updatedAt?: string | null
  skills?: string[] | null
  learningGoals?: string[] | null
}

/** Full UserDto returned by auth /api/v1/users/me. */
export type MeResponse = UserDto

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type SortDirection = 'ASC' | 'DESC'

export interface SortOrder {
  property: string
  direction?: SortDirection
}

export interface PageRequest {
  page?: number
  size?: number
  sort?: SortOrder[]
}
