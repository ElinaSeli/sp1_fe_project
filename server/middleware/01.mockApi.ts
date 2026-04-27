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
  MOCK_WORKSPACES,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_TAGS,
  MOCK_TIME_ENTRIES
} from '../utils/mockData'

function isValidToken(event: Parameters<typeof getHeader>[0]) {
  const auth = getHeader(event, 'authorization')
  return auth?.startsWith('Bearer ') && auth.slice(7) === MOCK_TOKEN
}

// In-memory timer state — resets on server restart.
let activeTimer: {
  id: string
  description: string | null
  projectId: string | null
  issueId: string | null
  tagIds: string[]
  timeStart: string
  timeEnd: string | null
  timeEntryState: string
  syncState: string
} | null = null

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api-proxy/')) return

  const method = event.method
  const path = event.path.slice('/api-proxy'.length).split('?')[0]!

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
    if ((body.password?.length || 0) < 8) {
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

  // GET /api/workspaces/:id/projects
  if (path.match(/^\/api\/workspaces\/[^/]+\/projects$/) && method === 'GET') {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return MOCK_PROJECTS
  }

  // GET /api/workspaces/:id/tasks
  if (path.match(/^\/api\/workspaces\/[^/]+\/tasks$/) && method === 'GET') {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return MOCK_TASKS
  }

  // GET /api/workspaces/:id/tags
  if (path.match(/^\/api\/workspaces\/[^/]+\/tags$/) && method === 'GET') {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return MOCK_TAGS
  }

  // GET /api/workspaces/:id/entries
  if (path.match(/^\/api\/workspaces\/[^/]+\/entries$/) && method === 'GET') {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }
    return MOCK_TIME_ENTRIES
  }

  // Timer routes: /api/workspaces/:workspaceId/timer[/start|/stop]
  const timerBase = path.match(/^\/api\/workspaces\/[^/]+\/timer(\/start|\/stop)?$/)
  if (timerBase) {
    if (!isValidToken(event)) {
      setResponseStatus(event, 401)
      return { message: 'Unauthorized' }
    }

    const sub = timerBase[1]

    // GET /api/workspaces/:id/timer — fetch active timer
    if (!sub && method === 'GET') {
      if (!activeTimer) {
        setResponseStatus(event, 204)
        return null
      }
      return activeTimer
    }

    // POST /api/workspaces/:id/timer/start
    if (sub === '/start' && method === 'POST') {
      if (activeTimer) {
        setResponseStatus(event, 409)
        return { message: 'Timer already running' }
      }
      const body = await readBody<{
        description?: string
        projectId?: string
        taskId?: string
        tagIds?: string[]
      }>(event)
      activeTimer = {
        id: 'mock-timer-' + Date.now(),
        description: body.description || null,
        projectId: body.projectId || null,
        issueId: body.taskId || null,
        tagIds: body.tagIds || [],
        timeStart: new Date().toISOString(),
        timeEnd: null,
        timeEntryState: 'RUNNING',
        syncState: 'LOCAL_ONLY'
      }
      return activeTimer
    }

    // POST /api/workspaces/:id/timer/stop
    if (sub === '/stop' && method === 'POST') {
      if (!activeTimer) {
        setResponseStatus(event, 404)
        return { message: 'No active timer' }
      }
      const stopped = {
        ...activeTimer,
        timeEnd: new Date().toISOString(),
        timeEntryState: 'VALIDATED'
      }
      activeTimer = null
      return stopped
    }
  }

  // Path not mocked yet
  setResponseStatus(event, 501)
  return { message: `[MOCK] Not implemented: ${method} ${path}` }
})
