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
    // Read from the auth store's reactive ref — more reliable than re-reading the
    // cookie directly, which can lag on non-standard origins (tauri://, file://).
    const token = useAuthStore().token

    // Ensure path doesn't have a leading slash if we're joining with baseURL
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path

    try {
      const data = await $fetch<T>(normalizedPath, {
        baseURL,
        ...options,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options?.headers ?? {})
        }
      })
      return { data, error: null }
    } catch (err: unknown) {
      // Nuxt's $fetch throws a FetchError with a .data property when the server
      // returns a non-2xx status code.
      const message =
        (err as { data?: { message?: string }; message?: string })?.data?.message ??
        (err as { message?: string })?.message ??
        'An unexpected error occurred'
      return { data: null, error: message }
    }
  }

  return { request, baseURL }
}
