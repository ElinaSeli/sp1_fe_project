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

  // --- Actions ---

  /**
   * Fetch all projects for the currently active workspace.
   */
  async function fetchProjects() {
    const wsId = workspacesStore.activeWorkspaceId
    if (!wsId) return

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await projectsService.getAll(wsId)
      if (err) {
        error.value = err
        return
      }
      if (data?.error) {
        error.value = data.error
      }
      projects.value = data?.data ?? []
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
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
  // No persist — workspace-scoped data must re-fetch on load
})
