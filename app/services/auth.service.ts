/**
 * services/auth.service.ts
 *
 * Authentication service — login, register, logout.
 * Communicates with the Micronaut backend.
 */

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ServiceResponse,
  AuthUser
} from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const authService = {
  /** Authenticate with username + password. */
  async login(credentials: LoginRequest): Promise<ServiceResponse<AuthResponse>> {
    try {
      const data = await $fetch<AuthResponse>('/api-proxy/login', {
        method: 'POST',
        body: credentials,
        headers: { Accept: 'application/json' }
      })
      return { data, error: null }
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string }; message?: string })?.data?.message ??
        (err as { message?: string })?.message ??
        'An unexpected error occurred'
      return { data: null, error: message }
    }
  },

  /**
   * Create a new account at /api/users/register.
   */
  async register(payload: RegisterRequest): Promise<ServiceResponse<AuthUser>> {
    const { request } = useApiClient()
    return request<AuthUser>('/api/users/register', {
      method: 'POST',
      body: payload
    })
  },

  /**
   * Fetch the profile of the currently authenticated user.
   */
  async me(): Promise<ServiceResponse<AuthUser>> {
    const { request } = useApiClient()
    return request<AuthUser>('/api/users/me')
  }
}
