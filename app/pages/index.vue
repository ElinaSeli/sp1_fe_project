<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

// Mock entries
const entries = [
  {
    id: '1',
    description: 'Design System Overhaul',
    project: 'Internal',
    duration: 7200,
    createdAt: '2026-04-27T10:00:00Z'
  },
  {
    id: '2',
    description: 'Fixing Sidebar bugs',
    project: 'Internal',
    duration: 3600,
    createdAt: '2026-04-27T11:00:00Z'
  },
  {
    id: '3',
    description: 'Client Meeting',
    project: 'Client A',
    duration: 1800,
    createdAt: '2026-04-26T14:00:00Z'
  },
  {
    id: '4',
    description: 'CI/CD Pipeline Fix',
    project: 'Open Source',
    duration: 5400,
    createdAt: '2026-04-26T09:00:00Z'
  }
]

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// Group entries by date
const groupedEntries = computed(() => {
  const groups: Record<string, { date: string; items: typeof entries; total: number }> = {}

  entries.forEach((entry) => {
    const dateKey = entry.createdAt.split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = { date: dateKey, items: [], total: 0 }
    }
    groups[dateKey].items.push(entry)
    groups[dateKey].total += entry.duration
  })

  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <div v-for="group in groupedEntries" :key="group.date" class="space-y-3">
      <!-- Date Header -->
      <div class="flex items-center justify-between px-2">
        <h3 class="text-xs font-bold uppercase tracking-widest text-gray-500">
          {{ formatDate(group.date) }}
        </h3>
        <span class="text-xs font-mono text-gray-400">
          Total: <span class="text-emerald-500 font-bold">{{ formatDuration(group.total) }}</span>
        </span>
      </div>

      <!-- Entries Card -->
      <div
        class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm"
      >
        <div
          v-for="(entry, index) in group.items"
          :key="entry.id"
          class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
          :class="{ 'border-t border-gray-100 dark:border-gray-800': index !== 0 }"
        >
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <div class="w-1 h-8 rounded-full bg-emerald-500" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ entry.description }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded"
                >
                  {{ entry.project }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <span class="text-sm font-mono font-medium text-gray-600 dark:text-gray-400">
              {{ formatDuration(entry.duration) }}
            </span>
            <UButton
              icon="i-lucide-play"
              variant="ghost"
              color="neutral"
              size="xs"
              class="hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
