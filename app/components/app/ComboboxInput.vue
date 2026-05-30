<template>
  <div ref="wrapperRef" class="relative">
    <!-- Inner field: pills + text input -->
    <div
      class="combobox-field"
      :class="[
        dark ? 'combobox-field--dark' : 'combobox-field--light',
        { 'combobox-field--open': isOpen }
      ]"
      @click="focusInput"
    >
      <!-- Selected pills (multiple mode) -->
      <span
        v-for="item in selectedArray"
        :key="item"
        class="combobox-pill"
        :class="dark ? 'combobox-pill--dark' : 'combobox-pill--light'"
      >
        {{ item }}
        <button class="combobox-pill__remove" tabindex="-1" @mousedown.prevent="removeItem(item)">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path
              d="M1 1l8 8M9 1l-8 8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </span>

      <!-- Text input -->
      <input
        ref="inputRef"
        v-model="query"
        class="combobox-input"
        :class="dark ? 'combobox-input--dark' : 'combobox-input--light'"
        :placeholder="inputPlaceholder"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        type="text"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
    </div>

    <!-- Dropdown -->
    <Transition name="cb-drop">
      <div
        v-if="isOpen && visibleOptions.length > 0"
        class="combobox-dropdown"
        :class="dark ? 'combobox-dropdown--dark' : 'combobox-dropdown--light'"
      >
        <!-- "Recent" section label shown only when not typing -->
        <div v-if="showRecentLabel" class="combobox-section-label">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="inline mr-1 opacity-60"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Recent
        </div>

        <!-- Options -->
        <div
          v-for="(option, idx) in visibleOptions"
          :key="option"
          class="combobox-option"
          :class="{
            'combobox-option--active': idx === activeIdx,
            'combobox-option--selected': isSelected(option),
            'combobox-option--recent': isRecentItem(option) && !query.trim(),
            'combobox-option--dark': dark,
            'combobox-option--light': !dark
          }"
          @mousedown.prevent="choose(option)"
        >
          <span class="flex-1 truncate">{{ option }}</span>
          <span v-if="isRecentItem(option) && !query.trim()" class="combobox-recent-badge"
            >recent</span
          >
          <svg
            v-if="isSelected(option)"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="ml-2 text-primary-500 shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => ''
  },
  options: {
    type: Array,
    default: () => []
  },
  recentOptions: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select...'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  /** Allow typing a value not present in options */
  allowCustom: {
    type: Boolean,
    default: false
  },
  /** Dark transparent mode (for use in header bar) */
  dark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'submit'])

const wrapperRef = ref(null)
const inputRef = ref(null)
const isOpen = ref(false)
const query = ref('')
const activeIdx = ref(-1)

// ─── Selection helpers ───────────────────────────────────────────────────────

const selectedArray = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return []
})

const isSelected = (option) => {
  if (props.multiple) return selectedArray.value.includes(option)
  return props.modelValue === option
}

const isRecentItem = (option) => props.recentOptions.includes(option)

// ─── Visible options ─────────────────────────────────────────────────────────

/** All options ordered: recent first, then the rest */
const orderedOptions = computed(() => {
  const recentValid = props.recentOptions.filter((r) => props.options.includes(r))
  const rest = props.options.filter((o) => !recentValid.includes(o))
  return [...recentValid, ...rest]
})

/** Options shown in dropdown (filtered by query, minus already-selected in multiple mode) */
const visibleOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  let pool = orderedOptions.value

  // In multiple mode, hide already-selected items
  if (props.multiple) {
    pool = pool.filter((o) => !selectedArray.value.includes(o))
  }

  if (!q) return pool
  return pool.filter((o) => o.toLowerCase().includes(q))
})

const showRecentLabel = computed(
  () => !query.value.trim() && props.recentOptions.some((r) => props.options.includes(r))
)

// ─── Placeholder ─────────────────────────────────────────────────────────────

const inputPlaceholder = computed(() => {
  if (props.multiple && selectedArray.value.length > 0) return ''
  return props.placeholder
})

// ─── Sync query ↔ modelValue (single mode) ───────────────────────────────────

watch(
  () => props.modelValue,
  (val) => {
    if (!props.multiple && !isOpen.value) {
      // Show the selected value in the input (skip sentinel values)
      const display = val && val !== 'Select Project' ? val : ''
      if (query.value !== display) query.value = display
    }
  },
  { immediate: true }
)

// ─── Focus / blur ────────────────────────────────────────────────────────────

const onFocus = () => {
  isOpen.value = true
  activeIdx.value = -1
  // Clear query so user sees full options list, not just the selected label
  if (!props.multiple) query.value = ''
}

const onBlur = () => {
  // Small delay so mousedown on dropdown option can fire first
  setTimeout(() => {
    if (!wrapperRef.value?.contains(document.activeElement)) {
      closeDropdown()
    }
  }, 150)
}

const closeDropdown = () => {
  isOpen.value = false
  activeIdx.value = -1
  // Auto-commit if allowCustom is true, otherwise restore selected label
  if (!props.multiple) {
    if (props.allowCustom && query.value.trim() && query.value !== props.modelValue) {
      commitCustom()
    } else {
      const val = props.modelValue
      query.value = val && val !== 'Select Project' ? val : ''
    }
  } else {
    query.value = ''
  }
}

// ─── Keyboard handler ─────────────────────────────────────────────────────────

const onKeydown = (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      isOpen.value = true
      activeIdx.value = Math.min(activeIdx.value + 1, visibleOptions.value.length - 1)
      break

    case 'ArrowUp':
      e.preventDefault()
      activeIdx.value = Math.max(activeIdx.value - 1, -1)
      break

    case 'Enter': {
      e.preventDefault()
      const highlighted = visibleOptions.value[activeIdx.value]
      if (highlighted) {
        choose(highlighted)
      } else if (props.allowCustom && query.value.trim()) {
        commitCustom()
        emit('submit')
      } else if (!props.multiple && visibleOptions.value.length > 0) {
        // Auto-select first match
        choose(visibleOptions.value[0])
      }
      break
    }

    case 'Tab': {
      // Commit any highlighted or custom value, let Tab move focus naturally
      const highlighted = visibleOptions.value[activeIdx.value]
      if (highlighted) {
        choose(highlighted, true)
      } else if (props.allowCustom && query.value.trim()) {
        commitCustom()
      }
      isOpen.value = false
      // Do NOT emit confirm, let native browser Tab flow work unhindered.
      break
    }

    case 'Escape':
      e.preventDefault()
      e.stopPropagation()
      isOpen.value = false
      if (!props.multiple) {
        const val = props.modelValue
        query.value = val && val !== 'Select Project' ? val : ''
      } else {
        query.value = ''
      }
      break

    case 'Backspace':
      // In multiple mode, remove the last tag when query is empty
      if (props.multiple && !query.value && selectedArray.value.length > 0) {
        const newSelected = selectedArray.value.slice(0, -1)
        emit('update:modelValue', newSelected)
      }
      break

    case ',':
    case ';':
      // Quick-add separator in multiple+allowCustom mode
      if (props.multiple && props.allowCustom && query.value.trim()) {
        e.preventDefault()
        commitCustom()
      }
      break
  }
}

// ─── Selection actions ───────────────────────────────────────────────────────

const choose = (option, preventFocusOverride = false) => {
  if (props.multiple) {
    const current = [...selectedArray.value]
    const idx = current.indexOf(option)
    if (idx === -1) current.push(option)
    else current.splice(idx, 1)
    emit('update:modelValue', current)
    query.value = ''
    activeIdx.value = -1
    // Return focus to input for consecutive tag additions, unless Tab was pressed
    if (!preventFocusOverride) nextTick(() => inputRef.value?.focus())
  } else {
    emit('update:modelValue', option)
    query.value = option
    isOpen.value = false
    activeIdx.value = -1
  }
}

const commitCustom = () => {
  const val = query.value.trim()
  if (!val) return
  if (props.multiple) {
    if (!selectedArray.value.includes(val)) {
      emit('update:modelValue', [...selectedArray.value, val])
    }
    query.value = ''
  } else {
    emit('update:modelValue', val)
    query.value = val
    isOpen.value = false
  }
}

const removeItem = (item) => {
  emit(
    'update:modelValue',
    selectedArray.value.filter((i) => i !== item)
  )
}

const focusInput = () => {
  inputRef.value?.focus()
}

defineExpose({ focus: focusInput })
</script>

<style scoped>
/* ─── Field (the visible "input box") ──────────────────────────────────────── */
.combobox-field {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  cursor: text;
}

.combobox-field--light {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  background: #fff;
  transition: border-color 0.15s;
  min-height: 38px;
}
.dark .combobox-field--light {
  background: #111827;
  border-color: #374151;
  color: #f3f4f6;
}
.combobox-field--light.combobox-field--open,
.combobox-field--light:focus-within {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgb(16 185 129 / 0.15);
}

.combobox-field--dark {
  /* Transparent — used in the header navbar */
  padding: 2px 0;
}

/* ─── Inline text input ─────────────────────────────────────────────────────── */
.combobox-input {
  flex: 1;
  min-width: 60px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.combobox-input--light {
  color: #1e293b;
}
.dark .combobox-input--light {
  color: #f1f5f9;
}
.combobox-input--light::placeholder {
  color: #94a3b8;
}

.combobox-input--dark {
  color: #cbd5e1;
}
.combobox-input--dark::placeholder {
  color: #64748b;
}

/* ─── Pills ─────────────────────────────────────────────────────────────────── */
.combobox-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  white-space: nowrap;
}
.combobox-pill--light {
  background: #d1fae5;
  color: #065f46;
}
.dark .combobox-pill--light {
  background: rgb(16 185 129 / 0.2);
  color: #6ee7b7;
}
.combobox-pill--dark {
  background: #334155;
  color: #cbd5e1;
}
.combobox-pill__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  border-radius: 2px;
  transition: opacity 0.1s;
}
.combobox-pill__remove:hover {
  opacity: 1;
}

/* ─── Dropdown ───────────────────────────────────────────────────────────────── */
.combobox-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 200px;
  width: max-content;
  max-width: 360px;
  max-height: 260px;
  overflow-y: auto;
  border-radius: 10px;
  z-index: 9999;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}
.combobox-dropdown--light {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}
.dark .combobox-dropdown--light {
  background: #1f2937;
  border-color: #374151;
}
.combobox-dropdown--dark {
  background: #1e293b;
  border: 1px solid #334155;
}

/* ─── Section label ─────────────────────────────────────────────────────────── */
.combobox-section-label {
  padding: 4px 10px 2px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  user-select: none;
}

/* ─── Option row ─────────────────────────────────────────────────────────────── */
.combobox-option {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s;
  white-space: nowrap;
}
.combobox-option--light {
  color: #1e293b;
}
.dark .combobox-option--light {
  color: #f1f5f9;
}
.combobox-option--dark {
  color: #e2e8f0;
}

.combobox-option--light:hover,
.combobox-option--active.combobox-option--light {
  background: #f0fdf4;
  color: #065f46;
}
.dark .combobox-option--light:hover,
.dark .combobox-option--active.combobox-option--light {
  background: rgb(16 185 129 / 0.12);
  color: #6ee7b7;
}
.combobox-option--dark:hover,
.combobox-option--active.combobox-option--dark {
  background: #334155;
}

/* ─── Recent item subtle highlight ─────────────────────────────────────────── */
.combobox-option--recent {
  font-weight: 500;
}

.combobox-recent-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #10b981;
  background: rgb(16 185 129 / 0.12);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 8px;
  flex-shrink: 0;
}

/* ─── Dropdown animation ─────────────────────────────────────────────────────── */
.cb-drop-enter-active,
.cb-drop-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.cb-drop-enter-from,
.cb-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
