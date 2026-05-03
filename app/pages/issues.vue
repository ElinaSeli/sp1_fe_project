<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const issuesStore = useIssuesStore()
const projectsStore = useProjectsStore()
const workspacesStore = useWorkspacesStore()
const { issues, isLoading, error } = storeToRefs(issuesStore)
const { projects } = storeToRefs(projectsStore)
const toast = useToast()

const columns = [
  { id: 'name', key: 'name', label: 'Issue Name' },
  { id: 'projectName', key: 'projectName', label: 'Project' }
]

// Resolve projectId → project name for display
const issueRows = computed(() =>
  issues.value.map((issue) => ({
    ...issue,
    projectName: projects.value.find((p) => p.id === issue.projectId)?.name ?? 'Unknown'
  }))
)

const isCreateOpen = ref(false)
const state = reactive({ name: '', projectId: '' })

async function onSubmit() {
  if (!state.name.trim() || !state.projectId) return

  const result = await issuesStore.createIssue({
    name: state.name.trim(),
    projectId: state.projectId
  })
  if (!result) {
    toast.add({
      title: 'Failed to create issue',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error'
    })
    return
  }
  isCreateOpen.value = false
  state.name = ''
  state.projectId = ''
}

onMounted(async () => {
  await workspacesStore.fetchWorkspaces()
  await Promise.all([projectsStore.fetchProjects(), issuesStore.fetchIssues()])
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Issues</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track tasks and issues across your projects
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="isCreateOpen = true">
        New Issue
      </UButton>
    </div>

    <!-- Table -->
    <UCard>
      <UTable :columns="columns" :data="issueRows" :loading="isLoading">
        <template #name-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">{{ row.original.name }}</span>
        </template>
        <template #projectName-cell="{ row }">
          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
          >
            <UIcon name="i-lucide-folder" class="text-[10px]" />
            {{ row.original.projectName }}
          </span>
        </template>
        <template #empty>
          <div class="flex flex-col items-center py-12 text-gray-400 gap-2">
            <UIcon name="i-lucide-list-checks" class="text-4xl" />
            <p class="text-sm">No issues yet. Create your first one!</p>
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
              <UIcon name="i-lucide-list-plus" class="text-emerald-500" />
              <h2 class="text-lg font-semibold">New Issue</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onSubmit">
            <UFormField label="Project" name="projectId" required>
              <USelectMenu
                v-model="state.projectId"
                :items="projects.map((p) => ({ label: p.name, value: p.id }))"
                value-key="value"
                label-key="label"
                placeholder="Select a project"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Issue Name" name="name" required>
              <UInput
                v-model="state.name"
                placeholder="e.g. Fix login bug, Add dark mode"
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
                :disabled="!state.name.trim() || !state.projectId"
              >
                Create Issue
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
