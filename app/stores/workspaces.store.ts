import { defineStore } from 'pinia'
import type { Workspace } from '~/types'
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

    // --- Getters ---
    const activeWorkspace = computed(
      () => workspaces.value.find((w) => w.id === activeWorkspaceId.value) || null
    )

    // --- Actions ---
    function setWorkspaces(list: Workspace[]) {
      workspaces.value = list
      // Set first workspace as active if none selected
      if (list.length > 0 && !activeWorkspaceId.value) {
        const first = list[0]
        if (first) {
          activeWorkspaceId.value = first.id
        }
      }
    }

    function setActiveWorkspace(id: string) {
      activeWorkspaceId.value = id
    }

    async function fetchWorkspaces() {
      const response = await workspacesService.getAll()
      if (!response.error && response.data) {
        setWorkspaces(response.data)
      }
      return response
    }

    return {
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      setWorkspaces,
      setActiveWorkspace,
      fetchWorkspaces
    }
  },
  {
    persist: {
      pick: ['activeWorkspaceId']
    }
  }
)
