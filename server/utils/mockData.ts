// ============================================================
// [MOCK] Shared in-memory mock data for local development.
// Delete server/ directory to remove all mocks.
// ============================================================

export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
}

export const MOCK_CREDENTIALS = {
  username: 'testuser',
  password: 'password123'
}

// Not a real JWT — just a recognizable fake token.
export const MOCK_TOKEN = 'mock.jwt.token-for-local-dev-only'

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

export const MOCK_PROJECTS = [
  { id: '00000000-0000-0000-0000-000000000020', name: 'Internal', color: 'emerald' },
  { id: '00000000-0000-0000-0000-000000000021', name: 'Client A', color: 'blue' },
  { id: '00000000-0000-0000-0000-000000000022', name: 'Open Source', color: 'purple' }
]

export const MOCK_TAGS = ['Engineering', 'Urgent', 'Research', 'UI/UX']

export const MOCK_TIME_ENTRIES = [
  {
    id: '00000000-0000-0000-0000-000000000030',
    description: 'Design System Overhaul',
    projectId: '00000000-0000-0000-0000-000000000020',
    duration: 7200,
    createdAt: '2026-04-27T10:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000031',
    description: 'Fixing Sidebar bugs',
    projectId: '00000000-0000-0000-0000-000000000020',
    duration: 3600,
    createdAt: '2026-04-27T11:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000032',
    description: 'Client Meeting',
    projectId: '00000000-0000-0000-0000-000000000021',
    duration: 1800,
    createdAt: '2026-04-26T14:00:00Z'
  }
]
