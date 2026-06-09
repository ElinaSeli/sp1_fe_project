<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const workspacesStore = useWorkspacesStore()
const { workspaces, activeWorkspaceId, isLoading, error } = storeToRefs(workspacesStore)
const toast = useToast()
const confirm = useConfirm()

// --- Create ---
const isCreateOpen = ref(false)
const createName = ref('')

async function onCreateSubmit() {
  if (!createName.value.trim()) return

  const result = await workspacesStore.createWorkspace({ name: createName.value.trim() })

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
  createName.value = ''
}

// --- Edit ---
// TODO: restrict to OWNER/ADMIN once membership roles are returned by the API
const isEditOpen = ref(false)
const editTarget = ref<{ id: string; name: string } | null>(null)
const editName = ref('')

function onEditOpen(ws: { id: string; name: string }) {
  editTarget.value = ws
  editName.value = ws.name
  isEditOpen.value = true
}

async function onEditSubmit() {
  if (!editTarget.value || !editName.value.trim()) return

  const result = await workspacesStore.updateWorkspace(editTarget.value.id, editName.value.trim())

  if (!result) {
    toast.add({
      title: 'Failed to rename workspace',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  toast.add({
    title: `Renamed to "${result.name}"`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
  isEditOpen.value = false
  editTarget.value = null
}

// --- Delete ---
async function onDelete(ws: { id: string; name: string }) {
  const isActive = ws.id === activeWorkspaceId.value
  const ok = await confirm({
    title: `Delete "${ws.name}"?`,
    description: isActive
      ? 'You will be switched to another workspace.'
      : 'This action cannot be undone.',
    confirmLabel: 'Delete',
    confirmColor: 'error',
    icon: 'i-lucide-trash-2'
  })
  if (!ok) return
  const success = await workspacesStore.deleteWorkspace(ws.id)
  if (success) {
    toast.add({ title: `"${ws.name}" deleted`, color: 'success', icon: 'i-lucide-check-circle' })
  } else {
    toast.add({
      title: `Cannot delete "${ws.name}"`,
      description: 'Remove all time entries from this workspace first.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
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

const onCreateNew = () => {
  isCreateOpen.value = true
}

onMounted(() => {
  window.addEventListener('app:createNew', onCreateNew)
  workspacesStore.fetchWorkspaces()
})

onUnmounted(() => {
  window.removeEventListener('app:createNew', onCreateNew)
})
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
        class="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center mb-2"
      >
        <UIcon name="i-lucide-layout-dashboard" class="text-4xl text-primary-500" />
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
            ? 'border-primary-400 dark:border-primary-600 bg-primary-50/60 dark:bg-primary-950/20 shadow-sm shadow-primary-100 dark:shadow-primary-900/30'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm'
        "
        @click="switchWorkspace(ws.id)"
      >
        <!-- Active indicator -->
        <div
          v-if="ws.id === activeWorkspaceId"
          class="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          Active
        </div>

        <!-- Icon + name -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="
              ws.id === activeWorkspaceId
                ? 'bg-primary-100 dark:bg-primary-900/50'
                : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/40'
            "
          >
            <UIcon
              name="i-lucide-layout-dashboard"
              class="transition-colors"
              :class="
                ws.id === activeWorkspaceId
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 group-hover:text-primary-500'
              "
            />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white truncate">{{ ws.name }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800"
        >
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Created {{ formatDate(ws.createdAt) }}
          </span>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              @click.stop="onEditOpen(ws)"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click.stop="onDelete(ws)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-layout-dashboard" class="text-primary-500" />
              <h2 class="text-lg font-semibold">New Workspace</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onCreateSubmit">
            <UFormField label="Workspace Name" name="name" required>
              <UInput
                v-model="createName"
                placeholder="e.g. My Team, Client Portal"
                autofocus
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
                :disabled="!createName.trim()"
              >
                Create Workspace
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-pencil" class="text-primary-500" />
              <h2 class="text-lg font-semibold">Rename Workspace</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onEditSubmit">
            <UFormField label="Workspace Name" name="name" required>
              <UInput
                v-model="editName"
                placeholder="e.g. My Team, Client Portal"
                autofocus
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton type="button" color="neutral" variant="ghost" @click="isEditOpen = false">
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isLoading"
                :disabled="!editName.trim() || editName.trim() === editTarget?.name"
              >
                Save
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
