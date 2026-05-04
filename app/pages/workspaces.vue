<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const workspacesStore = useWorkspacesStore()
const { workspaces, activeWorkspaceId, isLoading, error } = storeToRefs(workspacesStore)
const toast = useToast()

// --- Create ---
const isCreateOpen = ref(false)
const createState = reactive<{ name: string; description: string }>({ name: '', description: '' })

async function onCreateSubmit() {
  if (!createState.name.trim()) return

  const result = await workspacesStore.createWorkspace({
    name: createState.name.trim(),
    description: createState.description?.trim() || null
  })

  if (!result) {
    toast.add({
      title: 'Failed to create workspace',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  toast.add({
    title: `"${result.name}" created`,
    description: 'You have been switched to the new workspace.',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
  isCreateOpen.value = false
  createState.name = ''
  createState.description = ''
}

// --- Switch ---
function switchWorkspace(id: string) {
  if (id === activeWorkspaceId.value) return
  workspacesStore.setActiveWorkspace(id)
  const ws = workspaces.value.find((w) => w.id === id)
  toast.add({
    title: `Switched to "${ws?.name}"`,
    color: 'success',
    icon: 'i-lucide-layout-dashboard'
  })
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => workspacesStore.fetchWorkspaces())
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Workspaces</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Switch between workspaces or create a new one
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="isCreateOpen = true">
        New Workspace
      </UButton>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading && workspaces.length === 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="i in 3"
        :key="i"
        class="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error && workspaces.length === 0"
      class="flex flex-col items-center py-16 text-center gap-3"
    >
      <UIcon name="i-lucide-wifi-off" class="text-4xl text-red-400" />
      <p class="text-sm text-red-500">{{ error }}</p>
      <UButton variant="soft" color="neutral" size="sm" @click="workspacesStore.fetchWorkspaces()">
        Retry
      </UButton>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!isLoading && workspaces.length === 0"
      class="flex flex-col items-center py-20 text-center gap-4"
    >
      <div
        class="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-2"
      >
        <UIcon name="i-lucide-layout-dashboard" class="text-4xl text-emerald-500" />
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">No workspaces yet</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Workspaces help you organize projects and time entries by team or client. Create your first
        one to get started.
      </p>
      <UButton icon="i-lucide-plus" color="primary" @click="isCreateOpen = true">
        Create Workspace
      </UButton>
    </div>

    <!-- Workspace grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="ws in workspaces"
        :key="ws.id"
        class="relative rounded-xl border transition-all duration-200 p-5 flex flex-col gap-3 cursor-pointer group"
        :class="
          ws.id === activeWorkspaceId
            ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/30'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm'
        "
        @click="switchWorkspace(ws.id)"
      >
        <!-- Active indicator -->
        <div
          v-if="ws.id === activeWorkspaceId"
          class="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </div>

        <!-- Icon + name -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="
              ws.id === activeWorkspaceId
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40'
            "
          >
            <UIcon
              name="i-lucide-layout-dashboard"
              class="transition-colors"
              :class="
                ws.id === activeWorkspaceId
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 group-hover:text-emerald-500'
              "
            />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white truncate">{{ ws.name }}</p>
            <p v-if="ws.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ ws.description }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800"
        >
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Created {{ formatDate(ws.createdAt) }}
          </span>
          <UButton
            v-if="ws.id !== activeWorkspaceId"
            size="xs"
            color="primary"
            variant="soft"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="switchWorkspace(ws.id)"
          >
            Switch
          </UButton>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-layout-dashboard" class="text-emerald-500" />
              <h2 class="text-lg font-semibold">New Workspace</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onCreateSubmit">
            <UFormField label="Workspace Name" name="name" required>
              <UInput
                v-model="createState.name"
                placeholder="e.g. My Team, Client Portal"
                autofocus
                class="w-full"
              />
            </UFormField>

            <UFormField label="Description" name="description">
              <UInput
                v-model="createState.description"
                placeholder="Optional — what is this workspace for?"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton type="button" color="neutral" variant="ghost" @click="isCreateOpen = false">
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isLoading"
                :disabled="!createState.name.trim()"
              >
                Create Workspace
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
