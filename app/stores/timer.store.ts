import { defineStore } from 'pinia'

/**
 * useTimerStore
 *
 * Manages the state of the active tracking timer and the draft entry being edited.
 */
export const useTimerStore = defineStore(
  'timer',
  () => {
    // --- State ---
    const isRunning = ref(false)
    const startTimestamp = ref<number | null>(null)

    const draftEntry = ref({
      description: '',
      projectId: null as string | null,
      issueId: null as string | null,
      tagIds: [] as string[]
    })

    // --- Actions ---
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
      startTimestamp,
      draftEntry,
      resetDraft
    }
  },
  {
    persist: {
      pick: ['draftEntry']
    }
  }
)
