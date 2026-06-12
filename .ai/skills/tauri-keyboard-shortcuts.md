# Skill: Tauri + Browser Keyboard Shortcuts

Implementing global keyboard shortcuts that work in-browser, in the Tauri WebView (window focused), and system-wide (Tauri window unfocused or minimized).

---

## Architecture

Two layers, always both active in Tauri:

| Layer                                | Scope               | How                                                 |
| ------------------------------------ | ------------------- | --------------------------------------------------- |
| `window.addEventListener('keydown')` | Window focused only | Works in browser AND Tauri WebView                  |
| `tauri-plugin-global-shortcut`       | System-wide         | Fires even when Tauri window is unfocused/minimized |

**Critical mistake to avoid:** never use an exclusive `if (isTauri) { registerGlobal() } else { addWindowListener() }`. The window listener must always be attached. Tauri global shortcuts are additive — they give you unfocused-window coverage, not a replacement.

```typescript
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown) // always
  if (isTauri) {
    await registerTauri() // bonus: fires when window not focused
    watch(() => store.bindings, registerTauri, { deep: true })
  }
})
```

---

## Tauri Setup

### Cargo.toml

```toml
tauri-plugin-global-shortcut = "2"
```

### src/lib.rs

```rust
.plugin(tauri_plugin_global_shortcut::Builder::new().build())
```

### capabilities/default.json

```json
"permissions": [
  "core:default",
  "global-shortcut:default",
  "global-shortcut:allow-register",
  "global-shortcut:allow-unregister",
  "global-shortcut:allow-is-registered",
  "core:window:allow-set-focus",
  "core:window:allow-unminimize"
]
```

**`global-shortcut:default` alone is NOT enough** — it does not include `register`. You must add `allow-register`, `allow-unregister` explicitly. Same pattern for window commands: prefix is `core:window:allow-*`, not `window:allow-*`.

### package.json

```json
"@tauri-apps/api": "~2.10.0",
"@tauri-apps/plugin-global-shortcut": "^2.0.0"
```

Pin `@tauri-apps/api` to the same minor as the `tauri` Rust crate or the build will refuse with a version mismatch error.

---

## Key String Format

Normalise to `"Alt+S"`, `"Ctrl+Shift+X"` etc. Both the browser `keydown` comparison and Tauri's `register()` accept this format.

```typescript
function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Meta')
  const key = e.key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key))
    parts.push(key.length === 1 ? key.toUpperCase() : key)
  return parts.join('+')
}
```

---

## Global Shortcut Callback: Window Restore + Modifier-Up Wait

When a global shortcut fires, the window may be unfocused or minimized. Three things must happen before dispatching the action:

1. **Unminimize** — restores the window if minimized
2. **setFocus** — brings window to front
3. **Wait for modifier keyup** — the modifier key (e.g. Alt) fires a `keyup` into the freshly-focused window; if you dispatch the action immediately, that keyup will close any popup/dropdown you just opened

```typescript
await register(binding.key, async () => {
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  await win.unminimize()
  await win.setFocus()
  await waitForModifiersUp(binding.key)
  ACTION_HANDLERS[id]()
})
```

### waitForModifiersUp

Fixed timeouts don't work — the user may hold keys for any duration. Listen for actual keyup events instead, with a safety timeout fallback:

```typescript
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
```

---

## Opening Dropdowns / Popups via Shortcuts

**Never use `element.click()` to open a dropdown from a global shortcut.**

On Windows WebView2, the Alt key activates the browser menu-bar mode. When Alt is released (even after `waitForModifiersUp` resolves), WebView2 may dispatch a second focus-shift that closes any newly-opened popup.

**Use Vue reactivity instead:**

1. Add a reactive `open` ref and `v-model:open` to the component:

```vue
<!-- TimerBar.vue -->
<script setup>
const taskSelectOpen = ref(false)
onMounted(() => {
  window.addEventListener('app:focusTaskField', () => { taskSelectOpen.value = true })
})
</script>

<USelectMenu v-model:open="taskSelectOpen" ...>
```

2. Dispatch a `CustomEvent` from the shortcut handler:

```typescript
focusTaskField: () => window.dispatchEvent(new CustomEvent('app:focusTaskField')),
```

This bypasses the DOM click entirely — the popup opens through Vue's reactivity and is not affected by subsequent keyup events.

---

## Platform Limitations

| Platform                    | Window listener | Global shortcuts                       |
| --------------------------- | --------------- | -------------------------------------- |
| Browser                     | ✓               | N/A                                    |
| Tauri dev (any OS)          | ✓               | ✓ (if registered)                      |
| Tauri build — Windows       | ✓               | ✓                                      |
| Tauri build — macOS         | ✓               | ✓                                      |
| Tauri — WSL2/WSLg (Wayland) | ✓               | ✗ — Wayland blocks cross-app key grabs |
| Tauri — Linux X11           | ✓               | ✓                                      |

WSL2 is a development-only limitation. Production Linux builds on a real X11 desktop work correctly.

---

## Debugging Production Builds

Console output is suppressed in Tauri GUI builds. To inspect:

1. Add the `devtools` Cargo feature temporarily:

```toml
# Cargo.toml — TODO: remove before release
tauri = { version = "2.x.x", features = ["devtools"] }
```

2. Right-click anywhere in the app → **Inspect** to open DevTools.

Check for:

- `[keybinding] Registered global shortcut: Alt+S → startTimer` — registration succeeded
- `Command plugin:global-shortcut|register not allowed by ACL` — missing capability permission

---

## Common Mistakes

| Mistake                                         | Symptom                                             | Fix                                                          |
| ----------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Exclusive if/else for Tauri vs browser listener | Shortcuts dead in Tauri when global-shortcut fails  | Always attach window listener; global shortcuts are additive |
| `global-shortcut:default` only                  | `not allowed by ACL` on register                    | Add `allow-register`, `allow-unregister` explicitly          |
| `window:allow-set-focus`                        | Build error: permission not found                   | Correct prefix is `core:window:allow-set-focus`              |
| `@tauri-apps/api` version mismatch              | Build refuses with version mismatch error           | Pin to same minor as Rust `tauri` crate                      |
| Fixed `setTimeout` before action                | Popup closes if user holds key normally             | Use `waitForModifiersUp` — listen for actual keyup           |
| `element.click()` to open dropdown              | Dropdown opens then immediately closes on Windows   | Use `CustomEvent` + Vue `v-model:open` reactivity            |
| Forget `unminimize()`                           | Shortcut fires but minimized window stays minimized | Call `win.unminimize()` before `win.setFocus()`              |
| Swapped `(path, method)` args                   | All mock API requests return 401                    | Keep function signature and all call sites consistent        |
