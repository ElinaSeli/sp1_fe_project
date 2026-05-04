import { defineStore } from 'pinia'
import type { Workspace, CreateWorkspaceRequest } from '~/types'
import { workspacesService } from '~/services'

/**
 * useWorkspacesStore
 *
 * Manages the list of available workspaces and the currently active selection.
 */
export const useWorkspacesStore = defineStore(
  'workspaces',
  () => {
    // --- State ---
    const workspaces = ref<Workspace[]>([])
    const activeWorkspaceId = ref<string | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // --- Getters ---
    const activeWorkspace = computed(
      () => workspaces.value.find((w) => w.id === activeWorkspaceId.value) || null
    )

    // --- Actions ---
    function setWorkspaces(list: Workspace[]) {
      workspaces.value = list
      // Auto-select first workspace if none is selected or the selected one no longer exists
      const stillExists = list.some((w) => w.id === activeWorkspaceId.value)
      if (list.length > 0 && !stillExists) {
        activeWorkspaceId.value = list[0]!.id
      }
    }

    function setActiveWorkspace(id: string) {
      activeWorkspaceId.value = id
    }

    async function fetchWorkspaces() {
      isLoading.value = true
      error.value = null
      try {
        const response = await workspacesService.getAll()
        if (response.error) {
          error.value = response.error
        } else if (response.data) {
          setWorkspaces(response.data)
        }
        return response
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to fetch workspaces'
      } finally {
        isLoading.value = false
      }
    }

    async function createWorkspace(payload: CreateWorkspaceRequest): Promise<Workspace | null> {
      isLoading.value = true
      error.value = null
      try {
        const response = await workspacesService.create(payload)
        if (response.error || !response.data) {
          error.value = response.error ?? 'Failed to create workspace'
          return null
        }
        workspaces.value.unshift(response.data)
        // Auto-select the newly created workspace
        activeWorkspaceId.value = response.data.id
        return response.data
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to create workspace'
        return null
      } finally {
        isLoading.value = false
      }
    }

    return {
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      isLoading,
      error,
      setWorkspaces,
      setActiveWorkspace,
      fetchWorkspaces,
      createWorkspace
    }
  },
  {
    persist: {
      pick: ['activeWorkspaceId']
    }
  }
)
