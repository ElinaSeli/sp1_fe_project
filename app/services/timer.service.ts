import { useApiClient } from '~/composables/useApiClient'
import type { ServiceResponse, TimeEntry } from '~/types'

export const timerService = {
  /**
   * Start a new timer for the workspace.
   */
  async start(
    workspaceId: string,
    payload: { description: string; projectId: string; taskId?: string; tagIds?: string[] }
  ): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/start`, {
      method: 'POST',
      body: payload
    })
  },

  /**
   * Stop the currently running timer.
   */
  async stop(workspaceId: string): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/stop`, {
      method: 'POST'
    })
  },

  /**
   * Get the active timer for the workspace.
   */
  async getActive(workspaceId: string): Promise<ServiceResponse<TimeEntry | null>> {
    const { request } = useApiClient()
    return request<TimeEntry | null>(`/api/workspaces/${workspaceId}/timer`)
  }
}
