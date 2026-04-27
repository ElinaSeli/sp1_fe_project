import { useApiClient } from '~/composables/useApiClient'
import type { ServiceResponse, TimeEntry } from '~/types'

export const timerService = {
  async start(
    workspaceId: string,
    payload: { description: string; projectId: string | null; taskId?: string; tagIds?: string[] }
  ): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/start`, {
      method: 'POST',
      body: payload
    })
  },

  async stop(workspaceId: string): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/stop`, {
      method: 'POST'
    })
  },

  async getActive(workspaceId: string): Promise<ServiceResponse<TimeEntry | null>> {
    const { request } = useApiClient()
    return request<TimeEntry | null>(`/api/workspaces/${workspaceId}/timer`)
  },

  async getEntries(workspaceId: string): Promise<ServiceResponse<TimeEntry[]>> {
    const { request } = useApiClient()
    return request<TimeEntry[]>(`/api/workspaces/${workspaceId}/entries`)
  }
}
