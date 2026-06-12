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

interface DeduplicatedTag {
  id: string
  name: string
  color: string
  associatedProjects: { id: string; name: string }[]
  tags: { id: string; projectId: string }[]
}

const deduplicatedTags = computed<DeduplicatedTag[]>(() => {
  const all = tags.value || []
  const groups = new Map<string, typeof all>()
  for (const t of all) {
    if (!groups.has(t.name)) {
      groups.set(t.name, [])
    }
    groups.get(t.name)!.push(t)
  }

  const result: DeduplicatedTag[] = []
  for (const [name, list] of groups.entries()) {
    const first = list[0]!
    const associatedProjects = list
      .map((t) => projects.value.find((p) => p.id === t.projectId))
      .filter(Boolean) as typeof projects.value

    result.push({
      id: name,
      name,
      color: first.color || '#6b7280',
      associatedProjects,
      tags: list.map((t) => ({ id: t.id, projectId: t.projectId }))
    })
  }
  return result
})

const columns = [
  { id: 'name', key: 'name', label: 'Name' },
  { id: 'projects', key: 'projects', label: 'Projects' },
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

async function onDeleteTag(row: DeduplicatedTag) {
  const isConfirmed = await confirm({
    title: 'Delete Tag',
    description: `Are you sure you want to delete the tag "${row.name}"? This will delete it from all associated projects.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    confirmColor: 'error'
  })

  if (!isConfirmed) return

  let successCount = 0
  for (const t of row.tags) {
    const success = await tagsStore.deleteTag(t.projectId, t.id)
    if (success) {
      successCount++
    }
  }

  if (successCount === row.tags.length) {
    toast.add({ title: 'Tag deleted successfully', color: 'primary' })
  } else if (successCount > 0) {
    toast.add({
      title: 'Partial success',
      description: `Deleted ${successCount} of ${row.tags.length} tag instances.`,
      color: 'warning'
    })
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
      <UTable :columns="columns" :data="deduplicatedTags" :loading="isLoading">
        <template #name-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.original.name }}</span>
        </template>
        <template #projects-cell="{ row }">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span v-if="row.original.associatedProjects.length === 0" class="text-sm text-gray-400"
              >—</span
            >
            <span
              v-else-if="row.original.associatedProjects.length === 1"
              class="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded animate-in fade-in zoom-in-95 duration-200"
            >
              {{ row.original.associatedProjects[0]?.name }}
            </span>
            <template v-else>
              <span
                class="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded animate-in fade-in zoom-in-95 duration-200"
              >
                {{ row.original.associatedProjects[0]?.name }}
              </span>
              <UPopover>
                <UButton
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="text-[10px] py-0.5 px-1.5 font-bold cursor-pointer transition-all duration-200 hover:bg-primary-100 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 animate-in fade-in zoom-in-95 duration-200"
                >
                  +{{ row.original.associatedProjects.length - 1 }} more
                </UButton>
                <template #content>
                  <div class="p-3 max-w-xs space-y-2">
                    <div
                      class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                    >
                      Associated Projects
                    </div>
                    <div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      <span
                        v-for="p in row.original.associatedProjects"
                        :key="p.id"
                        class="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded animate-in fade-in zoom-in-95 duration-200"
                      >
                        {{ p.name }}
                      </span>
                    </div>
                  </div>
                </template>
              </UPopover>
            </template>
          </div>
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
                type="button"
                color="primary"
                :loading="isLoading"
                :disabled="!state.name.trim() || !state.projectId"
                @click="onSubmit"
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
