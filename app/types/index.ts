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
  roles: string[]
  access_token: string
  token_type: string
  expires_in: number
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
// Project / Task / Tag
// ---------------------------------------------------------------------------

export interface Project {
  id: string
  name: string
  color?: string
}

export interface Task {
  id: string
  name: string
  projectId: string
}

export interface Tag {
  id: string
  name: string
}

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
  projectId: string
  issueId?: string | null
  description?: string | null
  timeStart: string // ISO date-time
  timeEnd: string // ISO date-time
  tagIds: string[]
}

export interface StartTimerRequest {
  projectId: string
  issueId?: string | null
  description?: string | null
}

export interface UpdateTimeEntryRequest {
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
  userId: string
  workspaceId: string
  url: string
  apiKey: string
  status: 'active' | 'inactive'
  createdAt: string
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
  duration: number
  timeStart: string
}
