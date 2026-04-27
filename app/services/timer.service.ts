/**
 * services/timer.service.ts
 *
 * Real-time timer control (Start/Stop).
 * Communicates with the Micronaut backend at /api/workspaces/{workspaceId}/timer/*.
 */

import type { TimeEntry, StartTimerRequest, ServiceResponse } from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const timerService = {
  /**
   * Get the currently running timer for a workspace.
   * Resolves with 204 (null data) if no timer is running.
   */
  async getCurrent(workspaceId: string): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/timer`)
  },

  /**
   * Start a new timer for the given project/description.
   */
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

  /**
   * Stop the currently running timer in the workspace.
   */
  async stop(workspaceId: string): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/stop`, {
      method: 'POST'
    })
  }
}
