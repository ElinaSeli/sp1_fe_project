import { defineStore } from 'pinia'
import { timerService } from '~/services/timer.service'
import type { TimeEntryViewModel } from '~/types'

export const useTimerStore = defineStore(
  'timer',
  () => {
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

    const entries = ref<TimeEntryViewModel[]>([])

    async function fetchEntries() {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return

      const response = await timerService.getEntries(workspacesStore.activeWorkspaceId)
      if (response.data) {
        entries.value = response.data.map((e) => ({
          id: e.id,
          description: e.description || '',
          projectId: e.projectId,
          duration: e.timeEnd
            ? Math.floor((new Date(e.timeEnd).getTime() - new Date(e.timeStart).getTime()) / 1000)
            : 0,
          timeStart: e.timeStart
        }))
      }
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

      isStarting.value = true
      try {
        const response = await timerService.start(workspacesStore.activeWorkspaceId, {
          description: draftEntry.value.description,
          projectId: draftEntry.value.projectId,
          taskId: draftEntry.value.taskId || undefined,
          tagIds: draftEntry.value.tagIds
        })

        if (response.data) {
          isRunning.value = true
          activeEntryId.value = response.data.id
          startTimestamp.value = Date.now()
        } else if (response.error) {
          throw new Error(response.error)
        }
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
            timeStart: entry.timeStart
          })
          isRunning.value = false
          startTimestamp.value = null
          activeEntryId.value = null
          resetDraft()
        } else if (response.error) {
          throw new Error(response.error)
        }
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
