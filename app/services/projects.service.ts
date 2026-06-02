/**
 * services/projects.service.ts
 *
 * Project management within a workspace.
 * Communicates with the Micronaut backend at /api/workspaces/:workspaceId/projects/*.
 */

import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
  ServiceResponse
} from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const projectsService = {
  /**
   * Fetch all projects for a given workspace.
   */
  async getAll(workspaceId: string): Promise<ServiceResponse<ProjectListResponse>> {
    const { request } = useApiClient()
    return request<ProjectListResponse>(`/api/workspaces/${workspaceId}/projects`)
  },

  /**
   * Create a new local project inside a workspace.
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
  },

  /**
   * Update an existing local project (only allowed for non-imported projects).
   */
  async update(
    workspaceId: string,
    projectId: string,
    payload: UpdateProjectRequest
  ): Promise<ServiceResponse<Project>> {
    const { request } = useApiClient()
    return request<Project>(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
      method: 'PATCH',
      body: payload
    })
  },

  /**
   * Delete a local project (only allowed for non-imported projects).
   */
  async remove(workspaceId: string, projectId: string): Promise<ServiceResponse<null>> {
    const { request } = useApiClient()
    return request<null>(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
      method: 'DELETE'
    })
  }
}
