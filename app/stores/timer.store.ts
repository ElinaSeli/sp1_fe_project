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
    const toast = useToast()

    const draftEntry = ref({
      description: '',
      projectId: null as string | null,
      issueId: null as string | null,
      /** Redmine issue ID from live search — mutually exclusive with issueId. */
      externalIssueId: null as string | null,
      /** Display label for the selected Redmine issue (not saved to BE). */
      issueTitle: '' as string,
      /** Project name of the selected Redmine issue. */
      issueProjectName: '' as string,
      tagIds: [] as string[],
      isProjectManuallySelected: false
    })

    const isSwappingDisabled = ref(false)

    watch(
      () => draftEntry.value.projectId,
      (newVal, oldVal) => {
        if (!isSwappingDisabled.value && newVal !== oldVal) {
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
      },
      { flush: 'sync' }
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
            issueId: e.issueId ?? null,
            issueTitle: '', // title not stored in DB; populated only on local create/stop
            tagIds: e.tagIds ?? [],
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

        isSwappingDisabled.value = true
        draftEntry.value.description = response.data.description || ''
        draftEntry.value.projectId = response.data.projectId
        draftEntry.value.issueId = response.data.issueId || null
        draftEntry.value.tagIds = response.data.tagIds || []
        isSwappingDisabled.value = false
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

      // Auto-fill project from issue if projectId is empty
      if (
        !draftEntry.value.projectId &&
        draftEntry.value.externalIssueId &&
        draftEntry.value.issueProjectName
      ) {
        const localProj = projectsStore.projects.find(
          (p) =>
            p.name.trim().toLowerCase() === draftEntry.value.issueProjectName.trim().toLowerCase()
        )
        if (localProj) {
          draftEntry.value.projectId = localProj.id
        }
      }

      // Auto-fill project from tag if projectId is empty
      if (!draftEntry.value.projectId && draftEntry.value.tagIds.length > 0) {
        const tagsStore = useTagsStore()
        const tag = (tagsStore.tags || []).find((t) => t.id === draftEntry.value.tagIds[0])
        if (tag?.projectId) {
          draftEntry.value.projectId = tag.projectId
        }
      }

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
          issueId: draftEntry.value.externalIssueId ? null : draftEntry.value.issueId || null,
          externalIssueId: draftEntry.value.externalIssueId || null,
          tagIds: draftEntry.value.tagIds.length > 0 ? draftEntry.value.tagIds : undefined
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

          const projectsStore = useProjectsStore()
          const tagsStore = useTagsStore()

          // Auto-fill project if empty on stopped entry
          let finalProjectId = entry.projectId
          if (!finalProjectId) {
            // Try to find project from draft issue
            if (draftEntry.value.issueProjectName) {
              const matchedProj = projectsStore.projects.find(
                (p) =>
                  p.name.trim().toLowerCase() ===
                  draftEntry.value.issueProjectName.trim().toLowerCase()
              )
              if (matchedProj) finalProjectId = matchedProj.id
            }
            // Try to find project from draft tag
            if (!finalProjectId && draftEntry.value.tagIds.length > 0) {
              const tag = (tagsStore.tags || []).find((t) => t.id === draftEntry.value.tagIds[0])
              if (tag?.projectId) finalProjectId = tag.projectId
            }
            if (finalProjectId) {
              entry.projectId = finalProjectId
            }
          }

          if (!draftEntry.value.projectId && entry.projectId) {
            draftEntry.value.projectId = entry.projectId
          }

          const hasExternalIssue = !!draftEntry.value.externalIssueId
          const hasLocalIssue = !!draftEntry.value.issueId

          // Call update to save matching tags/issues
          const updateResponse = await timeEntriesService.update(
            workspacesStore.activeWorkspaceId,
            entry.id,
            {
              projectId: draftEntry.value.projectId || entry.projectId,
              issueId: hasLocalIssue ? draftEntry.value.issueId : null,
              externalIssueId: hasExternalIssue ? draftEntry.value.externalIssueId : null,
              description: draftEntry.value.description || null,
              timeStart: entry.timeStart,
              timeEnd: entry.timeEnd ?? new Date().toISOString(),
              tagIds: draftEntry.value.tagIds
            }
          )

          let finalEntry = updateResponse.data || entry

          // Determine if there is an issue mismatch (only if project was manually selected by user)
          let issueMismatch = false
          if (
            draftEntry.value.isProjectManuallySelected &&
            draftEntry.value.projectId &&
            (draftEntry.value.externalIssueId || draftEntry.value.issueId) &&
            finalEntry.projectId !== draftEntry.value.projectId
          ) {
            issueMismatch = true
          }

          // Target project ID after checking issue mismatch
          const targetProjectId = issueMismatch ? draftEntry.value.projectId : finalEntry.projectId

          // Check tag mismatch based on target project ID
          let tagMismatch = false
          const validTagIds = (draftEntry.value.tagIds || []).filter((tagId) => {
            const tag = (tagsStore.tags || []).find((t) => t.id === tagId)
            if (tag && tag.projectId && targetProjectId && tag.projectId !== targetProjectId) {
              tagMismatch = true
              return false
            }
            return true
          })

          // If we have any mismatch, make a single follow-up update to clear mismatched values in the database
          if (issueMismatch || tagMismatch) {
            const followUpResponse = await timeEntriesService.update(
              workspacesStore.activeWorkspaceId,
              finalEntry.id,
              {
                projectId: targetProjectId,
                issueId: issueMismatch ? null : finalEntry.issueId,
                externalIssueId: null, // already resolved
                description: finalEntry.description,
                timeStart: finalEntry.timeStart,
                timeEnd: finalEntry.timeEnd || new Date().toISOString(),
                tagIds: validTagIds
              }
            )
            if (followUpResponse.data) {
              finalEntry = followUpResponse.data
            }
          }

          if (issueMismatch || tagMismatch) {
            let desc = ''
            if (issueMismatch && tagMismatch) {
              desc =
                'The selected task and tags do not belong to the selected project. They were cleared from the saved entry.'
            } else if (issueMismatch) {
              desc = `The task "${draftEntry.value.issueTitle}" does not belong to the selected project. The entry was saved, but the task was cleared.`
            } else {
              desc =
                'The selected tags do not belong to the selected project. The entry was saved, but the tags were cleared.'
            }
            toast.add({
              title: 'Project mismatch',
              description: desc,
              color: 'warning',
              icon: 'i-lucide-alert-triangle'
            })
          }

          // Capture draft values before resetDraft() clears them
          const savedIssueTitle = issueMismatch ? '' : draftEntry.value.issueTitle
          entries.value.unshift({
            id: finalEntry.id,
            description: finalEntry.description || '',
            projectId: finalEntry.projectId,
            issueId: finalEntry.issueId ?? null,
            issueTitle: savedIssueTitle,
            tagIds: finalEntry.tagIds ?? [],
            duration: finalEntry.timeEnd
              ? Math.floor(
                  (new Date(finalEntry.timeEnd).getTime() -
                    new Date(finalEntry.timeStart).getTime()) /
                    1000
                )
              : 0,
            timeStart: finalEntry.timeStart,
            timeEnd: finalEntry.timeEnd
          })
          rawEntries.value.unshift(finalEntry)
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
        issueId: e.issueId ?? null,
        issueTitle: '', // caller (TimeEntryDialog) has the title but doesn't pass it back here
        tagIds: e.tagIds ?? [],
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
          issueId: e.issueId ?? null,
          // Preserve existing issueTitle if the backend doesn't store it
          issueTitle: entries.value[vmIdx]?.issueTitle ?? '',
          tagIds: e.tagIds ?? [],
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

      isSwappingDisabled.value = true
      draftEntry.value.description = entry.description || ''
      draftEntry.value.projectId = entry.projectId
      draftEntry.value.issueId = entry.issueId || null
      draftEntry.value.tagIds = [...(entry.tagIds || [])]
      isSwappingDisabled.value = false

      try {
        await startTimer()
        return true
      } catch (err) {
        console.error('Failed to resume timer', err)
        return false
      }
    }

    function resetDraft() {
      isSwappingDisabled.value = true
      draftEntry.value = {
        description: '',
        projectId: null,
        issueId: null,
        externalIssueId: null,
        issueTitle: '',
        issueProjectName: '',
        tagIds: [],
        isProjectManuallySelected: false
      }
      isSwappingDisabled.value = false
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
