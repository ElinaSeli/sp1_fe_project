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
      // Ensure the active workspace ID exists in the new list, or clear/auto-select
      const stillExists = list.some((w) => w.id === activeWorkspaceId.value)
      if (!stillExists) {
        activeWorkspaceId.value = list.length > 0 ? list[0]!.id : null
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

    async function updateWorkspace(id: string, name: string): Promise<Workspace | null> {
      isLoading.value = true
      error.value = null
      try {
        const response = await workspacesService.update(id, { name })
        if (response.error || !response.data) {
          error.value = response.error ?? 'Failed to update workspace'
          return null
        }
        const idx = workspaces.value.findIndex((w) => w.id === id)
        if (idx !== -1) workspaces.value[idx] = response.data
        return response.data
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to update workspace'
        return null
      } finally {
        isLoading.value = false
      }
    }

    async function deleteWorkspace(id: string): Promise<boolean> {
      isLoading.value = true
      error.value = null
      try {
        const response = await workspacesService.delete(id)
        if (response.error) {
          error.value = response.error
          return false
        }
        workspaces.value = workspaces.value.filter((w) => w.id !== id)
        if (activeWorkspaceId.value === id) {
          activeWorkspaceId.value = workspaces.value.length > 0 ? workspaces.value[0]!.id : null
        }
        return true
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to delete workspace'
        return false
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
      createWorkspace,
      updateWorkspace,
      deleteWorkspace
    }
  },
  {
    persist: {
      pick: ['activeWorkspaceId']
    }
  }
)
