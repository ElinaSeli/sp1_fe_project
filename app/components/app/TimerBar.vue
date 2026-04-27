<script setup lang="ts">
const description = ref('')
const isRunning = ref(false)
const elapsedSeconds = ref(0)
const timerBarFocused = ref(false)
const descriptionInput = ref<HTMLInputElement | null>(null)

// Mock data for selectors
const projects = [
  { id: '1', label: 'Internal', color: 'emerald' },
  { id: '2', label: 'Client A', color: 'blue' },
  { id: '3', label: 'Open Source', color: 'purple' }
]
const selectedProjectId = ref<string | undefined>(undefined)

const tasks = [
  { id: '1', label: 'Development', projectId: '1' },
  { id: '2', label: 'Design', projectId: '1' },
  { id: '3', label: 'Meeting', projectId: '2' }
]
const selectedTaskId = ref<string | undefined>(undefined)

const tags = ['Engineering', 'Urgent', 'Research', 'UI/UX']
const selectedTags = ref([])

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

let interval: ReturnType<typeof setInterval> | null = null
const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(interval)
    isRunning.value = false
  } else {
    isRunning.value = true
    interval = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  }
}

// Global shortcut for focus: Alt + T
const onKeydown = (e: KeyboardEvent) => {
  if (e.altKey && e.key === 't') {
    e.preventDefault()
    descriptionInput.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header
    class="h-16 bg-gray-900 text-gray-300 flex items-center justify-between px-4 shrink-0 shadow-lg z-20 border-b border-gray-800"
  >
    <!-- Left: Status Indicator -->
    <div class="flex items-center w-32 shrink-0">
      <div
        class="w-2 h-2 rounded-full mr-3"
        :class="isRunning ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-gray-600'"
      />
      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {{ isRunning ? 'Tracking' : 'Idle' }}
      </span>
    </div>

    <!-- Middle: Input Bar (Keyboard First) -->
    <div
      class="flex-1 max-w-5xl flex items-center gap-2 px-3 py-1 mx-4 rounded-lg border transition-all duration-300"
      :class="
        timerBarFocused
          ? 'border-emerald-500/50 bg-gray-800 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-gray-800 bg-gray-800/40'
      "
      @focusin="timerBarFocused = true"
      @focusout="timerBarFocused = false"
    >
      <input
        ref="descriptionInput"
        v-model="description"
        placeholder="What are you working on? (Alt+T)"
        class="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600 h-9"
      />

      <div class="flex items-center gap-1 shrink-0 ml-2">
        <USelectMenu
          v-model="selectedProjectId"
          :items="projects"
          value-key="id"
          placeholder="Project"
          variant="ghost"
          size="xs"
          class="min-w-[120px]"
          :ui="{ trigger: 'hover:bg-gray-700/50 transition-colors border-none shadow-none' }"
        >
          <template #leading>
            <UIcon name="i-lucide-folder" class="text-gray-500" />
          </template>
        </USelectMenu>

        <USelectMenu
          v-model="selectedTaskId"
          :items="tasks.filter((t) => !selectedProjectId || t.projectId === selectedProjectId)"
          value-key="id"
          placeholder="Task"
          variant="ghost"
          size="xs"
          class="min-w-[120px]"
          :ui="{ trigger: 'hover:bg-gray-700/50 transition-colors border-none shadow-none' }"
        >
          <template #leading>
            <UIcon name="i-lucide-check-square" class="text-gray-500" />
          </template>
        </USelectMenu>

        <USelectMenu
          v-model="selectedTags"
          :items="tags"
          multiple
          placeholder="Tags"
          variant="ghost"
          size="xs"
          class="min-w-[100px]"
          :ui="{ trigger: 'hover:bg-gray-700/50 transition-colors border-none shadow-none' }"
        >
          <template #leading>
            <UIcon name="i-lucide-tag" class="text-gray-500" />
          </template>
        </USelectMenu>
      </div>
    </div>

    <!-- Right: Controls -->
    <div class="flex items-center gap-6 shrink-0">
      <div class="text-2xl font-mono font-medium tracking-wider text-emerald-500 w-32 text-right">
        {{ formatDuration(elapsedSeconds) }}
      </div>

      <UButton
        :icon="isRunning ? 'i-lucide-square' : 'i-lucide-play'"
        :color="isRunning ? 'error' : 'emerald'"
        size="md"
        class="min-w-[100px] justify-center font-bold shadow-lg"
        @click="toggleTimer"
      >
        {{ isRunning ? 'STOP' : 'START' }}
      </UButton>
    </div>
  </header>
</template>
