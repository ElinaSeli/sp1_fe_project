<script setup lang="ts">
const description = ref('')
const isRunning = ref(false)
const elapsedSeconds = ref(0)
const timerBarFocused = ref(false)

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
</script>

<template>
  <header
    class="h-16 bg-gray-900 text-gray-300 flex items-center justify-between px-4 shrink-0 shadow-lg z-20 border-b border-gray-800"
  >
    <!-- Left: Status -->
    <div class="flex items-center w-48 shrink-0">
      <div
        class="w-2 h-2 rounded-full mr-3 animate-pulse"
        :class="isRunning ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-gray-600'"
      />
      <span class="text-xs font-bold uppercase tracking-widest text-gray-400">
        {{ isRunning ? 'Tracking' : 'Idle' }}
      </span>
    </div>

    <!-- Middle: Input Bar -->
    <div
      class="flex-1 max-w-3xl flex items-center gap-2 px-3 py-1.5 mx-4 rounded-lg border transition-all duration-300"
      :class="
        timerBarFocused
          ? 'border-emerald-500/50 bg-gray-800 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-gray-700/50 bg-gray-800/40'
      "
      @focusin="timerBarFocused = true"
      @focusout="timerBarFocused = false"
    >
      <UIcon name="i-lucide-terminal" class="text-gray-500 ml-1" />
      <input
        v-model="description"
        placeholder="What are you working on?"
        class="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600"
      />

      <div class="flex items-center gap-4 px-2 border-l border-gray-700 ml-2">
        <div
          class="flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors"
        >
          <UIcon name="i-lucide-folder" class="text-gray-500 text-xs" />
          <span class="text-[11px] font-medium">Project</span>
        </div>
        <div
          class="flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors"
        >
          <UIcon name="i-lucide-tag" class="text-gray-500 text-xs" />
          <span class="text-[11px] font-medium">Tags</span>
        </div>
      </div>
    </div>

    <!-- Right: Controls -->
    <div class="flex items-center gap-6 w-64 justify-end">
      <div class="text-2xl font-mono font-medium tracking-wider text-emerald-500">
        {{ formatDuration(elapsedSeconds) }}
      </div>

      <UButton
        :icon="isRunning ? 'i-lucide-square' : 'i-lucide-play'"
        :color="isRunning ? 'error' : 'emerald'"
        size="md"
        class="min-w-[100px] justify-center font-bold"
        @click="toggleTimer"
      >
        {{ isRunning ? 'STOP' : 'START' }}
      </UButton>
    </div>
  </header>
</template>
