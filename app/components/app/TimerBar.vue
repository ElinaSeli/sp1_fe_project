<script setup lang="ts">
const timerStore = useTimerStore()
const description = computed({
  get: () => timerStore.draftEntry.description,
  set: (v) => {
    timerStore.draftEntry.description = v
  }
})
const selectedProjectId = computed({
  get: () => timerStore.draftEntry.projectId || undefined,
  set: (v) => {
    timerStore.draftEntry.projectId = v || null
  }
})
const selectedTaskId = computed({
  get: () => timerStore.draftEntry.taskId || undefined,
  set: (v) => {
    timerStore.draftEntry.taskId = v || null
  }
})
const selectedTags = computed({
  get: () => timerStore.draftEntry.tagIds as string[],
  set: (v) => {
    timerStore.draftEntry.tagIds = v
  }
})

const isRunning = computed(() => timerStore.isRunning)
const isStarting = computed(() => timerStore.isStarting)
const isStopping = computed(() => timerStore.isStopping)
const elapsedSeconds = ref(0)
const timerBarFocused = ref(false)
const descriptionInput = ref<HTMLInputElement | null>(null)
const startButton = ref<{ $el?: HTMLElement; focus?: () => void } | null>(null)

// Mock data for selectors
const projects = [
  { id: '1', label: 'Internal', color: 'emerald' },
  { id: '2', label: 'Client A', color: 'blue' },
  { id: '3', label: 'Open Source', color: 'purple' }
]

const tasks = [
  { id: '1', label: 'Development', projectId: '1' },
  { id: '2', label: 'Design', projectId: '1' },
  { id: '3', label: 'Meeting', projectId: '2' }
]

const tags = ['Engineering', 'Urgent', 'Research', 'UI/UX']

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

// Calculate elapsed time from startTimestamp
let tickerInterval: ReturnType<typeof setInterval> | null = null
watch(
  () => timerStore.isRunning,
  (running) => {
    if (running && timerStore.startTimestamp) {
      tickerInterval = setInterval(() => {
        elapsedSeconds.value = Math.floor((Date.now() - timerStore.startTimestamp!) / 1000)
      }, 1000)
    } else {
      if (tickerInterval) clearInterval(tickerInterval)
      elapsedSeconds.value = 0
    }
  },
  { immediate: true }
)

// Global shortcuts: Alt+T and /
const onKeydown = (e: KeyboardEvent) => {
  const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)

  // Alt+T or / (if not in an input)
  if ((e.altKey && e.key === 't') || (e.key === '/' && !isInput)) {
    e.preventDefault()
    descriptionInput.value?.focus()
  }
}

const startTracking = async () => {
  try {
    await timerStore.startTimer()
  } catch (e: unknown) {
    console.error('Failed to start timer:', e)
  }
}

const stopTracking = async () => {
  try {
    await timerStore.stopTimer()
  } catch (e: unknown) {
    console.error('Failed to stop timer:', e)
  }
}

onMounted(() => {
  timerStore.fetchActiveTimer()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (tickerInterval) clearInterval(tickerInterval)
})
</script>

<template>
  <header
    class="h-16 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 flex items-center justify-between px-4 shrink-0 shadow-sm z-20 border-b border-gray-200 dark:border-gray-800"
  >
    <!-- Left: Status Indicator -->
    <div class="flex items-center w-32 shrink-0">
      <div
        class="w-2 h-2 rounded-full mr-3"
        :class="
          isRunning
            ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'
            : 'bg-gray-300 dark:bg-gray-600'
        "
      />
      <span
        class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
      >
        {{ isRunning ? 'Tracking' : 'Idle' }}
      </span>
    </div>

    <!-- Middle: Input Bar (Keyboard First) -->
    <div
      class="flex-1 min-w-0 max-w-5xl flex items-center gap-2 px-3 py-1 mx-2 sm:mx-4 rounded-lg border transition-all duration-300"
      :class="
        timerBarFocused
          ? 'border-emerald-500/50 bg-white dark:bg-gray-800 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
      "
      @focusin="timerBarFocused = true"
      @focusout="timerBarFocused = false"
    >
      <input
        ref="descriptionInput"
        v-model="description"
        placeholder="What are you working on? (Alt+T or /)"
        class="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 h-9 truncate"
      />

      <div class="flex-shrink min-w-0 hidden lg:flex items-center space-x-2">
        <USelectMenu
          v-model="selectedProjectId"
          :items="projects"
          value-key="id"
          placeholder="Project"
          size="xs"
        >
          <template #default="{ open }">
            <UButton
              variant="ghost"
              color="gray"
              icon="i-lucide-folder"
              :label="projects.find((p) => p.id === selectedProjectId)?.label || 'Project'"
              class="max-w-[120px] truncate"
              @click="open"
            />
          </template>
        </USelectMenu>

        <USelectMenu
          v-model="selectedTaskId"
          :items="tasks.filter((t) => !selectedProjectId || t.projectId === selectedProjectId)"
          value-key="id"
          placeholder="Task"
          size="xs"
        >
          <template #default="{ open }">
            <UButton
              variant="ghost"
              color="gray"
              icon="i-lucide-check-square"
              :label="tasks.find((t) => t.id === selectedTaskId)?.label || 'Task'"
              class="max-w-[120px] truncate"
              @click="open"
            />
          </template>
        </USelectMenu>

        <USelectMenu v-model="selectedTags" :items="tags" placeholder="Tags" size="xs">
          <template #default="{ open }">
            <UButton
              variant="ghost"
              color="gray"
              icon="i-lucide-tag"
              :label="selectedTags.length ? selectedTags.join(', ') : 'Tags'"
              class="max-w-[120px] truncate"
              @click="open"
            />
          </template>
        </USelectMenu>
      </div>
    </div>

    <!-- Right: Controls -->
    <div class="flex items-center gap-2 sm:gap-6 shrink-0">
      <div
        class="text-xl sm:text-2xl font-mono font-medium tracking-wider text-emerald-500 w-20 sm:w-32 text-right"
      >
        {{ formatDuration(elapsedSeconds) }}
      </div>

      <UButton
        ref="startButton"
        :icon="isRunning ? 'i-lucide-square' : 'i-lucide-play'"
        :color="isRunning ? 'error' : 'emerald'"
        :loading="isStarting || isStopping"
        size="md"
        class="min-w-[80px] sm:min-w-[100px] justify-center font-bold shadow-lg"
        @click="isRunning ? stopTracking() : startTracking()"
      >
        {{ isRunning ? 'STOP' : 'START' }}
      </UButton>
    </div>
  </header>
</template>
