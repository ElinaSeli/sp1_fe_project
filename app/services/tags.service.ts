/**
 * services/tags.service.ts
 *
 * Tag management within a workspace.
 * Communicates with the Micronaut backend at /api/workspaces/:workspaceId/tags/*.
 */

import type { Tag, CreateTagRequest, ServiceResponse } from '~/types'
import { useApiClient } from '~/composables/useApiClient'

export const tagsService = {
  /**
   * Fetch all tags for a given workspace.
   */
  async getAll(workspaceId: string): Promise<ServiceResponse<Tag[]>> {
    const { request } = useApiClient()
    return request<Tag[]>(`/api/workspaces/${workspaceId}/tags`)
  },

  /**
   * Create a new tag inside a workspace.
   */
  async create(workspaceId: string, payload: CreateTagRequest): Promise<ServiceResponse<Tag>> {
    const { request } = useApiClient()
    return request<Tag>(`/api/workspaces/${workspaceId}/projects/${payload.projectId}/tags`, {
      method: 'POST',
      body: payload
    })
  },

  /**
   * Delete a tag from a project.
   */
  async delete(
    workspaceId: string,
    projectId: string,
    tagId: string
  ): Promise<ServiceResponse<null>> {
    const { request } = useApiClient()
    return request<null>(`/api/workspaces/${workspaceId}/projects/${projectId}/tags/${tagId}`, {
      method: 'DELETE'
    })
  }
}
