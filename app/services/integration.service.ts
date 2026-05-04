import type {
  Integration,
  IntegrationRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  ServiceResponse
} from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const integrationService = {
  async get(workspaceId: string): Promise<ServiceResponse<Integration>> {
    const { request } = useApiClient()
    return request<Integration>(`/api/workspaces/${workspaceId}/integration`)
  },

  async create(
    workspaceId: string,
    payload: IntegrationRequest
  ): Promise<ServiceResponse<Integration>> {
    const { request } = useApiClient()
    return request<Integration>(`/api/workspaces/${workspaceId}/integration`, {
      method: 'POST',
      body: payload
    })
  },

  async update(
    workspaceId: string,
    id: string,
    payload: IntegrationRequest
  ): Promise<ServiceResponse<Integration>> {
    const { request } = useApiClient()
    return request<Integration>(`/api/workspaces/${workspaceId}/integration/${id}`, {
      method: 'PUT',
      body: payload
    })
  },

  async delete(workspaceId: string, id: string): Promise<ServiceResponse<null>> {
    const { request } = useApiClient()
    return request<null>(`/api/workspaces/${workspaceId}/integration/${id}`, {
      method: 'DELETE'
    })
  },

  async testConnection(
    workspaceId: string,
    payload: TestConnectionRequest
  ): Promise<ServiceResponse<TestConnectionResponse>> {
    const { request } = useApiClient()
    return request<TestConnectionResponse>(`/api/workspaces/${workspaceId}/integration/test`, {
      method: 'POST',
      body: payload
    })
  }
}
