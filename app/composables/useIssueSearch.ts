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

      interface RawIssueSearchResponse {
        external_id?: number | string
        externalId?: number | string
        issue_title?: string
        issueTitle?: string
        project_id?: string | null
        projectId?: string | null
        project_name?: string
        projectName?: string
        project_external_id?: string | null
        projectExternalId?: string | null
      }

      // Normalize server results to standard snake_case IssueSearchResult interface
      const normalizedServerResults: IssueSearchResult[] = (
        serverResults as unknown as RawIssueSearchResponse[]
      ).map((r) => {
        return {
          external_id: r.external_id !== undefined ? Number(r.external_id) : Number(r.externalId),
          issue_title: r.issue_title !== undefined ? r.issue_title : (r.issueTitle ?? ''),
          project_id: r.project_id !== undefined ? r.project_id : (r.projectId ?? null),
          project_name: r.project_name !== undefined ? r.project_name : (r.projectName ?? ''),
          project_external_id:
            r.project_external_id !== undefined
              ? r.project_external_id
              : (r.projectExternalId ?? null)
        }
      })

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
          project_id: proj?.id ?? null,
          project_name: proj?.name || '',
          project_external_id: proj?.externalId ?? null
        }
      })

      // Combine server results and local database matches, removing duplicates by external_id
      const combined = [...normalizedServerResults, ...mappedLocal]
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
