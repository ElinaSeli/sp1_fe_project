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
