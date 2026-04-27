// ============================================================
// [MOCK] API mock middleware — runs before proxy and routes.
// Delete server/ directory to remove all mocks.
// Credentials: testuser / password123
// ============================================================

import {
  MOCK_TOKEN,
  MOCK_CREDENTIALS,
  MOCK_AUTH_RESPONSE,
  MOCK_USER,
  MOCK_WORKSPACES
} from '../utils/mockData'

function isValidToken(event: Parameters<typeof getHeader>[0]) {
  const auth = getHeader(event, 'authorization')
  return auth?.startsWith('Bearer ') && auth.slice(7) === MOCK_TOKEN
}

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api-proxy/')) return

  const method = event.method
  const path = event.path.slice('/api-proxy'.length).split('?')[0]

  // POST /login
  if (path === '/login' && method === 'POST') {
    const body = await readBody<{ username?: string; password?: string }>(event)
    if (
      body.username !== MOCK_CREDENTIALS.username ||
      body.password !== MOCK_CREDENTIALS.password
    ) {
      setResponseStatus(event, 401)
      return { message: 'Invalid credentials' }
    }
    return MOCK_AUTH_RESPONSE
  }

  // POST /api/users/register
  if (path === '/api/users/register' && method === 'POST') {
    const body = await readBody<Record<string, string>>(event)
    const required = ['username', 'email', 'password', 'firstName', 'lastName']
    const missing = required.filter((k) => !body[k])
    if (missing.length) {
      setResponseStatus(event, 422)
      return { message: `Missing fields: ${missing.join(', ')}` }
    }
    if (body.password.length < 8) {
      setResponseStatus(event, 422)
      return { message: 'Password must be at least 8 characters' }
    }
    setResponseStatus(event, 201)
    return null
  }

  // GET /api/users/me
  if (path === '/api/users/me' && method === 'GET') {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return MOCK_USER
  }

  // GET /api/workspaces
  if (path === '/api/workspaces' && method === 'GET') {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return MOCK_WORKSPACES
  }

  // Path not mocked yet
  setResponseStatus(event, 501)
  return { message: `[MOCK] Not implemented: ${method} ${path}` }
})
