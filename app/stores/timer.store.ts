import { defineStore } from 'pinia'
import { timerService } from '~/services/timer.service'

export const useTimerStore = defineStore(
  'timer',
  () => {
    const toast = useToast()

    const isRunning = ref(false)
    const isStarting = ref(false)
    const isStopping = ref(false)
    const startTimestamp = ref<number | null>(null)
    const activeEntryId = ref<string | null>(null)

    const draftEntry = ref({
      description: '',
      projectId: null as string | null,
      taskId: null as string | null,
      tagIds: [] as string[]
    })

    const entries = ref<
      Array<{
        id: string
        description: string
        projectId: string | null
        duration: number
        createdAt: string
      }>
    >([])

    async function fetchEntries() {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return

      const response = await timerService.getEntries(workspacesStore.activeWorkspaceId)
      if (response.data) entries.value = response.data
    }

    async function fetchActiveTimer() {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return

      const response = await timerService.getActive(workspacesStore.activeWorkspaceId)
      if (response.data) {
        isRunning.value = true
        activeEntryId.value = response.data.id
        startTimestamp.value = new Date(response.data.timeStart).getTime()
        draftEntry.value.description = response.data.description || ''
        draftEntry.value.projectId = response.data.projectId
        draftEntry.value.taskId = response.data.issueId || null
        draftEntry.value.tagIds = response.data.tagIds || []
      } else {
        isRunning.value = false
        startTimestamp.value = null
        activeEntryId.value = null
      }
    }

    async function startTimer() {
      const workspacesStore = useWorkspacesStore()

      if (!workspacesStore.activeWorkspaceId) throw new Error('No active workspace')
      // Removed rigid projectId check to allow mock testing without projects

      isStarting.value = true
      try {
        const response = await timerService.start(workspacesStore.activeWorkspaceId, {
          description: draftEntry.value.description,
          projectId: draftEntry.value.projectId || '00000000-0000-0000-0000-000000000000',
          taskId: draftEntry.value.taskId || undefined,
          tagIds: draftEntry.value.tagIds
        })

        if (response.data) {
          isRunning.value = true
          activeEntryId.value = response.data.id
          startTimestamp.value = Date.now()
        } else if (response.error) {
          throw response.error
        }
      } catch (error: unknown) {
        console.warn('Timer start failed, falling back to mock state:', error)

        // Show fallback toast
        toast.add({
          title: 'Backend not ready',
          description: 'Mocking timer state for UI testing (API returned error).',
          color: 'warning',
          icon: 'i-lucide-alert-triangle'
        })

        // Manual state update for fallback
        isRunning.value = true
        startTimestamp.value = Date.now()
        activeEntryId.value = 'mock-id-' + Date.now()
      } finally {
        isStarting.value = false
      }
    }

    async function stopTimer() {
      const workspacesStore = useWorkspacesStore()

      if (!workspacesStore.activeWorkspaceId) throw new Error('No active workspace')

      isStopping.value = true
      try {
        const response = await timerService.stop(workspacesStore.activeWorkspaceId)
        if (response.data) {
          const entry = response.data
          entries.value.unshift({
            id: entry.id,
            description: entry.description || '',
            projectId: entry.projectId,
            duration: entry.timeEnd
              ? Math.floor(
                  (new Date(entry.timeEnd).getTime() - new Date(entry.timeStart).getTime()) / 1000
                )
              : 0,
            createdAt: entry.timeStart
          })
          isRunning.value = false
          startTimestamp.value = null
          activeEntryId.value = null
          resetDraft()
        } else if (response.error) {
          throw response.error
        }
      } catch (error: unknown) {
        console.warn('Timer stop failed, falling back to mock state:', error)

        toast.add({
          title: 'Backend not ready',
          description: 'Mocking stop state & saving entry locally.',
          color: 'warning',
          icon: 'i-lucide-alert-triangle'
        })

        // Save local mock entry
        const duration = startTimestamp.value
          ? Math.floor((Date.now() - startTimestamp.value) / 1000)
          : 0
        entries.value.unshift({
          id: 'mock-' + Date.now(),
          description: draftEntry.value.description || '(No description)',
          projectId: draftEntry.value.projectId,
          duration,
          createdAt: new Date().toISOString()
        })

        // Manual state reset for fallback
        isRunning.value = false
        startTimestamp.value = null
        activeEntryId.value = null
        resetDraft()
      } finally {
        isStopping.value = false
      }
    }

    function resetDraft() {
      draftEntry.value = {
        description: '',
        projectId: null,
        taskId: null,
        tagIds: []
      }
    }

    return {
      isRunning,
      isStarting,
      isStopping,
      startTimestamp,
      draftEntry,
      entries,
      fetchEntries,
      fetchActiveTimer,
      startTimer,
      stopTimer,
      resetDraft
    }
  },
  {
    persist: {
      pick: ['draftEntry']
    }
  }
)
