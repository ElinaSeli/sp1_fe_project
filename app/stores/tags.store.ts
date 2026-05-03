import { defineStore } from 'pinia'
import type { Tag, CreateTagRequest } from '~/types'
import { tagsService } from '~/services'

/**
 * useTagsStore
 *
 * Manages the list of tags for the active workspace.
 * Calls through the service layer — swap out tagsService for real API when BE is ready.
 */
export const useTagsStore = defineStore('tags', () => {
  const workspacesStore = useWorkspacesStore()

  // --- State ---
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // --- Actions ---

  /**
   * Fetch all tags for the currently active workspace.
   */
  async function fetchTags() {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await tagsService.getAll(wsId)
      if (err) {
        error.value = err
        return
      }
      tags.value = data ?? []
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tags'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new tag and optimistically add it to the list.
   */
  async function createTag(payload: CreateTagRequest): Promise<Tag | null> {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return null

    const { data, error: err } = await tagsService.create(wsId, payload)
    if (err || !data) {
      error.value = err ?? 'Failed to create tag'
      return null
    }
    tags.value.push(data)
    return data
  }

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag
  }
})
