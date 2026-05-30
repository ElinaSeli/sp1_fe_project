<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CreateTagRequest } from '~/types'

definePageMeta({ layout: 'dashboard' })

const tagsStore = useTagsStore()
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const { tags, isLoading, error } = storeToRefs(tagsStore)
const { activeWorkspaceId } = storeToRefs(workspacesStore)
const { projects } = storeToRefs(projectsStore)
const toast = useToast()
const confirm = useConfirm()

const columns = [
  { id: 'name', key: 'name', label: 'Name' },
  { id: 'projectId', key: 'projectId', label: 'Project' },
  { id: 'color', key: 'color', label: 'Color' },
  { id: 'actions', key: 'actions' }
]

const isCreateOpen = ref(false)
const state = reactive<CreateTagRequest>({ projectId: '', name: '', color: '#10b981' })

async function onSubmit() {
  if (!state.name.trim() || !state.projectId) return

  const result = await tagsStore.createTag({ ...state })
  if (!result) {
    toast.add({
      title: 'Failed to create tag',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error'
    })
    return
  }
  isCreateOpen.value = false
  state.projectId = ''
  state.name = ''
  state.color = '#10b981'
}

const onCreateNew = () => {
  isCreateOpen.value = true
}

async function onDeleteTag(tag: (typeof tags.value)[0]) {
  const isConfirmed = await confirm({
    title: 'Delete Tag',
    description: `Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    confirmColor: 'error'
  })

  if (!isConfirmed) return

  if (!tag.projectId) {
    toast.add({
      title: 'Error',
      description: 'Cannot delete tag: missing project ID',
      color: 'error'
    })
    return
  }

  const success = await tagsStore.deleteTag(tag.projectId, tag.id)
  if (success) {
    toast.add({ title: 'Tag deleted successfully', color: 'primary' })
  } else {
    toast.add({
      title: 'Failed to delete tag',
      description: error.value ?? 'Unknown error',
      color: 'error'
    })
  }
}

onMounted(async () => {
  window.addEventListener('app:createNew', onCreateNew)
  await workspacesStore.fetchWorkspaces()
  await projectsStore.fetchProjects()
  await tagsStore.fetchTags()
})

onUnmounted(() => {
  window.removeEventListener('app:createNew', onCreateNew)
})

watch(activeWorkspaceId, (id) => {
  if (id) {
    projectsStore.fetchProjects()
    tagsStore.fetchTags()
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Tags</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Organise time entries with tags</p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="isCreateOpen = true"> New Tag </UButton>
    </div>

    <!-- Table -->
    <UCard>
      <UTable :columns="columns" :data="tags" :loading="isLoading">
        <template #name-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.original.name }}</span>
        </template>
        <template #projectId-cell="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ projects.find((p) => p.id === row.original.projectId)?.name ?? '—' }}
          </span>
        </template>
        <template #color-cell="{ row }">
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full border border-black/10"
              :style="{ backgroundColor: row.original.color ?? '#6b7280' }"
            />
            <span class="text-xs font-mono text-gray-400">{{ row.original.color ?? '—' }}</span>
          </div>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="onDeleteTag(row.original)"
            />
          </div>
        </template>
        <template #empty>
          <div class="flex flex-col items-center py-12 text-gray-400 gap-2">
            <UIcon name="i-lucide-tag" class="text-4xl" />
            <p class="text-sm">No tags yet. Create your first one!</p>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-tag" class="text-primary-500" />
              <h2 class="text-lg font-semibold">New Tag</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onSubmit">
            <UFormField label="Project" name="projectId" required>
              <USelectMenu
                v-model="state.projectId"
                :items="projects"
                value-key="id"
                label-key="name"
                placeholder="Select project"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Tag Name" name="name" required>
              <UInput
                v-model="state.name"
                placeholder="e.g. Engineering, Urgent, UI/UX"
                autofocus
                class="w-full"
              />
            </UFormField>

            <UFormField label="Color" name="color">
              <div class="flex items-center gap-3">
                <input
                  v-model="state.color"
                  type="color"
                  class="w-10 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent p-0.5"
                />
                <span class="text-sm font-mono text-gray-500">{{ state.color }}</span>
              </div>
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton type="button" color="neutral" variant="ghost" @click="isCreateOpen = false">
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isLoading"
                :disabled="!state.name.trim() || !state.projectId"
              >
                Create Tag
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
