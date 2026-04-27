<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-12 px-4">
    <UCard
      class="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-dashed border-2 border-gray-200 dark:border-gray-800"
    >
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-lucide-construction" class="text-6xl text-emerald-500 mb-6 animate-pulse" />
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
          Coming Soon
        </h1>
        <p class="text-gray-500 dark:text-gray-400 max-w-md">
          We're working hard to bring the
          <span class="text-emerald-500 font-bold uppercase">integrations</span> module to life.
          Stay tuned!
        </p>
      </div>
    </UCard>
  </div>
</template>
