<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CreateTagRequest } from '~/types'

definePageMeta({ layout: 'dashboard' })

const tagsStore = useTagsStore()
const workspacesStore = useWorkspacesStore()
const { tags, isLoading, error } = storeToRefs(tagsStore)
const toast = useToast()

const columns = [
  { id: 'name', key: 'name', label: 'Name' },
  { id: 'color', key: 'color', label: 'Color' }
]

const isCreateOpen = ref(false)
const state = reactive<CreateTagRequest>({ name: '', color: '#10b981' })

async function onSubmit() {
  if (!state.name.trim()) return

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
  state.name = ''
  state.color = '#10b981'
}

onMounted(async () => {
  await workspacesStore.fetchWorkspaces()
  await tagsStore.fetchTags()
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
        <template #color-cell="{ row }">
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full border border-black/10"
              :style="{ backgroundColor: row.original.color ?? '#6b7280' }"
            />
            <span class="text-xs font-mono text-gray-400">{{ row.original.color ?? '—' }}</span>
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
              <UIcon name="i-lucide-tag" class="text-emerald-500" />
              <h2 class="text-lg font-semibold">New Tag</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onSubmit">
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
                :disabled="!state.name.trim()"
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
