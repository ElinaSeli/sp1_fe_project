// [MOCK] Thin H3 adapter — extracts params from the Nitro event and delegates to the shared handler.
// Works during `pnpm dev` and `pnpm tauri dev` (both have a running Nitro server).
// Delete when real BE is ready (along with shared/mockData.ts and shared/mockApiHandler.ts).

import { handleMockRequest } from '#shared/mockApiHandler'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api-proxy/')) return

  const method = event.method
  const path = event.path.slice('/api-proxy'.length).split('?')[0]!
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
