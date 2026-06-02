import { defineStore } from 'pinia'
import { timerService } from '~/services/timer.service'
import { timeEntriesService } from '~/services/timeEntries.service'
import type {
  TimeEntry,
  TimeEntryViewModel,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest
} from '~/types'

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
      issueId: null as string | null,
      tagIds: [] as string[]
    })

    watch(
      () => draftEntry.value.projectId,
      (newVal, oldVal) => {
        if (oldVal !== null && oldVal !== undefined && newVal !== oldVal) {
          const issuesStore = useIssuesStore()
          const tagsStore = useTagsStore()

          // Swap Issue ID
          if (draftEntry.value.issueId) {
            const oldIssue = (issuesStore.issues || []).find(
              (i) => i.id === draftEntry.value.issueId
            )
            if (oldIssue) {
              const newIssue = (issuesStore.issues || []).find(
                (i) => i.name === oldIssue.name && i.projectId === newVal
              )
              draftEntry.value.issueId = newIssue ? newIssue.id : null
            } else {
              draftEntry.value.issueId = null
            }
          }

          // Swap Tag IDs
          if (draftEntry.value.tagIds && draftEntry.value.tagIds.length > 0) {
            const newTagIds: string[] = []
            for (const oldId of draftEntry.value.tagIds) {
              const oldTag = (tagsStore.tags || []).find((t) => t.id === oldId)
              if (oldTag) {
                const newTag = (tagsStore.tags || []).find(
                  (t) => t.name === oldTag.name && t.projectId === newVal
                )
                if (newTag) newTagIds.push(newTag.id)
              }
            }
            draftEntry.value.tagIds = newTagIds
          }
        }
      }
    )

    const entries = ref<TimeEntryViewModel[]>([])
    const rawEntries = ref<TimeEntry[]>([])

    async function fetchEntries(params?: {
      startDate?: string
      endDate?: string
      page?: number
      size?: number
    }) {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return

      // Temporary hack: if no params are passed, we ask for size: 100 to populate the calendar
      const fetchParams = params || { size: 100 }

      const response = await timeEntriesService.getAll(
        workspacesStore.activeWorkspaceId,
        fetchParams
      )
      if (response.data) {
        // Defensive: Extract .content if the backend returns a PagedResponse, otherwise fallback to array
        const listData = Array.isArray(response.data)
          ? response.data
          : (response.data as Record<string, unknown>).content
        if (Array.isArray(listData)) {
          rawEntries.value = listData as TimeEntry[]
          entries.value = (listData as TimeEntry[]).map((e) => ({
            id: e.id,
            description: e.description || '',
            projectId: e.projectId,
            duration: e.timeEnd
              ? Math.floor((new Date(e.timeEnd).getTime() - new Date(e.timeStart).getTime()) / 1000)
              : 0,
            timeStart: e.timeStart,
            timeEnd: e.timeEnd
          }))
        } else {
          rawEntries.value = []
          entries.value = []
        }
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
        draftEntry.value.issueId = response.data.issueId || null
        draftEntry.value.tagIds = response.data.tagIds || []
      } else {
        isRunning.value = false
        startTimestamp.value = null
        activeEntryId.value = null
      }
    }

    async function startTimer() {
      const workspacesStore = useWorkspacesStore()
      const projectsStore = useProjectsStore()

      if (!workspacesStore.activeWorkspaceId) throw new Error('No active workspace')

      // Graceful validation: if the project ID is ghost/stale, clear it before sending
      if (
        draftEntry.value.projectId &&
        !projectsStore.projects.some((p) => p.id === draftEntry.value.projectId)
      ) {
        console.warn(
          'Ghost project ID detected, clearing before start:',
          draftEntry.value.projectId
        )
        draftEntry.value.projectId = null
        draftEntry.value.issueId = null
      }

      isStarting.value = true
      try {
        const response = await timerService.start(workspacesStore.activeWorkspaceId, {
          description: draftEntry.value.description || null,
          projectId: draftEntry.value.projectId,
          issueId: draftEntry.value.issueId || null
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
            timeStart: entry.timeStart,
            timeEnd: entry.timeEnd
          })
          rawEntries.value.unshift(entry)
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

    async function createEntry(payload: CreateTimeEntryRequest): Promise<TimeEntry | null> {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return null

      const response = await timeEntriesService.create(workspacesStore.activeWorkspaceId, payload)
      if (!response.data) return null

      const e = response.data
      rawEntries.value.unshift(e)
      entries.value.unshift({
        id: e.id,
        description: e.description || '',
        projectId: e.projectId,
        duration: e.timeEnd
          ? Math.floor((new Date(e.timeEnd).getTime() - new Date(e.timeStart).getTime()) / 1000)
          : 0,
        timeStart: e.timeStart,
        timeEnd: e.timeEnd
      })
      return e
    }

    async function updateEntry(
      id: string,
      payload: UpdateTimeEntryRequest
    ): Promise<TimeEntry | null> {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return null

      const response = await timeEntriesService.update(
        workspacesStore.activeWorkspaceId,
        id,
        payload
      )
      if (!response.data) return null

      const e = response.data
      const rawIdx = rawEntries.value.findIndex((r) => r.id === id)
      if (rawIdx !== -1) rawEntries.value[rawIdx] = e
      const vmIdx = entries.value.findIndex((v) => v.id === id)
      if (vmIdx !== -1) {
        entries.value[vmIdx] = {
          id: e.id,
          description: e.description || '',
          projectId: e.projectId,
          duration: e.timeEnd
            ? Math.floor((new Date(e.timeEnd).getTime() - new Date(e.timeStart).getTime()) / 1000)
            : 0,
          timeStart: e.timeStart,
          timeEnd: e.timeEnd
        }
      }
      return e
    }

    async function deleteEntry(id: string): Promise<boolean> {
      const workspacesStore = useWorkspacesStore()
      if (!workspacesStore.activeWorkspaceId) return false

      const response = await timeEntriesService.remove(workspacesStore.activeWorkspaceId, id)
      if (response.error) {
        console.error('Failed to delete time entry:', response.error)
        return false
      }

      // Remove from reactive lists
      rawEntries.value = rawEntries.value.filter((r) => r.id !== id)
      entries.value = entries.value.filter((v) => v.id !== id)

      return true
    }

    async function resumeEntry(id: string): Promise<boolean> {
      const entry = rawEntries.value.find((e) => e.id === id)
      if (!entry) return false

      if (isRunning.value) {
        await stopTimer()
      }

      draftEntry.value.description = entry.description || ''
      draftEntry.value.projectId = entry.projectId
      draftEntry.value.issueId = entry.issueId || null
      draftEntry.value.tagIds = [...(entry.tagIds || [])]

      try {
        await startTimer()
        return true
      } catch (err) {
        console.error('Failed to resume timer', err)
        return false
      }
    }

    function resetDraft() {
      draftEntry.value = {
        description: '',
        projectId: null,
        issueId: null,
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
      rawEntries,
      fetchEntries,
      fetchActiveTimer,
      startTimer,
      stopTimer,
      createEntry,
      updateEntry,
      deleteEntry,
      resumeEntry,
      resetDraft
    }
  },
  {
    persist: {
      pick: ['draftEntry']
    }
  }
)
