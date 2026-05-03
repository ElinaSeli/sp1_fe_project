// [MOCK] Thin H3 adapter — extracts params from the Nitro event and delegates to the shared handler.
// Works during `pnpm dev` and `pnpm tauri dev` (both have a running Nitro server).
// Delete when real BE is ready (along with shared/mockData.ts and shared/mockApiHandler.ts).
//
// Login and register are proxied to the real backend (NUXT_PUBLIC_API_BASE_URL).

import { handleMockRequest } from '#shared/mockApiHandler'

// Paths forwarded to the real backend instead of the mock handler.
const REAL_PATHS = new Set(['/login', '/api/users/register', '/api/users/me'])

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api-proxy/')) return

  const method = event.method
  const path = event.path.slice('/api-proxy'.length).split('?')[0]!

  // Forward login and register to real backend.
  if (REAL_PATHS.has(path)) {
    const {
      public: { apiBaseUrl }
    } = useRuntimeConfig()
    if (!apiBaseUrl) {
      setResponseStatus(event, 503)
      return { message: 'NUXT_PUBLIC_API_BASE_URL is not set — check your .env' }
    }
    const rawBody =
      method !== 'GET' && method !== 'DELETE'
        ? ((await readRawBody(event, 'utf8')) ?? undefined)
        : undefined
    const headers: Record<string, string> = { accept: 'application/json' }
    const ct = getHeader(event, 'content-type')
    if (ct) headers['content-type'] = ct
    const auth = getHeader(event, 'authorization')
    if (auth) headers['authorization'] = auth

    const result = await $fetch.raw(`${apiBaseUrl}${path}`, {
      method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      headers,
      body: rawBody,
      ignoreResponseError: true
    })
    setResponseStatus(event, result.status)
    return result._data
  }

  let body: Record<string, unknown> = {}
  if (method !== 'GET' && method !== 'DELETE') {
    try {
      body = await readBody<Record<string, unknown>>(event)
    } catch {
      // readBody can fail on WebKit if Content-Type is missing; fall back to raw text parse
      try {
        const raw = await readRawBody(event, 'utf8')
        if (raw) body = JSON.parse(raw) as Record<string, unknown>
      } catch {
        // ignore — body stays {}
      }
    }
  }
  const authToken = getHeader(event, 'authorization') ?? null

  const { status, data } = handleMockRequest(path, method, body, authToken)
  setResponseStatus(event, status)
  return data
})
