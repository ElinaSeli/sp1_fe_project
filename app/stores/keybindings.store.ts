import { defineStore } from 'pinia'
import type { KeybindingAction, KeybindingActionId } from '~/types'

export const KEYBINDING_ACTIONS: KeybindingAction[] = [
  {
    id: 'startTimer',
    label: 'Start timer',
    description: 'Start the timer if it is not already running'
  },
  {
    id: 'saveTimer',
    label: 'Save & stop timer',
    description: 'Stop the running timer and save the time entry'
  },
  {
    id: 'stopTimer',
    label: 'Cancel timer',
    description: 'Stop the running timer without saving'
  },
  {
    id: 'newTimeEntry',
    label: 'New time entry',
    description: 'Open the form to add a manual time entry'
  },
  {
    id: 'goToDashboard',
    label: 'Go to dashboard',
    description: 'Navigate to the dashboard'
  },
  {
    id: 'resumeLast',
    label: 'Resume last timer',
    description: 'Resume the most recent time entry'
  }
]

export const DEFAULT_BINDINGS: Record<KeybindingActionId, string> = {
  startTimer: 'Alt+S',
  saveTimer: 'Alt+E',
  stopTimer: 'Alt+X',
  newTimeEntry: 'Alt+N',
  goToDashboard: 'Alt+D',
  resumeLast: 'Alt+R'
}

/**
 * useKeybindingsStore
 *
 * Manages user-customizable keyboard shortcuts.
 */
export const useKeybindingsStore = defineStore(
  'keybindings',
  () => {
    // --- State ---
    const bindings = ref<Record<KeybindingActionId, string>>({ ...DEFAULT_BINDINGS })

    // --- Actions ---
    function updateBinding(actionId: KeybindingActionId, key: string) {
      bindings.value[actionId] = key
    }

    function resetToDefaults() {
      bindings.value = { ...DEFAULT_BINDINGS }
    }

    return {
      bindings,
      updateBinding,
      resetToDefaults
    }
  },
  {
    persist: true
  }
)
