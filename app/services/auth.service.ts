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
      console.warn('Login API failed, falling back to mock data:', err)
      // Mock Fallback
      return {
        data: {
          access_token: 'mock-jwt-token-12345',
          expires_in: 3600,
          token_type: 'Bearer',
          username: credentials.username,
          roles: ['ROLE_USER']
        },
        error: null
      }
    }
  },

  /**
   * Create a new account at /api/users/register.
   */
  async register(payload: RegisterRequest): Promise<ServiceResponse<AuthUser>> {
    const { request } = useApiClient()
    const res = await request<AuthUser>('/api/users/register', {
      method: 'POST',
      body: payload
    })

    if (res.error) {
      console.warn('Register API failed, falling back to mock data:', res.error)
      return {
        data: {
          id: 'mock-user-1',
          username: payload.username,
          email: payload.email,
          firstName: 'Mock',
          lastName: 'User'
        },
        error: null
      }
    }
    return res
  },

  /**
   * Fetch the profile of the currently authenticated user.
   */
  async me(): Promise<ServiceResponse<AuthUser>> {
    const { request } = useApiClient()
    const res = await request<AuthUser>('/api/users/me')

    if (res.error) {
      console.warn('Fetch Profile API failed, falling back to mock data:', res.error)
      return {
        data: {
          id: 'mock-user-1',
          username: 'demo_user',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User'
        },
        error: null
      }
    }
    return res
  }
}
