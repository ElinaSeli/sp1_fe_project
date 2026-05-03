// [MOCK] Thin fetch adapter for Tauri production builds.
// `pnpm tauri dev` has a running Nitro server, so import.meta.dev guards against double-handling.
// Delete when real BE is ready (along with shared/mockData.ts and shared/mockApiHandler.ts).

import { handleMockRequest } from '#shared/mockApiHandler'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Only intercept in Tauri production builds with no real BE configured.
  // import.meta.dev is false in `pnpm build` / `pnpm tauri build` outputs.
  if (import.meta.dev || !('__TAURI_INTERNALS__' in window) || config.public.apiBaseUrl) return

  const originalFetch = globalThis.fetch

  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url

    const proxyIndex = url.indexOf('/api-proxy/')
    if (proxyIndex === -1) return originalFetch(input, init)

    const path = url.slice(proxyIndex + '/api-proxy'.length).split('?')[0]!
    const method = (init?.method ?? 'GET').toUpperCase()

    let body: Record<string, unknown> = {}
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string) as Record<string, unknown>
      } catch {
        // ignore non-JSON bodies
      }
    }

    const headers = new Headers(init?.headers)
    const { status, data } = handleMockRequest(path, method, body, headers.get('authorization'))

    return new Response(data === null ? null : JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
