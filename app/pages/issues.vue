<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard' })

const issuesStore = useIssuesStore()
const projectsStore = useProjectsStore()
const workspacesStore = useWorkspacesStore()
const { issues, isLoading } = storeToRefs(issuesStore)
const { projects } = storeToRefs(projectsStore)
const { activeWorkspaceId } = storeToRefs(workspacesStore)

const columns = [
  { id: 'name', key: 'name', label: 'Issue Name' },
  { id: 'projectName', key: 'projectName', label: 'Project' },
  { id: 'source', key: 'source', label: 'Source' }
]

// Resolve projectId → project name for display
const issueRows = computed(() =>
  issues.value.map((issue) => ({
    ...issue,
    projectName: projects.value.find((p) => p.id === issue.projectId)?.name ?? 'Unknown',
    source: issue.isImported ? 'Integration' : 'Local'
  }))
)

onMounted(async () => {
  await workspacesStore.fetchWorkspaces()
  await Promise.all([projectsStore.fetchProjects(), issuesStore.fetchIssues()])
})

watch(activeWorkspaceId, (id) => {
  if (id) Promise.all([projectsStore.fetchProjects(), issuesStore.fetchIssues()])
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Issues</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Issues are synced from your external integrations and cannot be added, edited nor deleted
          manually
        </p>
      </div>
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
        <template #source-cell="{ row }">
          <span
            class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            :class="
              row.original.isImported
                ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            "
          >
            <UIcon
              :name="row.original.isImported ? 'i-lucide-plug' : 'i-lucide-circle-dot'"
              class="text-[10px]"
            />
            {{ row.original.source }}
          </span>
        </template>
        <template #empty>
          <div class="flex flex-col items-center py-12 text-gray-400 gap-2">
            <UIcon name="i-lucide-list-checks" class="text-4xl" />
            <p class="text-sm">No issues synced yet. Connect an integration to get started.</p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
