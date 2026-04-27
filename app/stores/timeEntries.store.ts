import { defineStore } from 'pinia'
import type { TimeEntry } from '~/types'

/**
 * useTimeEntriesStore
 *
 * Manages the loaded time entries and the currently selected date in the UI.
 */
export const useTimeEntriesStore = defineStore(
  'timeEntries',
  () => {
    // --- State ---
    const entries = ref<TimeEntry[]>([])
    const selectedDate = ref(new Date().toISOString().slice(0, 10))

    // --- Actions ---
    function setEntries(list: TimeEntry[]) {
      entries.value = list
    }

    function addEntry(entry: TimeEntry) {
      entries.value.unshift(entry)
    }

    return {
      entries,
      selectedDate,
      setEntries,
      addEntry
    }
  },
  {
    persist: {
      pick: ['selectedDate'] // Only persist the date preference, fetch entries fresh
    }
  }
)
