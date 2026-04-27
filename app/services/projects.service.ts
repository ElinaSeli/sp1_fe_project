/**
 * services/projects.service.ts
 *
 * Project management within a workspace.
 * Communicates with the Micronaut backend at /api/workspaces/:workspaceId/projects/*.
 */

import type { Project, ServiceResponse } from '~/types'
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
    name: string,
    color?: string
  ): Promise<ServiceResponse<Project>> {
    const { request } = useApiClient()
    return request<Project>(`/api/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: { name, color }
    })
  },

  /**
   * Update an existing project's name or color.
   */
  async update(
    workspaceId: string,
    projectId: string,
    patch: Partial<Pick<Project, 'name' | 'color'>>
  ): Promise<ServiceResponse<Project>> {
    const { request } = useApiClient()
    return request<Project>(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
      method: 'PATCH',
      body: patch
    })
  },

  /**
   * Delete a project from a workspace.
   */
  async remove(workspaceId: string, projectId: string): Promise<ServiceResponse<null>> {
    const { request } = useApiClient()
    return request<null>(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
      method: 'DELETE'
    })
  }
}
