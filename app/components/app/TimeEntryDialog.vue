<script setup lang="ts">
import type { TimeEntry, CreateTimeEntryRequest, UpdateTimeEntryRequest } from '~/types'

const props = defineProps<{
  open: boolean
  entry?: TimeEntry | null
  initialTimeStart?: Date | null
  initialTimeEnd?: Date | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  saved: [TimeEntry]
  deleted: [string]
}>()

const timerStore = useTimerStore()
const projectsStore = useProjectsStore()
const tagsStore = useTagsStore()
const workspacesStore = useWorkspacesStore()
const toast = useToast()
const confirm = useConfirm()

const isEdit = computed(() => Boolean(props.entry))
const isLoading = ref(false)
const isInitializing = ref(false)

const projects = computed(() => projectsStore.projects)
const filteredTags = computed(() => {
  const all = tagsStore.tags || []
  let filtered = all
  if (form.projectId) {
    filtered = all.filter((t) => t.projectId === form.projectId)
  }
  const uniqueNames = new Set<string>()
  const result: typeof all = []

  // Safeguard: Ensure currently selected tags are always present in the items array
  if (form.tagIds && form.tagIds.length > 0) {
    for (const id of form.tagIds) {
      const selectedTag = all.find((t) => t.id === id)
      if (selectedTag) {
        result.push(selectedTag)
        uniqueNames.add(selectedTag.name)
      }
    }
  }

  for (const tag of filtered) {
    if (!uniqueNames.has(tag.name)) {
      uniqueNames.add(tag.name)
      result.push(tag)
    }
  }
  return result
})

// Live Redmine issue search
const workspaceId = computed(() => workspacesStore.activeWorkspaceId)
const activeProjectExternalId = computed(
  () => projectsStore.projects.find((p) => p.id === form.projectId)?.externalId ?? null
)
const {
  query: issueQuery,
  results: issueResults,
  isSearching: isSearchingIssues
} = useIssueSearch(workspaceId, activeProjectExternalId)
const issueOptions = computed(() => issueResults.value.map((r) => r.issue_title))

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultStart(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - 30, 0, 0)
  return toLocalInput(d.toISOString())
}

function defaultEnd(): string {
  return toLocalInput(new Date().toISOString())
}

const form = reactive({
  description: '',
  projectId: undefined as string | undefined,
  issueId: undefined as string | undefined,
  /** Redmine issue ID from live search — mutually exclusive with issueId. */
  externalIssueId: undefined as string | undefined,
  /** Display label for the Redmine issue (not persisted). */
  issueTitle: '' as string,
  tagIds: [] as string[],
  timeStart: defaultStart(),
  timeEnd: defaultEnd()
})

const selectedIssueProjectName = ref('')

const selectedTagId = computed({
  get: () => form.tagIds?.[0] || undefined,
  set: (val: string | undefined) => {
    form.tagIds = val ? [val] : []
  }
})

watch(
  () => props.open,
  (open) => {
    isInitializing.value = true
    if (!open) {
      form.projectId = undefined
      form.issueId = undefined
      form.tagIds = []
      form.description = ''
      isInitializing.value = false
      return
    }
    if (props.entry) {
      form.description = props.entry.description ?? ''
      form.projectId = props.entry.projectId ?? undefined
      form.issueId = props.entry.issueId ?? undefined
      form.externalIssueId = undefined
      form.issueTitle = ''
      form.tagIds = [...(props.entry.tagIds ?? [])]
      form.timeStart = toLocalInput(props.entry.timeStart)
      form.timeEnd = props.entry.timeEnd ? toLocalInput(props.entry.timeEnd) : defaultEnd()

      const entry = props.entry
      if (entry && entry.projectId) {
        const proj = projects.value.find((p) => p.id === entry.projectId)
        selectedIssueProjectName.value = proj ? proj.name : ''
      } else {
        selectedIssueProjectName.value = ''
      }
    } else {
      form.description = ''
      form.projectId = undefined
      form.issueId = undefined
      form.externalIssueId = undefined
      form.issueTitle = ''
      form.tagIds = []
      form.timeStart = props.initialTimeStart
        ? toLocalInput(props.initialTimeStart.toISOString())
        : defaultStart()
      form.timeEnd = props.initialTimeEnd
        ? toLocalInput(props.initialTimeEnd.toISOString())
        : defaultEnd()
      selectedIssueProjectName.value = ''
    }
  }
)

watch(
  [() => form.projectId, projects],
  ([projId, projs]) => {
    if (projId && projs.length > 0 && !selectedIssueProjectName.value) {
      const proj = projs.find((p) => p.id === projId)
      if (proj) {
        selectedIssueProjectName.value = proj.name
      }
    }
  },
  { immediate: true }
)

watch(
  () => form.projectId,
  (newProjId, oldProjId) => {
    if (newProjId !== oldProjId) {
      if (!newProjId) {
        form.issueId = undefined
        form.externalIssueId = undefined
        form.issueTitle = ''
        selectedIssueProjectName.value = ''
        return
      }
      const currentProj = projects.value.find((p) => p.id === newProjId)
      if (
        currentProj &&
        selectedIssueProjectName.value &&
        currentProj.name !== selectedIssueProjectName.value
      ) {
        form.issueId = undefined
        form.externalIssueId = undefined
        form.issueTitle = ''
        selectedIssueProjectName.value = ''

        toast.add({
          title: 'Issue cleared',
          description: 'The selected issue does not belong to the new project.',
          color: 'warning',
          icon: 'i-lucide-info'
        })
      }
    }
    isInitializing.value = false
  }
)

watch(
  () => form.projectId,
  (newVal, oldVal) => {
    // Only swap dependent fields if the project is actually changing from one value to another
    if (!isInitializing.value && newVal !== oldVal) {
      // Swap Tag ID
      if (form.tagIds && form.tagIds.length > 0) {
        const oldId = form.tagIds[0]
        const oldTag = (tagsStore.tags || []).find((t) => t.id === oldId)
        if (oldTag) {
          const newTag = (tagsStore.tags || []).find(
            (t) => t.name === oldTag.name && t.projectId === newVal
          )
          form.tagIds = newTag ? [newTag.id] : []
        } else {
          form.tagIds = []
        }
      }
    }
  },
  { flush: 'sync' }
)

function onIssueSelected(title: string) {
  const match = issueResults.value.find((r) => r.issue_title === title)
  if (match) {
    form.externalIssueId = String(match.external_id)
    form.issueTitle = match.issue_title
    selectedIssueProjectName.value = match.project_name
    const proj = projects.value.find((p) => p.name === match.project_name)
    if (proj) {
      form.projectId = proj.id
    } else {
      toast.add({
        title: 'Project mismatch',
        description: `This issue belongs to project "${match.project_name}", which is not in this workspace.`,
        color: 'warning',
        icon: 'i-lucide-alert-triangle'
      })
    }
  } else {
    form.externalIssueId = undefined
    form.issueTitle = ''
    selectedIssueProjectName.value = ''
  }
}

const timeStartMs = computed(() => new Date(form.timeStart).getTime())
const timeEndMs = computed(() => new Date(form.timeEnd).getTime())
const timeValid = computed(
  () => !isNaN(timeStartMs.value) && !isNaN(timeEndMs.value) && timeEndMs.value > timeStartMs.value
)
const canSubmit = computed(() => timeValid.value)

async function onSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  try {
    let saved: TimeEntry | null = null
    if (isEdit.value && props.entry) {
      const payload: UpdateTimeEntryRequest = {
        projectId: form.projectId ?? null,
        issueId: form.externalIssueId ? null : (form.issueId ?? null),
        externalIssueId: form.externalIssueId ?? null,
        description: form.description || null,
        timeStart: new Date(form.timeStart).toISOString(),
        timeEnd: new Date(form.timeEnd).toISOString(),
        tagIds: form.tagIds
      }
      saved = await timerStore.updateEntry(props.entry.id, payload)
    } else {
      const payload: CreateTimeEntryRequest = {
        projectId: form.projectId ?? null,
        issueId: form.externalIssueId ? null : (form.issueId ?? null),
        externalIssueId: form.externalIssueId ?? null,
        description: form.description || null,
        timeStart: new Date(form.timeStart).toISOString(),
        timeEnd: new Date(form.timeEnd).toISOString(),
        tagIds: form.tagIds
      }
      saved = await timerStore.createEntry(payload)
    }

    if (!saved) {
      toast.add({
        title: isEdit.value ? 'Failed to update entry' : 'Failed to create entry',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return
    }
    toast.add({
      title: isEdit.value ? 'Entry updated' : 'Entry created',
      color: 'success',
      icon: 'i-lucide-check'
    })
    emit('saved', saved)
    emit('update:open', false)
  } finally {
    isLoading.value = false
  }
}

async function onDelete() {
  if (!props.entry) return
  const ok = await confirm({
    title: 'Delete time entry?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    confirmColor: 'error',
    icon: 'i-lucide-trash-2'
  })
  if (!ok) return

  isLoading.value = true
  try {
    const success = await timerStore.deleteEntry(props.entry.id)
    if (success) {
      toast.add({ title: 'Entry deleted', color: 'success', icon: 'i-lucide-check' })
      emit('deleted', props.entry.id)
      emit('update:open', false)
    } else {
      toast.add({ title: 'Failed to delete entry', color: 'error', icon: 'i-lucide-alert-circle' })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UModal :open="open" @update:open="$emit('update:open', $event)">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              :name="isEdit ? 'i-lucide-pencil' : 'i-lucide-clock-plus'"
              class="text-primary-500"
            />
            <h2 class="text-lg font-semibold">
              {{ isEdit ? 'Edit Time Entry' : 'New Time Entry' }}
            </h2>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <UFormField label="Description" name="description">
            <UInput
              v-model="form.description"
              placeholder="What did you work on?"
              autofocus
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Project" name="projectId">
              <USelectMenu
                v-model="form.projectId"
                :items="projects"
                value-key="id"
                label-key="name"
                placeholder="Select project"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Issue" name="issueId">
              <AppComboboxInput
                v-model="form.issueTitle"
                :options="issueOptions"
                :loading="isSearchingIssues"
                placeholder="Search issue…"
                :allow-custom="false"
                class="w-full"
                @query-change="(q) => (issueQuery = q)"
                @update:model-value="onIssueSelected"
              />
            </UFormField>
          </div>

          <!-- Warning message if project and issue don't align -->
          <div
            v-if="
              selectedIssueProjectName &&
              form.projectId &&
              projects.find((p) => p.id === form.projectId)?.name !== selectedIssueProjectName
            "
            class="text-xs text-warning-500 dark:text-warning-400 mt-1 flex items-center gap-1.5 font-medium bg-warning-50 dark:bg-warning-950/20 p-2.5 rounded-lg border border-warning-200 dark:border-warning-900/50"
          >
            <UIcon name="i-lucide-alert-triangle" class="size-4 shrink-0 text-warning-500" />
            <span
              >This task belongs to project "{{ selectedIssueProjectName }}", but you have selected
              project "{{ projects.find((p) => p.id === form.projectId)?.name }}".</span
            >
          </div>

          <UFormField label="Tag" name="tagIds">
            <USelectMenu
              v-model="selectedTagId"
              :items="filteredTags"
              value-key="id"
              label-key="name"
              placeholder="Select tag"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Start" name="timeStart" required>
              <input
                v-model="form.timeStart"
                type="datetime-local"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </UFormField>

            <UFormField label="End" name="timeEnd" required>
              <input
                v-model="form.timeEnd"
                type="datetime-local"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </UFormField>
          </div>

          <p v-if="form.timeStart && form.timeEnd && !timeValid" class="text-xs text-red-500">
            End time must be after start time.
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <UButton
              v-if="isEdit"
              type="button"
              color="error"
              variant="ghost"
              class="mr-auto hover:bg-red-50 dark:hover:bg-red-950"
              @click="onDelete"
            >
              Delete
            </UButton>
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              @click="$emit('update:open', false)"
            >
              Cancel
            </UButton>
            <UButton
              type="button"
              color="primary"
              :loading="isLoading"
              :disabled="!canSubmit"
              @click="onSubmit"
            >
              {{ isEdit ? 'Save Changes' : 'Create Entry' }}
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
