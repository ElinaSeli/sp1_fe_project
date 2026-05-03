import { defineStore } from 'pinia'
import type { Issue, CreateIssueRequest } from '~/types'
import { issuesService } from '~/services'

/**
 * useIssuesStore
 *
 * Manages the list of issues for the active workspace.
 * Calls through the service layer — swap out issuesService for real API when BE is ready.
 */
export const useIssuesStore = defineStore('issues', () => {
  const workspacesStore = useWorkspacesStore()

  // --- State ---
  const issues = ref<Issue[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // --- Actions ---

  /**
   * Fetch all issues for the currently active workspace.
   */
  async function fetchIssues() {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await issuesService.getAll(wsId)
      if (err) {
        error.value = err
        return
      }
      issues.value = data ?? []
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch issues'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new issue and optimistically add it to the list.
   */
  async function createIssue(payload: CreateIssueRequest): Promise<Issue | null> {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return null

    const { data, error: err } = await issuesService.create(wsId, payload)
    if (err || !data) {
      error.value = err ?? 'Failed to create issue'
      return null
    }
    issues.value.push(data)
    return data
  }

  return {
    issues,
    isLoading,
    error,
    fetchIssues,
    createIssue
  }
})
