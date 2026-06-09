<script setup lang="ts">
import { KEYBINDING_ACTIONS } from '~/stores/keybindings.store'
import type { KeybindingCategory } from '~/types'

const store = useKeybindingsStore()

const CATEGORY_LABELS: Record<KeybindingCategory, string> = {
  timer: 'Timer',
  navigation: 'Navigation',
  timeEntry: 'Time Entry',
  special: 'Special'
}

const CATEGORY_ICONS: Record<KeybindingCategory, string> = {
  timer: 'i-lucide-clock',
  navigation: 'i-lucide-compass',
  timeEntry: 'i-lucide-list',
  special: 'i-lucide-zap'
}

const categories: KeybindingCategory[] = ['timer', 'navigation', 'timeEntry', 'special']

const grouped = computed(() =>
  categories.map((cat) => ({
    category: cat,
    actions: KEYBINDING_ACTIONS.filter((a) => a.category === cat)
  }))
)
</script>

<template>
  <div class="space-y-6 py-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Click a binding to capture a new key combination. Press
        <UKbd value="Esc" size="sm" /> to cancel.
      </p>
      <UButton
        icon="i-lucide-rotate-ccw"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="store.resetToDefaults"
      >
        Reset to defaults
      </UButton>
    </div>

    <div v-for="group in grouped" :key="group.category" class="space-y-2">
      <div class="flex items-center gap-2 mb-2">
        <UIcon :name="CATEGORY_ICONS[group.category]" class="text-gray-400 shrink-0" />
        <span class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {{ CATEGORY_LABELS[group.category] }}
        </span>
      </div>

      <UCard :ui="{ body: 'p-0' }">
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="action in group.actions"
            :key="action.id"
            class="flex items-center gap-4 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ action.label }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ action.description }}
              </p>
            </div>

            <SettingsKeybindingInput
              :model-value="store.bindings[action.id]?.key ?? ''"
              @update:model-value="(k) => store.updateBinding(action.id, k)"
            />

            <USwitch
              :model-value="store.bindings[action.id]?.enabled ?? true"
              size="sm"
              @update:model-value="(v) => store.setEnabled(action.id, v)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
