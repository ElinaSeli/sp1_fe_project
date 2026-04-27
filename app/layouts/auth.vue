<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-300"
  >
    <!-- Optional: Add a logo or app name here -->
    <div class="mb-8 flex flex-col items-center">
      <div
        class="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-primary-500/20"
      >
        <UIcon name="i-lucide-clock" class="text-white text-2xl" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        SP1 Time Tracking
      </h1>
    </div>

    <div class="w-full max-w-sm">
      <slot />
    </div>

    <footer class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      &copy; {{ new Date().getFullYear() }} SP1 Team. Fast, keyboard-first tracking.
    </footer>
  </div>
</template>

<style scoped>
/* Ensure smooth transitions for dark mode */
.bg-gray-50,
.bg-gray-950 {
  transition: background-color 0.3s ease;
}
</style>
