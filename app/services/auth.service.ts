import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ServiceResponse,
  AuthUser
} from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const authService = {
  async login(credentials: LoginRequest): Promise<ServiceResponse<AuthResponse>> {
    const { request } = useApiClient()
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: credentials
    })
  },

  async register(payload: RegisterRequest): Promise<ServiceResponse<AuthUser>> {
    const { request } = useApiClient()
    return request<AuthUser>('/api/users/register', {
      method: 'POST',
      body: payload
    })
  },

  async me(): Promise<ServiceResponse<AuthUser>> {
    const { request } = useApiClient()
    return request<AuthUser>('/api/users/me')
  }
}
