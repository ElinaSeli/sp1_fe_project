/**
 * composables/useIssueSearch.ts
 *
 * Debounced live search for Redmine issues.
 * Issues are never stored locally — every lookup goes directly to Redmine
 * through the backend proxy endpoint GET /api/workspaces/{id}/issues/search.
 *
 * Usage:
 *   const { query, results, isSearching, clear } = useIssueSearch(workspaceId, projectExternalId)
 *   // bind `query` to the input v-model, `results` to the dropdown options
 */

import { ref, watch, type Ref } from 'vue'
import { issuesService } from '~/services'
import type { IssueSearchResult } from '~/types'

export function useIssueSearch(
  workspaceId: Ref<string | null | undefined>,
  projectExternalId: Ref<string | null | undefined>
) {
  const query = ref('')
  const results = ref<IssueSearchResult[]>([])
  const isSearching = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function runSearch(q: string) {
    const wsId = workspaceId.value
    if (!wsId || q.trim().length < 1) {
      results.value = []
      return
    }

    isSearching.value = true
    try {
      const { data } = await issuesService.search(wsId, q.trim(), projectExternalId.value)
      const serverResults = data ?? []

      // Look up in local issuesStore to find matching local issues by name or externalId
      const issuesStore = useIssuesStore()
      const projectsStore = useProjectsStore()
      const localQuery = q.toLowerCase().trim()

      const matchingLocal = (issuesStore.issues || []).filter((issue) => {
        if (!issue.externalId) return false
        return (
          issue.name.toLowerCase().includes(localQuery) ||
          String(issue.externalId).toLowerCase().includes(localQuery)
        )
      })

      const mappedLocal: IssueSearchResult[] = matchingLocal.map((issue) => {
        const proj = (projectsStore.projects || []).find((p) => p.id === issue.projectId)
        return {
          external_id: Number(issue.externalId),
          issue_title: issue.name,
          project_name: proj?.name || '',
          project_external_id: proj?.externalId || ''
        }
      })

      // Combine server results and local database matches, removing duplicates by external_id
      const combined = [...serverResults, ...mappedLocal]
      const uniqueResults: IssueSearchResult[] = []
      const seenIds = new Set<number>()
      for (const item of combined) {
        if (!seenIds.has(item.external_id)) {
          seenIds.add(item.external_id)
          uniqueResults.push(item)
        }
      }
      results.value = uniqueResults
    } catch {
      results.value = []
    } finally {
      isSearching.value = false
    }
  }

  watch(query, (q) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!q.trim()) {
      results.value = []
      return
    }
    debounceTimer = setTimeout(() => runSearch(q), 300)
  })

  // Clear results when project changes — old results are irrelevant
  watch(projectExternalId, () => {
    query.value = ''
    results.value = []
  })

  function clear() {
    query.value = ''
    results.value = []
    if (debounceTimer) clearTimeout(debounceTimer)
  }

  return { query, results, isSearching, clear }
}
