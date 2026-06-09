/**
 * types/index.ts
 *
 * Canonical TypeScript domain types for the SP1 Time Tracking application.
 * Aligned with Micronaut backend Swagger specification (v0.1).
 */

// ---------------------------------------------------------------------------
// Auth & Users
// ---------------------------------------------------------------------------

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
}

export type AuthUser = User

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface MembershipResponse {
  id: string
  userId: string
  username: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

export interface AuthResponse {
  username: string
  access_token: string
  token_type: string
  expires_in?: number | null
  refresh_token?: string | null
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export interface Workspace {
  id: string
  name: string
  description?: string | null
  createdAt?: string | null
}

export interface CreateWorkspaceRequest {
  name: string
  description?: string | null
}

// ---------------------------------------------------------------------------
// Project / Issue / Tag  (aligned with Micronaut backend DTOs)
// ---------------------------------------------------------------------------

export interface Project {
  id: string
  workspaceId: string
  name: string
  color?: string | null
  isExternal: boolean
  externalId?: string | null
}

export interface CreateProjectRequest {
  name: string
  color?: string | null
}

export interface UpdateProjectRequest {
  name: string
  description?: string | null
}

export interface ProjectListResponse {
  data: Project[]
  error?: string | null
}

export interface Issue {
  id: string
  workspaceId: string
  projectId: string
  name: string

  externalId?: string | null
}

export interface CreateIssueRequest {
  projectId: string
  name: string
}

export interface Tag {
  id: string
  workspaceId: string
  projectId: string
  name: string
  color?: string | null

  externalId?: string | null
}

export interface CreateTagRequest {
  projectId: string
  name: string
  color?: string | null
}

/** @deprecated Use Issue instead — kept for timer store backward-compat */
export type Task = Issue

// ---------------------------------------------------------------------------
// Time Entries
// ---------------------------------------------------------------------------

export type SyncState = 'LOCAL_ONLY' | 'PENDING' | 'SYNCED' | 'ERROR'
export type TimeEntryState =
  | 'DRAFT'
  | 'RUNNING'
  | 'VALIDATED'
  | 'SYNC_PENDING'
  | 'SYNCED'
  | 'DELETED'

export interface TimeEntry {
  id: string
  projectId: string | null
  issueId: string | null
  description: string | null
  timeStart: string // ISO date-time
  timeEnd: string | null // ISO date-time
  timeEntryState: TimeEntryState
  syncState: SyncState
  tagIds: string[]
}

export interface CreateTimeEntryRequest {
  projectId?: string | null
  issueId?: string | null
  description?: string | null
  timeStart: string // ISO date-time
  timeEnd: string // ISO date-time
  tagIds: string[]
}

export interface StartTimerRequest {
  projectId?: string | null
  issueId?: string | null
  description?: string | null
  /** Tags to associate with the entry at start time. */
  tagIds?: string[]
}

export interface UpdateTimeEntryRequest {
  projectId?: string | null
  issueId?: string | null
  description?: string | null
  timeStart: string
  timeEnd: string
  tagIds: string[]
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export interface Integration {
  id: string
  name: string
  userId: string
  workspaceId: string
  url: string
  apiKey: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface IntegrationRequest {
  name: string
  url: string
  apiKey: string
}

export interface TestConnectionRequest {
  url: string
  apiKey: string
}

export interface TestConnectionResponse {
  success: boolean
  message: string
}

// ---------------------------------------------------------------------------
// Keybindings
// ---------------------------------------------------------------------------

export type KeybindingActionId =
  | 'startTimer'
  | 'saveTimer'
  | 'stopTimer'
  | 'resumeLast'
  | 'goToDashboard'
  | 'focusTaskField'
  | 'focusDescField'
  | 'editLastEntry'
  | 'newTimeEntry'
  | 'createNew'
  | 'toggleSidebar'

export type KeybindingCategory = 'timer' | 'navigation' | 'timeEntry' | 'special'

export interface KeybindingAction {
  id: KeybindingActionId
  label: string
  description: string
  category: KeybindingCategory
}

export interface KeybindingBinding {
  key: string
  enabled: boolean
}

// ---------------------------------------------------------------------------
// Generic service layer contract
// ---------------------------------------------------------------------------

export interface ServiceResponse<T> {
  data: T | null
  error: string | null
}

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export interface TimeEntryViewModel {
  id: string
  description: string
  projectId: string | null
  /** Preserved from raw TimeEntry so the edit dialog and resume flow can read it. */
  issueId: string | null
  /** Preserved from raw TimeEntry so tags are visible in the list and edit dialog. */
  tagIds: string[]
  duration: number
  timeStart: string
  timeEnd: string | null
}
