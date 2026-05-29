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
    return request<Workspace[]>('/api/workspaces')
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

  async delete(id: string): Promise<ServiceResponse<null>> {
    const { request } = useApiClient()
    return request<null>(`/api/workspaces/${id}`, { method: 'DELETE' })
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
