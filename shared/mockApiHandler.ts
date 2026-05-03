// [MOCK] Pure routing handler — no framework deps, callable from both Nitro and browser.
// Delete when real BE is ready.

import {
  MOCK_TOKEN,
  MOCK_CREDENTIALS,
  MOCK_USER,
  MOCK_AUTH_RESPONSE,
  MOCK_WORKSPACES,
  MOCK_TIME_ENTRIES,
  mockStore
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

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function handleMockRequest(
  path: string,
  method: string,
  body: Record<string, unknown>,
  authToken: string | null
): MockResponse {
  const token = authToken?.startsWith('Bearer ') ? authToken.slice(7).trim() : null
  const validToken = token === MOCK_TOKEN

  // POST /login
  if (path === '/login' && method === 'POST') {
    if (
      body.username !== MOCK_CREDENTIALS.username ||
      body.password !== MOCK_CREDENTIALS.password
    ) {
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

  if (!validToken) {
    return err(
      `Unauthorized. Received token: "${token ?? 'MISSING'}" (Expected: "${MOCK_TOKEN}")`,
      401
    )
  }

  // GET /api/users/me
  if (path === '/api/users/me' && method === 'GET') return ok(MOCK_USER)

  // GET /api/workspaces
  if (path === '/api/workspaces' && method === 'GET') return ok(MOCK_WORKSPACES)

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------
  const projectsMatch = path.match(/^\/api\/workspaces\/([^/]+)\/projects$/)
  if (projectsMatch) {
    const workspaceId = projectsMatch[1]!
    if (method === 'GET') {
      return ok(mockStore.projects.filter((p) => p.workspaceId === workspaceId || true))
    }
    if (method === 'POST') {
      if (!body.name || typeof body.name !== 'string') return err('name is required', 422)
      const project = {
        id: randomUUID(),
        workspaceId,
        name: body.name,
        color: (body.color as string | null) ?? null,
        isImported: false,
        externalId: null
      }
      mockStore.projects.push(project)
      return ok(project, 201)
    }
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------
  const tagsMatch = path.match(/^\/api\/workspaces\/([^/]+)\/tags$/)
  if (tagsMatch) {
    const workspaceId = tagsMatch[1]!
    if (method === 'GET') {
      return ok(mockStore.tags.filter((t) => t.workspaceId === workspaceId || true))
    }
    if (method === 'POST') {
      if (!body.name || typeof body.name !== 'string') return err('name is required', 422)
      const tag = {
        id: randomUUID(),
        workspaceId,
        name: body.name,
        color: (body.color as string | null) ?? null,
        isImported: false,
        externalId: null
      }
      mockStore.tags.push(tag)
      return ok(tag, 201)
    }
  }

  // ---------------------------------------------------------------------------
  // Issues / Tasks
  // ---------------------------------------------------------------------------
  const issuesMatch = path.match(/^\/api\/workspaces\/([^/]+)\/(issues|tasks)$/)
  if (issuesMatch) {
    const workspaceId = issuesMatch[1]!
    if (method === 'GET') {
      return ok(mockStore.issues.filter((i) => i.workspaceId === workspaceId || true))
    }
    if (method === 'POST') {
      if (!body.name || typeof body.name !== 'string') return err('name is required', 422)
      // Accept either projectId or the old taskId if applicable
      const projectId = (body.projectId as string) || (body.taskId as string)
      if (!projectId) return err('projectId is required', 422)
      const issue = {
        id: randomUUID(),
        workspaceId,
        projectId,
        name: body.name,
        isImported: false,
        externalId: null
      }
      mockStore.issues.push(issue)
      return ok(issue, 201)
    }
  }

  // Time entries (legacy GET)
  if (/^\/api\/workspaces\/[^/]+\/entries$/.test(path) && method === 'GET') {
    return ok(MOCK_TIME_ENTRIES)
  }

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
      const stopped = {
        ...activeTimer,
        timeEnd: new Date().toISOString(),
        timeEntryState: 'VALIDATED'
      }
      activeTimer = null
      return ok(stopped)
    }
  }

  return err(`[MOCK] Not implemented: ${method} ${path}`, 501)
}
