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
  createdAt?: string | null
  updatedAt?: string | null
}

/** Subset returned by auth /api/v1/users/me; compatible with UserDto. */
export type MeResponse = Pick<UserDto, 'userSso' | 'email' | 'fullName'>

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
