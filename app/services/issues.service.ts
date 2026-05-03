/**
 * services/issues.service.ts
 *
 * Issue (task) management within a workspace.
 * Communicates with the Micronaut backend at /api/workspaces/:workspaceId/issues/*.
 */

import type { Issue, CreateIssueRequest, ServiceResponse } from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const issuesService = {
  /**
   * Fetch all issues for a given workspace.
   */
  async getAll(workspaceId: string): Promise<ServiceResponse<Issue[]>> {
    const { request } = useApiClient()
    return request<Issue[]>(`/api/workspaces/${workspaceId}/issues`)
  },

  /**
   * Create a new issue inside a workspace.
   */
  async create(workspaceId: string, payload: CreateIssueRequest): Promise<ServiceResponse<Issue>> {
    const { request } = useApiClient()
    return request<Issue>(`/api/workspaces/${workspaceId}/issues`, {
      method: 'POST',
      body: payload
    })
  }
}
