<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store'
import { useWorkspacesStore } from '~/stores/workspaces.store'

definePageMeta({
  layout: 'dashboard'
})

const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()

// We'll initialize workspaces on mount if they haven't been loaded yet
onMounted(async () => {
  await workspacesStore.fetchWorkspaces()
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {{ authStore.currentUser?.firstName || authStore.currentUser?.username }}!
        </h1>
        <p v-if="workspacesStore.activeWorkspace" class="text-gray-500 dark:text-gray-400 mt-1">
          You are currently in the
          <span class="font-semibold text-primary-500">{{
            workspacesStore.activeWorkspace.name
          }}</span>
          workspace.
        </p>
      </div>

      <div class="flex gap-3">
        <UButton icon="i-lucide-plus" color="primary">New Project</UButton>
      </div>
    </div>

    <!-- Active Tracker Placeholder -->
    <UCard class="border-primary-500 border-l-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 flex-1">
          <UIcon name="i-lucide-play-circle" class="text-3xl text-primary-500" />
          <span class="text-gray-400 italic"
            >What are you working on right now? (Press '/' to start)</span
          >
        </div>
        <UButton color="neutral" variant="ghost" icon="i-lucide-more-horizontal" />
      </div>
    </UCard>

    <!-- Empty State for Time Entries -->
    <div
      class="py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl"
    >
      <UIcon name="i-lucide-history" class="text-4xl text-gray-300 dark:text-gray-700 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">No time entries yet</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
        Start the timer above to log your first activity in this workspace.
      </p>
    </div>
  </div>
</template>
