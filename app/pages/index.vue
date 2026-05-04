<script setup lang="ts">
import type { TimeEntry } from '~/types'

definePageMeta({
  layout: 'dashboard'
})

const timerStore = useTimerStore()
const projectsStore = useProjectsStore()
const issuesStore = useIssuesStore()
const tagsStore = useTagsStore()
const workspacesStore = useWorkspacesStore()
const toast = useToast()

const dialogOpen = ref(false)
const editingEntry = ref<TimeEntry | null>(null)

function openCreate() {
  editingEntry.value = null
  dialogOpen.value = true
}

function openEdit(id: string) {
  const raw = timerStore.rawEntries.find((e) => e.id === id)
  if (!raw) return
  editingEntry.value = raw
  dialogOpen.value = true
}

function onSaved(_entry: TimeEntry) {
  toast.add({ title: editingEntry.value ? 'Entry updated' : 'Entry created', color: 'success' })
}

async function deleteEntry(id: string) {
  if (confirm('Are you sure you want to delete this time entry?')) {
    const success = await timerStore.deleteEntry(id)
    if (success) {
      toast.add({ title: 'Entry deleted', color: 'success' })
    } else {
      toast.add({ title: 'Failed to delete entry', color: 'error' })
    }
  }
}

const onOpenNewTimeEntry = () => openCreate()
const onCreateNew = () => openCreate()
const onEditLastTimeEntry = () => {
  const last = timerStore.entries[0]
  if (last) openEdit(last.id)
}

onMounted(async () => {
  window.addEventListener('app:openNewTimeEntry', onOpenNewTimeEntry)
  window.addEventListener('app:createNew', onCreateNew)
  window.addEventListener('app:editLastTimeEntry', onEditLastTimeEntry)

  const wsId = workspacesStore.activeWorkspaceId
  if (wsId) {
    await Promise.all([
      timerStore.fetchEntries(),
      projectsStore.fetchProjects(),
      issuesStore.fetchIssues(),
      tagsStore.fetchTags()
    ])
  }
})

onUnmounted(() => {
  window.removeEventListener('app:openNewTimeEntry', onOpenNewTimeEntry)
  window.removeEventListener('app:createNew', onCreateNew)
  window.removeEventListener('app:editLastTimeEntry', onEditLastTimeEntry)
})

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

const groupedEntries = computed(() => {
  const groups: Record<string, { date: string; items: typeof timerStore.entries; total: number }> =
    {}

  timerStore.entries.forEach((entry) => {
    const dateKey = entry.timeStart.split('T')[0]!
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
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Time Entries</h2>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate"> New Entry </UButton>
    </div>

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
          tabindex="0"
          class="flex items-center justify-between p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500/50 outline-none"
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
                  {{ entry.projectId || 'No Project' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm font-mono font-medium text-gray-600 dark:text-gray-400 mr-4">
              {{ formatDuration(entry.duration) }}
            </span>
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              class="hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600"
              @click="openEdit(entry.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              class="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
              @click="deleteEntry(entry.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="groupedEntries.length === 0"
      class="flex flex-col items-center py-16 text-gray-400 gap-3"
    >
      <UIcon name="i-lucide-clock" class="text-5xl" />
      <p class="text-sm">No time entries yet. Create your first one!</p>
      <UButton icon="i-lucide-plus" color="primary" variant="soft" @click="openCreate">
        New Entry
      </UButton>
    </div>

    <AppTimeEntryDialog v-model:open="dialogOpen" :entry="editingEntry" @saved="onSaved" />
  </div>
</template>
