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
    const res = await request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/start`, {
      method: 'POST',
      body: payload
    })

    if (res.error) {
      console.warn('Timer start API failed, falling back to mock data:', res.error)
      return {
        data: {
          id: 'mock-timer-entry-1',
          description: payload.description || null,
          projectId: payload.projectId || null,
          issueId: payload.taskId || null,
          tagIds: payload.tagIds || [],
          timeStart: new Date().toISOString(),
          timeEnd: null,
          timeEntryState: 'RUNNING',
          syncState: 'LOCAL_ONLY'
        },
        error: null
      }
    }
    return res
  },

  /**
   * Stop the currently running timer.
   */
  async stop(workspaceId: string): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    const res = await request<TimeEntry>(`/api/workspaces/${workspaceId}/timer/stop`, {
      method: 'POST'
    })

    if (res.error) {
      console.warn('Timer stop API failed, falling back to mock data:', res.error)
      return {
        data: {
          id: 'mock-timer-entry-1',
          description: 'Mock entry',
          projectId: 'mock-project',
          issueId: null,
          tagIds: [],
          timeStart: new Date(Date.now() - 3600000).toISOString(),
          timeEnd: new Date().toISOString(),
          timeEntryState: 'VALIDATED',
          syncState: 'LOCAL_ONLY'
        },
        error: null
      }
    }
    return res
  },

  /**
   * Get the active timer for the workspace.
   */
  async getActive(workspaceId: string): Promise<ServiceResponse<TimeEntry | null>> {
    const { request } = useApiClient()
    const res = await request<TimeEntry | null>(`/api/workspaces/${workspaceId}/timer`)

    if (res.error) {
      console.warn('Fetch active timer API failed, falling back to mock data:', res.error)
      return { data: null, error: null }
    }
    return res
  }
}
