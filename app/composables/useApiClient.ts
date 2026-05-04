import type { ServiceResponse } from '~/types'

type FetchOptions = Parameters<typeof $fetch>[1]

export function useApiClient() {
  // Use the local Vite proxy path to avoid CORS.
  // The proxy forwards /api-proxy/* → backend, stripping the prefix.
  const baseURL = '/api-proxy'

  async function request<T>(path: string, options: FetchOptions = {}): Promise<ServiceResponse<T>> {
    const authStore = useAuthStore()

    const tokenValue = toValue(authStore.token)
    const finalToken = typeof tokenValue === 'string' ? tokenValue : null
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path

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
