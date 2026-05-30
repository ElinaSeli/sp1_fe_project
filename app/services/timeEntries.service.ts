/**
 * services/timeEntries.service.ts
 *
 * CRUD operations for time entries, scoped under a workspace.
 * Communicates with the Micronaut backend at /api/workspaces/{workspaceId}/time-entries/*.
 */

import type {
  TimeEntry,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  ServiceResponse
} from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const timeEntriesService = {
  /**
   * Fetch all time entries for a specific workspace.
   * Supports optional pagination and date filtering.
   */
  async getAll(
    workspaceId: string,
    params?: { startDate?: string; endDate?: string; page?: number; size?: number }
  ): Promise<ServiceResponse<TimeEntry[]>> {
    const { request } = useApiClient()
    return request<TimeEntry[]>(`/api/workspaces/${workspaceId}/time-entries`, {
      params
    })
  },

  /**
   * Fetch a single time entry by ID.
   */
  async getById(workspaceId: string, id: string): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/time-entries/${id}`)
  },

  /**
   * Create a new manual time entry.
   */
  async create(
    workspaceId: string,
    payload: CreateTimeEntryRequest
  ): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/time-entries`, {
      method: 'POST',
      body: payload
    })
  },

  /**
   * Update an existing time entry (PUT).
   */
  async update(
    workspaceId: string,
    id: string,
    payload: UpdateTimeEntryRequest
  ): Promise<ServiceResponse<TimeEntry>> {
    const { request } = useApiClient()
    return request<TimeEntry>(`/api/workspaces/${workspaceId}/time-entries/${id}`, {
      method: 'PUT',
      body: payload
    })
  },

  /**
   * Soft-delete a time entry.
   */
  async remove(workspaceId: string, id: string): Promise<ServiceResponse<null>> {
    const { request } = useApiClient()
    return request<null>(`/api/workspaces/${workspaceId}/time-entries/${id}`, {
      method: 'DELETE'
    })
  }
}
