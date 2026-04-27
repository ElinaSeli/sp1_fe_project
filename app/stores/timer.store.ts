import { defineStore } from 'pinia'
import { timerService } from '~/services/timer.service'

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

    async function fetchActiveTimer() {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return

      const response = await timerService.getActive(workspacesStore.activeWorkspaceId)
      if (response.data) {
        isRunning.value = true
        activeEntryId.value = response.data.id
        startTimestamp.value = new Date(response.data.startTime).getTime()
        draftEntry.value.description = response.data.description
        draftEntry.value.projectId = response.data.projectId
        draftEntry.value.taskId = response.data.taskId || null
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
      if (!draftEntry.value.projectId) throw new Error('Please select a project first')

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
          throw new Error(response.error.message)
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
        if (response.data || response.status === 200 || response.status === 204) {
          isRunning.value = false
          startTimestamp.value = null
          activeEntryId.value = null
          resetDraft()
        } else if (response.error) {
          throw new Error(response.error.message)
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
