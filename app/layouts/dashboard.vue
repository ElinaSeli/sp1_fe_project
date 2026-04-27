<script setup lang="ts">
const isMini = ref(false)

const toggleMini = () => {
  isMini.value = !isMini.value
}

// Global shortcut for toggling sidebar: [
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
    toggleMini()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-screen w-full bg-white dark:bg-gray-950 overflow-hidden font-sans">
    <!-- Sidebar -->
    <AppSideNav :is-mini="isMini" @toggle="toggleMini" />

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Timer Bar -->
      <AppTimerBar />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-8 relative bg-gray-50/50 dark:bg-gray-900/20">
        <slot />
      </main>
    </div>
  </div>
</template>
