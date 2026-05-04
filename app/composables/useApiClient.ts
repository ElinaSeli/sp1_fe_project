import type { ServiceResponse } from '~/types'

type FetchOptions = Parameters<typeof $fetch>[1]

export function useApiClient() {
  const {
    public: { apiBaseUrl }
  } = useRuntimeConfig()

  // Force relative path if baseURL points to the backend directly (to use Nuxt proxy)
  let baseURL = apiBaseUrl as string
  if (baseURL.includes('localhost:8080')) {
    baseURL = '/'
  }

  async function request<T>(path: string, options: FetchOptions = {}): Promise<ServiceResponse<T>> {
    const authStore = useAuthStore()

    const tokenValue = toValue(authStore.token)
    const finalToken = typeof tokenValue === 'string' ? tokenValue : null

    // If the path already includes /api and baseURL is /, we're good.
    // If baseURL is /api and path includes /api, we should strip it from the path.
    let normalizedPath = path.startsWith('/') ? path.substring(1) : path
    if (baseURL.endsWith('/api') && normalizedPath.startsWith('api/')) {
      normalizedPath = normalizedPath.substring(4)
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json'
      }

      if (finalToken) {
        headers['Authorization'] = `Bearer ${finalToken}`
      }

      // Merge user-provided headers
      if (options?.headers) {
        const userHeaders = options.headers as Record<string, string>
        for (const key in userHeaders) {
          const val = userHeaders[key]
          if (val !== undefined) {
            headers[key] = val
          }
        }
      }

      console.log(`[API Request] ${options.method || 'GET'} ${normalizedPath}`, {
        baseURL,
        headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [REDACTED]' : 'NONE' }
      })

      const data = await $fetch<T>(normalizedPath, {
        baseURL,
        retry: 0,
        ...options,
        headers
      })
      return { data, error: null }
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string }; message?: string })?.data?.message ??
        (err as { message?: string })?.message ??
        'An unexpected error occurred'
      return { data: null, error: message }
    }
  }

  return { request, baseURL }
}
