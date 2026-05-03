/**
 * composables/useApiClient.ts
 *
 * Central API client built on top of Nuxt's $fetch / useFetch.
 */

import type { ServiceResponse } from '~/types'

// Re-export the fetch options type so service files can extend it cleanly.
type FetchOptions = Parameters<typeof $fetch>[1]

export function useApiClient() {
  // Use the local Vite proxy path to avoid CORS.
  // The proxy forwards /api-proxy/* → backend, stripping the prefix.
  const baseURL = '/api-proxy'

  /**
   * Core request helper used by all service methods.
   */
  async function request<T>(path: string, options: FetchOptions = {}): Promise<ServiceResponse<T>> {
    const authStore = useAuthStore()

    // Explicitly unref the token and ensure it's a string.
    // useCookie in Nuxt 4 can return a Ref, and Pinia's auto-unwrapping
    // sometimes behaves differently depending on how the store was created.
    const tokenValue = toValue(authStore.token)

    // Ensure we have a string token
    const finalToken = typeof tokenValue === 'string' ? tokenValue : null

    // Ensure path doesn't have a leading slash if we're joining with baseURL
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
