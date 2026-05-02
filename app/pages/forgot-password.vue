<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})
</script>

<template>
  <UCard class="shadow-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-center text-gray-900 dark:text-white">
        Reset password
      </h1>
    </template>

    <div class="flex flex-col items-center gap-3 py-4 text-center">
      <UIcon name="i-lucide-construction" class="text-4xl text-gray-400 dark:text-gray-500" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Password reset is not yet implemented.</p>
    </div>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        <NuxtLink to="/login" class="text-primary-500 hover:underline font-medium">
          Back to sign in
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
