import { defineStore } from 'pinia'
import type { KeybindingAction, KeybindingActionId, KeybindingBinding } from '~/types'

export const KEYBINDING_ACTIONS: KeybindingAction[] = [
  {
    id: 'startTimer',
    label: 'Start timer',
    description: 'Start the timer if it is not already running',
    category: 'timer'
  },
  {
    id: 'saveTimer',
    label: 'Save & stop timer',
    description: 'Stop the running timer and save the time entry',
    category: 'timer'
  },
  {
    id: 'stopTimer',
    label: 'Cancel timer',
    description: 'Stop the running timer without saving',
    category: 'timer'
  },
  {
    id: 'resumeLast',
    label: 'Resume last timer',
    description: 'Resume the most recent time entry',
    category: 'timer'
  },
  {
    id: 'goToDashboard',
    label: 'Go to dashboard',
    description: 'Navigate to the dashboard',
    category: 'navigation'
  },
  {
    id: 'focusTaskField',
    label: 'Focus task / issue field',
    description: 'Start typing into the task or issue input field',
    category: 'navigation'
  },
  {
    id: 'focusDescField',
    label: 'Focus description field',
    description: 'Start typing into the description input field',
    category: 'navigation'
  },
  {
    id: 'editLastEntry',
    label: 'Edit last time entry',
    description: 'Open the most recent time entry for editing',
    category: 'timeEntry'
  },
  {
    id: 'createNew',
    label: 'Create new',
    // TODO: maps to whichever "create new" button is visible in the current context
    description: 'Activate the primary "create new" button on the current screen',
    category: 'special'
  },
  {
    id: 'toggleSidebar',
    label: 'Toggle sidebar',
    description: 'Show or hide the sidebar navigation',
    category: 'navigation'
  }
]

// TODO: arbitrary defaults, finalize before launch
export const DEFAULT_BINDINGS: Record<KeybindingActionId, KeybindingBinding> = {
  startTimer: { key: 'Alt+S', enabled: true },
  saveTimer: { key: 'Alt+E', enabled: true },
  stopTimer: { key: 'Alt+X', enabled: true },
  resumeLast: { key: 'Alt+R', enabled: true },
  goToDashboard: { key: 'Alt+D', enabled: true },
  focusTaskField: { key: 'Alt+T', enabled: true },
  focusDescField: { key: '/', enabled: true },
  editLastEntry: { key: 'Alt+L', enabled: true },
  createNew: { key: 'Alt+C', enabled: true },
  toggleSidebar: { key: '[', enabled: true }
}

export const useKeybindingsStore = defineStore(
  // version bump forces a clean reset of old persisted string-shape bindings
  'keybindings-v3',
  () => {
    const bindings = ref<Record<KeybindingActionId, KeybindingBinding>>({ ...DEFAULT_BINDINGS })

    function updateBinding(actionId: KeybindingActionId, key: string) {
      bindings.value[actionId] = { ...bindings.value[actionId], key }
    }

    function setEnabled(actionId: KeybindingActionId, enabled: boolean) {
      bindings.value[actionId] = { ...bindings.value[actionId], enabled }
    }

    function resetToDefaults() {
      bindings.value = Object.keys(DEFAULT_BINDINGS).reduce(
        (acc, key) => {
          const k = key as KeybindingActionId
          acc[k] = { ...DEFAULT_BINDINGS[k] }
          return acc
        },
        {} as Record<KeybindingActionId, KeybindingBinding>
      )
    }

    return {
      bindings,
      updateBinding,
      setEnabled,
      resetToDefaults
    }
  },
  {
    persist: true
  }
)
