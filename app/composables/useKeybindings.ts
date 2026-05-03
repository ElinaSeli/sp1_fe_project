import type { KeybindingActionId } from '~/types'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'

function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Meta')
  const key = e.key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key)
  }
  return parts.join('+')
}

// Maps our key-string modifier names to the e.key values the browser reports on keyup
const MODIFIER_KEY_MAP: Record<string, string> = {
  Ctrl: 'Control',
  Alt: 'Alt',
  Shift: 'Shift',
  Meta: 'Meta'
}

function waitForModifiersUp(keyString: string): Promise<void> {
  const held = keyString
    .split('+')
    .slice(0, -1)
    .map((m) => MODIFIER_KEY_MAP[m])
    .filter((m): m is string => Boolean(m))
  if (!held.length) return Promise.resolve()
  return new Promise((resolve) => {
    const released = new Set<string>()
    const onKeyup = (e: KeyboardEvent) => {
      if (held.includes(e.key)) released.add(e.key)
      if (held.every((m) => released.has(m))) {
        window.removeEventListener('keyup', onKeyup)
        resolve()
      }
    }
    window.addEventListener('keyup', onKeyup)
    setTimeout(() => {
      window.removeEventListener('keyup', onKeyup)
      resolve()
    }, 2000)
  })
}

const ACTION_HANDLERS: Record<KeybindingActionId, () => void> = {
  startTimer: () => console.warn('[keybinding] startTimer fired — TODO'),
  saveTimer: () => console.warn('[keybinding] saveTimer fired — TODO'),
  stopTimer: () => console.warn('[keybinding] stopTimer fired — TODO'),
  resumeLast: () => console.warn('[keybinding] resumeLast fired — TODO'),
  goToDashboard: () => {
    navigateTo('/')
  },
  focusTaskField: () => window.dispatchEvent(new CustomEvent('app:focusTaskField')),
  focusDescField: () => document.querySelector<HTMLElement>('[data-focus="desc-field"]')?.focus(),
  editLastEntry: () => console.warn('[keybinding] editLastEntry fired — TODO'),
  newTimeEntry: () => console.warn('[keybinding] newTimeEntry fired — TODO'),
  createNew: () => console.warn('[keybinding] createNew fired — TODO')
}

// Actions that should fire even when an input element is focused
const FOCUS_ACTIONS = new Set<KeybindingActionId>(['focusTaskField', 'focusDescField'])

export function useKeybindings() {
  const store = useKeybindingsStore()
  const isTauri =
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in (window as unknown as Record<string, unknown>)

  // --- Browser path ---

  function handleKeydown(e: KeyboardEvent) {
    const pressed = buildKeyString(e)
    if (!pressed) return

    const target = e.target as HTMLElement
    const inInput = ['INPUT', 'TEXTAREA'].includes(target.tagName)

    const ids = Object.keys(store.bindings) as KeybindingActionId[]
    for (const id of ids) {
      const binding = store.bindings[id]
      if (!binding.enabled || !binding.key || binding.key !== pressed) continue
      if (inInput && !FOCUS_ACTIONS.has(id)) continue
      e.preventDefault()
      ACTION_HANDLERS[id]()
    }
  }

  // --- Tauri path ---

  let registeredKeys: string[] = []

  async function registerTauri() {
    for (const k of registeredKeys) {
      try {
        await unregister(k)
      } catch {
        // ignore stale unregister errors
      }
    }
    registeredKeys = []

    const ids = Object.keys(store.bindings) as KeybindingActionId[]
    for (const id of ids) {
      const binding = store.bindings[id]
      if (!binding.enabled || !binding.key) continue
      try {
        await register(binding.key, async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          const win = getCurrentWindow()
          await win.unminimize()
          await win.setFocus()
          await waitForModifiersUp(binding.key)
          ACTION_HANDLERS[id]()
        })
        registeredKeys.push(binding.key)
      } catch (err) {
        console.warn(`[keybinding] Failed to register Tauri shortcut "${binding.key}":`, err)
      }
    }
  }

  async function unregisterAllTauri() {
    for (const k of registeredKeys) {
      try {
        await unregister(k)
      } catch {
        // ignore
      }
    }
    registeredKeys = []
  }

  // --- Lifecycle ---

  onMounted(async () => {
    window.addEventListener('keydown', handleKeydown)
    if (isTauri) {
      await registerTauri()
      watch(() => store.bindings, registerTauri, { deep: true })
    }
  })

  onScopeDispose(async () => {
    window.removeEventListener('keydown', handleKeydown)
    if (isTauri) {
      await unregisterAllTauri()
    }
  })
}
