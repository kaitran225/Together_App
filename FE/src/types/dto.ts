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

// ── Task DTOs (mirrors BE TaskDtos / ScrumBoardDtos / TaskSubmissionDtos) ──

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED' | 'DRAFT' | string
export type TaskSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMIT_TASK' | string

export interface TaskDependencyResponse {
  dependsOnTaskId: number
  dependencyType: string
}

export interface TaskCommentResponse {
  commentId: number
  userSso: string
  content: string
  attachments?: string | null
  createdAt?: string | null
}

export interface TaskAttachmentResponse {
  attachmentId: number
  attachmentType?: string | null
  title: string
  url: string
  uploadedBy?: string | null
  uploadedAt?: string | null
}

/** Mirrors BE TaskDtos.TaskDetailsResponse */
export interface TaskDetailsResponse {
  taskId: number
  projectId?: number | null
  teamId?: number | null
  roomId?: number | null
  parentTaskId?: number | null
  title: string
  description?: string | null
  status?: TaskStatus | null
  priority?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  startDate?: string | null
  dueDate?: string | null
  completedAt?: string | null
  columnId?: number | null
  sprintId?: number | null
  assignees?: string[] | null
  dependencies?: TaskDependencyResponse[] | null
  comments?: TaskCommentResponse[] | null
  attachments?: TaskAttachmentResponse[] | null
}

/** Mirrors BE ScrumBoardDtos.TaskSummaryResponse */
export interface TaskSummaryResponse {
  taskId: number
  title: string
  description?: string | null
  status?: TaskStatus | null
  priority?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  dueDate?: string | null
  sprintId?: number | null
  assignee?: string | null
  startDate?: string | null
  completedAt?: string | null
}

/** Mirrors BE TaskDtos.CreateTaskRequest */
export interface CreateTaskRequest {
  title: string
  description?: string | null
  priority?: string | null
  estimatedHours?: number | null
  startDate?: string | null
  dueDate?: string | null
  parentTaskId?: number | null
  sprintId?: number | null
  columnId?: number | null
}

/** Mirrors BE TaskDtos.UpdateTaskRequest */
export interface UpdateTaskRequest {
  title?: string | null
  description?: string | null
  priority?: string | null
  startDate?: string | null
  dueDate?: string | null
  completedAt?: string | null
  status?: string | null
}

export interface AssignTaskRequest {
  targetUserSso: string
}

export interface AddTaskDependencyRequest {
  dependsOnTaskId: number
  dependencyType?: string | null
}

export interface AddTaskCommentRequest {
  content: string
  attachments?: string | null
}

export interface AddAttachmentRequest {
  title: string
  url: string
  attachmentType?: string | null
}

/** Mirrors BE TaskSubmissionDtos.TaskSubmissionResponse */
export interface TaskSubmissionResponse {
  submissionId: number
  taskId: number
  userSso: string
  content: string
  attachments?: string | null
  grade?: number | null
  feedback?: string | null
  status?: TaskSubmissionStatus | null
  submittedAt?: string | null
}

export interface SubmitTaskRequest {
  content: string
  attachments?: string | null
}

export interface EvaluateTaskRequest {
  grade?: number | null
  feedback?: string | null
  status?: TaskSubmissionStatus | null
}
