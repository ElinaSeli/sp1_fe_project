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
    return request<Tag>(`/api/workspaces/${workspaceId}/tags`, {
      method: 'POST',
      body: payload
    })
  }
}
