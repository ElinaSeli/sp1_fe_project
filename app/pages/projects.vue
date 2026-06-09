<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CreateProjectRequest, Project } from '~/types'

definePageMeta({ layout: 'dashboard' })

const projectsStore = useProjectsStore()
const workspacesStore = useWorkspacesStore()
const { projects, isLoading, error } = storeToRefs(projectsStore)
const { activeWorkspaceId } = storeToRefs(workspacesStore)
const toast = useToast()
const confirm = useConfirm()

const columns = [
  { id: 'name', key: 'name', label: 'Name' },
  { id: 'color', key: 'color', label: 'Color' },
  { id: 'source', key: 'source', label: 'Source' },
  { id: 'actions', key: 'actions', label: '' }
]

// --- Create ---
const isCreateOpen = ref(false)
const createState = reactive<CreateProjectRequest>({ name: '', color: '#10b981' })

async function onCreateSubmit() {
  if (!createState.name.trim()) return

  const result = await projectsStore.createProject({ ...createState })
  if (!result) {
    toast.add({
      title: 'Failed to create project',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error'
    })
    return
  }
  toast.add({ title: 'Project created', color: 'success' })
  isCreateOpen.value = false
  createState.name = ''
  createState.color = '#10b981'
}

// --- Edit ---
const isEditOpen = ref(false)
const editingProject = ref<Project | null>(null)
const editState = reactive<CreateProjectRequest>({ name: '', color: '#10b981' })

function openEdit(project: Project) {
  editingProject.value = project
  editState.name = project.name
  editState.color = project.color ?? '#10b981'
  isEditOpen.value = true
}

async function onEditSubmit() {
  if (!editingProject.value || !editState.name.trim()) return

  const result = await projectsStore.updateProject(editingProject.value.id, { ...editState })
  if (!result) {
    toast.add({
      title: 'Failed to update project',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error'
    })
    return
  }
  toast.add({ title: 'Project updated', color: 'success' })
  isEditOpen.value = false
  editingProject.value = null
}

// --- Delete ---
async function onDelete(project: Project) {
  const confirmed = await confirm({
    title: `Delete "${project.name}"?`,
    description: 'This will remove the project permanently.',
    confirmLabel: 'Delete',
    confirmColor: 'error',
    icon: 'i-lucide-trash-2'
  })
  if (!confirmed) return
  const ok = await projectsStore.deleteProject(project.id)
  if (!ok) {
    toast.add({
      title: 'Failed to delete project',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error'
    })
    return
  }
  toast.add({ title: `"${project.name}" deleted`, color: 'success' })
}

const onCreateNew = () => {
  isCreateOpen.value = true
}

onMounted(async () => {
  window.addEventListener('app:createNew', onCreateNew)
  await workspacesStore.fetchWorkspaces()
  await projectsStore.fetchProjects()
})

onUnmounted(() => {
  window.removeEventListener('app:createNew', onCreateNew)
})

watch(activeWorkspaceId, (id) => {
  if (id) projectsStore.fetchProjects()
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Projects</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage local projects. Imported projects are read-only.
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="isCreateOpen = true">
        New Project
      </UButton>
    </div>

    <!-- Table -->
    <UCard>
      <UTable :columns="columns" :data="projects" :loading="isLoading">
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
        <template #source-cell="{ row }">
          <span
            class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            :class="
              row.original.isExternal
                ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                : 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
            "
          >
            <UIcon
              :name="row.original.isExternal ? 'i-lucide-plug' : 'i-lucide-circle-dot'"
              class="text-[10px]"
            />
            {{ row.original.isExternal ? 'Integration' : 'Local' }}
          </span>
        </template>
        <template #actions-cell="{ row }">
          <div v-if="!row.original.isExternal" class="flex items-center justify-end gap-1">
            <UButton
              icon="i-lucide-pencil"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="openEdit(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              @click="onDelete(row.original)"
            />
          </div>
        </template>
        <template #empty>
          <div class="flex flex-col items-center py-12 text-gray-400 gap-2">
            <UIcon name="i-lucide-folder-open" class="text-4xl" />
            <p class="text-sm">No projects yet. Create your first one!</p>
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
              <UIcon name="i-lucide-folder-plus" class="text-primary-500" />
              <h2 class="text-lg font-semibold">New Project</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onCreateSubmit">
            <UFormField label="Project Name" name="name" required>
              <UInput
                v-model="createState.name"
                placeholder="e.g. Mobile App, Client Portal"
                autofocus
                class="w-full"
              />
            </UFormField>

            <UFormField label="Color" name="color">
              <div class="flex items-center gap-3">
                <input
                  v-model="createState.color"
                  type="color"
                  class="w-10 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent p-0.5"
                />
                <span class="text-sm font-mono text-gray-500">{{ createState.color }}</span>
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
                :disabled="!createState.name.trim()"
                @click="onCreateSubmit"
              >
                Create Project
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
              <UIcon name="i-lucide-pencil" class="text-amber-500" />
              <h2 class="text-lg font-semibold">Edit Project</h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onEditSubmit">
            <UFormField label="Project Name" name="name" required>
              <UInput
                v-model="editState.name"
                placeholder="e.g. Mobile App, Client Portal"
                autofocus
                class="w-full"
              />
            </UFormField>

            <UFormField label="Color" name="color">
              <div class="flex items-center gap-3">
                <input
                  v-model="editState.color"
                  type="color"
                  class="w-10 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent p-0.5"
                />
                <span class="text-sm font-mono text-gray-500">{{ editState.color }}</span>
              </div>
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton type="button" color="neutral" variant="ghost" @click="isEditOpen = false">
                Cancel
              </UButton>
              <UButton
                type="button"
                color="primary"
                :loading="isLoading"
                :disabled="!editState.name.trim()"
                @click="onEditSubmit"
              >
                Save Changes
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
