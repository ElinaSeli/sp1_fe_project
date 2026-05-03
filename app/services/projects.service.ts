/**
 * services/projects.service.ts
 *
 * Project management within a workspace.
 * Communicates with the Micronaut backend at /api/workspaces/:workspaceId/projects/*.
 */

import type { Project, CreateProjectRequest, ServiceResponse } from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const projectsService = {
  /**
   * Fetch all projects for a given workspace.
   */
  async getAll(workspaceId: string): Promise<ServiceResponse<Project[]>> {
    const { request } = useApiClient()
    return request<Project[]>(`/api/workspaces/${workspaceId}/projects`)
  },

  /**
   * Create a new project inside a workspace.
   */
  async create(
    workspaceId: string,
    payload: CreateProjectRequest
  ): Promise<ServiceResponse<Project>> {
    const { request } = useApiClient()
    return request<Project>(`/api/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: payload
    })
  }
}
