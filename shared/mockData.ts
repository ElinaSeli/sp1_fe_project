import type { Project, Tag, Issue } from '../app/types'

// [MOCK] Single source of truth for all mock data.
// Imported by server/middleware/01.mockApi.ts (dev).
// Delete this file and the middleware when real BE is ready.

export const MOCK_TOKEN = 'mock.jwt.token-for-local-dev-only'
export const MOCK_CREDENTIALS = { username: 'testuser', password: 'password123' }

export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
}

export const MOCK_AUTH_RESPONSE = {
  username: MOCK_USER.username,
  roles: ['ROLE_USER'],
  access_token: MOCK_TOKEN,
  token_type: 'Bearer',
  expires_in: 3600
}

export const MOCK_WORKSPACES = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'My Workspace',
    description: 'Default personal workspace',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'Team Workspace',
    description: null,
    createdAt: '2025-02-01T00:00:00Z'
  }
]
// ---------------------------------------------------------------------------
// Seed data (immutable constants)
// ---------------------------------------------------------------------------

const WORKSPACE_ID = '00000000-0000-0000-0000-000000000010'

const SEED_PROJECTS: Project[] = [
  {
    id: '00000000-0000-0000-0000-000000000020',
    workspaceId: WORKSPACE_ID,
    name: 'Internal',
    color: '#10b981',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    workspaceId: WORKSPACE_ID,
    name: 'Client A',
    color: '#3b82f6',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000022',
    workspaceId: WORKSPACE_ID,
    name: 'Open Source',
    color: '#8b5cf6',
    isImported: false,
    externalId: null
  }
]

const SEED_TAGS: Tag[] = [
  {
    id: '00000000-0000-0000-0000-000000000050',
    workspaceId: WORKSPACE_ID,
    name: 'Engineering',
    color: '#10b981',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000051',
    workspaceId: WORKSPACE_ID,
    name: 'Urgent',
    color: '#ef4444',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000052',
    workspaceId: WORKSPACE_ID,
    name: 'Research',
    color: '#f59e0b',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000053',
    workspaceId: WORKSPACE_ID,
    name: 'UI/UX',
    color: '#6366f1',
    isImported: false,
    externalId: null
  }
]

const SEED_ISSUES: Issue[] = [
  {
    id: '00000000-0000-0000-0000-000000000040',
    workspaceId: WORKSPACE_ID,
    projectId: '00000000-0000-0000-0000-000000000020',
    name: 'Development',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000041',
    workspaceId: WORKSPACE_ID,
    projectId: '00000000-0000-0000-0000-000000000020',
    name: 'Design',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000042',
    workspaceId: WORKSPACE_ID,
    projectId: '00000000-0000-0000-0000-000000000020',
    name: 'Code Review',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000043',
    workspaceId: WORKSPACE_ID,
    projectId: '00000000-0000-0000-0000-000000000021',
    name: 'Meeting',
    isImported: false,
    externalId: null
  },
  {
    id: '00000000-0000-0000-0000-000000000044',
    workspaceId: WORKSPACE_ID,
    projectId: '00000000-0000-0000-0000-000000000022',
    name: 'Bug Fix',
    isImported: false,
    externalId: null
  }
]

// ---------------------------------------------------------------------------
// Mutable in-memory stores (POST handlers push into these)
// ---------------------------------------------------------------------------

export const mockStore = {
  projects: [...SEED_PROJECTS],
  tags: [...SEED_TAGS],
  issues: [...SEED_ISSUES]
}

/** Reset all mock data to seed state (useful for tests) */
export function resetMockData() {
  mockStore.projects = [...SEED_PROJECTS]
  mockStore.tags = [...SEED_TAGS]
  mockStore.issues = [...SEED_ISSUES]
}

// ---------------------------------------------------------------------------
// Time entries (unchanged)
// ---------------------------------------------------------------------------

export const MOCK_TIME_ENTRIES = [
  {
    id: '00000000-0000-0000-0000-000000000030',
    description: 'Design System Overhaul',
    projectId: '00000000-0000-0000-0000-000000000020',
    issueId: null,
    timeStart: '2026-04-27T10:00:00Z',
    timeEnd: '2026-04-27T12:00:00Z',
    timeEntryState: 'VALIDATED',
    syncState: 'SYNCED',
    tagIds: []
  },
  {
    id: '00000000-0000-0000-0000-000000000031',
    description: 'Fixing Sidebar bugs',
    projectId: '00000000-0000-0000-0000-000000000020',
    issueId: null,
    timeStart: '2026-04-27T11:00:00Z',
    timeEnd: '2026-04-27T12:00:00Z',
    timeEntryState: 'VALIDATED',
    syncState: 'SYNCED',
    tagIds: []
  },
  {
    id: '00000000-0000-0000-0000-000000000032',
    description: 'Client Meeting',
    projectId: '00000000-0000-0000-0000-000000000021',
    issueId: null,
    timeStart: '2026-04-26T14:00:00Z',
    timeEnd: '2026-04-26T14:30:00Z',
    timeEntryState: 'VALIDATED',
    syncState: 'SYNCED',
    tagIds: []
  }
]
