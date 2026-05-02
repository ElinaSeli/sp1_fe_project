// [MOCK] Pure routing handler — no framework deps, callable from both Nitro and browser.
// Delete when real BE is ready.

import {
  MOCK_TOKEN,
  MOCK_CREDENTIALS,
  MOCK_USER,
  MOCK_AUTH_RESPONSE,
  MOCK_WORKSPACES,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_TAGS,
  MOCK_TIME_ENTRIES
} from '#shared/mockData'

export interface MockResponse {
  status: number
  data: unknown
}

// In-memory timer state. Each bundle (server / client) gets its own module instance,
// so they never share state — but only one is ever active at a time anyway.
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

function ok(data: unknown, status = 200): MockResponse {
  return { status, data }
}

function err(message: string, status: number): MockResponse {
  return { status, data: { message } }
}

export function handleMockRequest(
  path: string,
  method: string,
  body: Record<string, unknown>,
  authToken: string | null
): MockResponse {
  const validToken = authToken?.startsWith('Bearer ') && authToken.slice(7) === MOCK_TOKEN

  // POST /login
  if (path === '/login' && method === 'POST') {
    if (body.username !== MOCK_CREDENTIALS.username || body.password !== MOCK_CREDENTIALS.password) {
      return err('Invalid credentials', 401)
    }
    return ok(MOCK_AUTH_RESPONSE)
  }

  // POST /api/users/register
  if (path === '/api/users/register' && method === 'POST') {
    const required = ['username', 'email', 'password', 'firstName', 'lastName']
    const missing = required.filter((k) => !body[k])
    if (missing.length) return err(`Missing fields: ${missing.join(', ')}`, 422)
    if (typeof body.password === 'string' && body.password.length < 8) {
      return err('Password must be at least 8 characters', 422)
    }
    return ok(null, 201)
  }

  if (!validToken) return err('Unauthorized', 401)

  // GET /api/users/me
  if (path === '/api/users/me' && method === 'GET') return ok(MOCK_USER)

  // GET /api/workspaces
  if (path === '/api/workspaces' && method === 'GET') return ok(MOCK_WORKSPACES)

  // Workspace-scoped routes
  if (/^\/api\/workspaces\/[^/]+\/projects$/.test(path) && method === 'GET') return ok(MOCK_PROJECTS)
  if (/^\/api\/workspaces\/[^/]+\/tasks$/.test(path) && method === 'GET') return ok(MOCK_TASKS)
  if (/^\/api\/workspaces\/[^/]+\/tags$/.test(path) && method === 'GET') return ok(MOCK_TAGS)
  if (/^\/api\/workspaces\/[^/]+\/entries$/.test(path) && method === 'GET') return ok(MOCK_TIME_ENTRIES)

  // Timer routes
  const timerMatch = path.match(/^\/api\/workspaces\/[^/]+\/timer(\/start|\/stop)?$/)
  if (timerMatch) {
    const sub = timerMatch[1]

    if (!sub && method === 'GET') {
      return activeTimer ? ok(activeTimer) : ok(null, 204)
    }

    if (sub === '/start' && method === 'POST') {
      if (activeTimer) return err('Timer already running', 409)
      activeTimer = {
        id: 'mock-timer-' + Date.now(),
        description: (body.description as string) || null,
        projectId: (body.projectId as string) || null,
        issueId: (body.taskId as string) || null,
        tagIds: (body.tagIds as string[]) || [],
        timeStart: new Date().toISOString(),
        timeEnd: null,
        timeEntryState: 'RUNNING',
        syncState: 'LOCAL_ONLY'
      }
      return ok(activeTimer)
    }

    if (sub === '/stop' && method === 'POST') {
      if (!activeTimer) return err('No active timer', 404)
      const stopped = { ...activeTimer, timeEnd: new Date().toISOString(), timeEntryState: 'VALIDATED' }
      activeTimer = null
      return ok(stopped)
    }
  }

  return err(`[MOCK] Not implemented: ${method} ${path}`, 501)
}
