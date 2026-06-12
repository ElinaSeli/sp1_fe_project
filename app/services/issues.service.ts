/**
 * services/issues.service.ts
 *
 * Issue management for the workspace.
 * NOTE: Issues are NOT stored locally. They are searched live from Redmine
 * via the /issues/search endpoint. The getAll() method is kept for backward
 * compatibility but will typically return an empty list.
 */

import type { Issue, IssueSearchResult, CreateIssueRequest, ServiceResponse } from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const issuesService = {
  /**
   * Fetch locally stored issues (typically empty — issues are not synced to DB).
   * @deprecated Use search() for live Redmine issue lookup.
   */
  async getAll(workspaceId: string): Promise<ServiceResponse<Issue[]>> {
    const { request } = useApiClient()
    return request<Issue[]>(`/api/workspaces/${workspaceId}/issues`)
  },

  /**
   * Search for issues live from Redmine.
   * Results are NOT saved to the local DB.
   *
   * @param workspaceId - Our workspace UUID
   * @param q - Search query (min 1 character)
   * @param projectExternalId - Redmine project ID (project.externalId) to scope the search
   * @param limit - Max results (default 20)
   * @param offset - Pagination offset (default 0)
   */
  async search(
    workspaceId: string,
    q: string,
    projectExternalId?: string | null,
    limit = 20,
    offset = 0
  ): Promise<ServiceResponse<IssueSearchResult[]>> {
    const { request } = useApiClient()
    const params = new URLSearchParams({ q, limit: String(limit), offset: String(offset) })
    if (projectExternalId) params.set('projectId', projectExternalId)
    return request<IssueSearchResult[]>(
      `/api/workspaces/${workspaceId}/issues/search?${params.toString()}`
    )
  },

  /**
   * Create a new local issue inside a workspace.
   */
  async create(workspaceId: string, payload: CreateIssueRequest): Promise<ServiceResponse<Issue>> {
    const { request } = useApiClient()
    return request<Issue>(`/api/workspaces/${workspaceId}/issues`, {
      method: 'POST',
      body: payload
    })
  }
}
