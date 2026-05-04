import { useApiClient } from '~/composables/useApiClient'
import type { ServiceResponse, TimeEntry, StartTimerRequest } from '~/types'

export const timerService = {
  async start(
    workspaceId: string,
    payload: StartTimerRequest
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
  }
}
