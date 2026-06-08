import { defineStore } from 'pinia'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '~/types'
import { projectsService } from '~/services'

/**
 * useProjectsStore
 *
 * Manages the list of projects for the active workspace.
 * Calls through the service layer — swap out projectsService for real API when BE is ready.
 */
export const useProjectsStore = defineStore('projects', () => {
  const workspacesStore = useWorkspacesStore()

  // --- State ---
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  /**
   * Set when GET /projects returns 504 (Redmine unreachable).
   * The backend still returns cached data in that case, so we surface this
   * as a non-blocking warning rather than a hard error.
   */
  const redmineWarning = ref<string | null>(null)

  // --- Actions ---

  /**
   * Fetch all projects for the currently active workspace.
   * Triggers a pass-through Redmine sync on the backend.
   * If Redmine is unreachable (HTTP 504), cached data is returned and
   * redmineWarning is set so the UI can show an alert.
   */
  async function fetchProjects() {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return

    isLoading.value = true
    error.value = null
    try {
      const response = await projectsService.getAll(wsId)

      if (response.statusCode === 504) {
        // Redmine is unreachable — backend still returns cached data.
        redmineWarning.value =
          'Redmine is unreachable — showing cached projects. Some data may be outdated.'
        if (response.data?.data) {
          projects.value = response.data.data
        }
        return
      }

      redmineWarning.value = null

      if (response.error) {
        error.value = response.error
        return
      }
      if (response.data?.error) {
        error.value = response.data.error
      }
      projects.value = response.data?.data ?? []
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch projects'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new local project and add it to the list.
   */
  async function createProject(payload: CreateProjectRequest): Promise<Project | null> {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return null

    const { data, error: err } = await projectsService.create(wsId, payload)
    if (err || !data) {
      error.value = err ?? 'Failed to create project'
      return null
    }
    projects.value.push(data)
    return data
  }

  /**
   * Update a local project (only for non-imported projects).
   */
  async function updateProject(
    projectId: string,
    payload: UpdateProjectRequest
  ): Promise<Project | null> {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return null

    const { data, error: err } = await projectsService.update(wsId, projectId, payload)
    if (err || !data) {
      error.value = err ?? 'Failed to update project'
      return null
    }
    const idx = projects.value.findIndex((p) => p.id === projectId)
    if (idx !== -1) projects.value[idx] = data
    return data
  }

  /**
   * Delete a local project (only for non-imported projects).
   */
  async function deleteProject(projectId: string): Promise<boolean> {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return false

    const { error: err } = await projectsService.remove(wsId, projectId)
    if (err) {
      error.value = err
      return false
    }
    projects.value = projects.value.filter((p) => p.id !== projectId)
    return true
  }

  return {
    projects,
    isLoading,
    error,
    redmineWarning,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
  // No persist — workspace-scoped data must re-fetch on load
})
