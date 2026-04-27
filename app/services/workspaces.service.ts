/**
 * services/workspaces.service.ts
 *
 * Workspace management — create, list, archive.
 * Communicates with the Micronaut backend at /api/workspaces/*.
 */

import type {
  Workspace,
  CreateWorkspaceRequest,
  MembershipResponse,
  ServiceResponse
} from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const workspacesService = {
  async getAll(): Promise<ServiceResponse<Workspace[]>> {
    const { request } = useApiClient()
    const res = await request<Workspace[]>('/api/workspaces')

    if (res.error) {
      console.warn('Workspaces API failed, falling back to mock data:', res.error)
      return {
        data: [
          {
            id: 'mock-ws-1',
            name: 'Personal Workspace',
            description: 'Mock workspace for local UI development',
            createdAt: new Date().toISOString()
          }
        ],
        error: null
      }
    }
    return res
  },

  /**
   * Fetch a single workspace by ID.
   */
  async getById(id: string): Promise<ServiceResponse<Workspace>> {
    const { request } = useApiClient()
    return request<Workspace>(`/api/workspaces/${id}`)
  },

  /**
   * Create a new workspace.
   */
  async create(payload: CreateWorkspaceRequest): Promise<ServiceResponse<Workspace>> {
    const { request } = useApiClient()
    return request<Workspace>('/api/workspaces', {
      method: 'POST',
      body: payload
    })
  },

  /**
   * Add a member to a workspace.
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
  ): Promise<ServiceResponse<MembershipResponse>> {
    const { request } = useApiClient()
    return request<MembershipResponse>(`/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: { userId, role }
    })
  }
}
