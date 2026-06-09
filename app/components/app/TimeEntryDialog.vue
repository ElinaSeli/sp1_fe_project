<script setup lang="ts">
import type { TimeEntry } from '~/types'

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
const issuesStore = useIssuesStore()
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
const {
  query: issueQuery,
  results: issueResults,
  isSearching: isSearchingIssues
} = useIssueSearch(
  workspaceId,
  computed(() => null)
)
const issueOptions = computed(() =>
  issueResults.value.map((r) => `#${r.external_id} - ${r.issue_title}`)
)

const issueCache = new Map<
  string,
  { external_id: number; issue_title: string; project_name: string; project_external_id: string }
>()

watch(
  () => issueResults.value,
  (newResults) => {
    if (newResults) {
      for (const r of newResults) {
        const key = `#${r.external_id} - ${r.issue_title}`
        issueCache.set(key, r)
      }
    }
  },
  { immediate: true, deep: true }
)

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
  timeEnd: defaultEnd(),
  isProjectManuallySelected: false
})

const selectedIssueProjectName = ref('')

let isAutoFillingProject = false

watch(
  () => form.projectId,
  (newVal) => {
    console.log(
      '[Watcher] form.projectId changed to:',
      newVal,
      'isInitializing:',
      isInitializing.value,
      'tagIds:',
      JSON.stringify(form.tagIds)
    )
    if (isInitializing.value) return
    if (!isAutoFillingProject) {
      form.isProjectManuallySelected = true
    }

    // Clear system issue ID to allow backend to resolve new project's system issue
    if (!form.externalIssueId) {
      form.issueId = undefined
    }

    // Auto-swap tags
    if (form.tagIds && form.tagIds.length > 0) {
      const newTagIds: string[] = []
      for (const oldId of form.tagIds) {
        const oldTag = (tagsStore.tags || []).find((t) => t.id === oldId)
        console.log('[Watcher] oldTag found:', JSON.stringify(oldTag))
        if (oldTag) {
          const newTag = (tagsStore.tags || []).find(
            (t) =>
              t.name.trim().toLowerCase() === oldTag.name.trim().toLowerCase() &&
              t.projectId === newVal
          )
          console.log('[Watcher] newTag found for project', newVal, ':', JSON.stringify(newTag))
          if (newTag) newTagIds.push(newTag.id)
        }
      }
      console.log('[Watcher] setting form.tagIds to:', JSON.stringify(newTagIds))
      form.tagIds = newTagIds
    }
  },
  { flush: 'sync' }
)

const selectedTagId = computed({
  get: () => form.tagIds?.[0] || undefined,
  set: (val: string | undefined) => {
    form.tagIds = val ? [val] : []
    // Auto-fill project if not filled
    if (val && !form.projectId) {
      const selectedTag = (tagsStore.tags || []).find((t) => t.id === val)
      if (selectedTag && selectedTag.projectId) {
        isAutoFillingProject = true
        form.projectId = selectedTag.projectId
        form.isProjectManuallySelected = false
        isAutoFillingProject = false
      }
    }
  }
})

watch(
  () => props.open,
  async (open) => {
    isInitializing.value = true
    if (!open) {
      form.projectId = undefined
      form.issueId = undefined
      form.tagIds = []
      form.description = ''
      form.isProjectManuallySelected = false
      issueQuery.value = ''
      isInitializing.value = false
      return
    }

    // Load projects, tags, and issues first to ensure local lists are fully populated
    await Promise.all([
      projectsStore.fetchProjects(),
      tagsStore.fetchTags(),
      issuesStore.fetchIssues()
    ])

    const entry = props.entry
    if (entry) {
      form.description = entry.description ?? ''
      form.projectId = entry.projectId ?? undefined
      form.issueId = entry.issueId ?? undefined
      form.externalIssueId = undefined
      form.issueTitle = ''
      form.tagIds = [...(entry.tagIds ?? [])]
      form.timeStart = toLocalInput(entry.timeStart)
      form.timeEnd = entry.timeEnd ? toLocalInput(entry.timeEnd) : defaultEnd()
      form.isProjectManuallySelected = true
      issueQuery.value = ''

      if (entry.issueId) {
        const localIssue = (issuesStore.issues || []).find((i) => i.id === entry.issueId)
        if (localIssue && localIssue.externalId) {
          form.issueTitle = `#${localIssue.externalId} - ${localIssue.name}`
          form.externalIssueId = localIssue.externalId
          const proj = projects.value.find((p) => p.id === localIssue.projectId)
          if (proj) {
            selectedIssueProjectName.value = proj.name
          }
        } else {
          selectedIssueProjectName.value = ''
        }
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
      form.isProjectManuallySelected = false
      selectedIssueProjectName.value = ''
      issueQuery.value = ''
    }
    isInitializing.value = false
  }
)

function onIssueSelected(title: string) {
  if (!title) {
    form.externalIssueId = undefined
    form.issueId = undefined
    form.issueTitle = ''
    selectedIssueProjectName.value = ''
    return
  }

  let match = null
  const matchId = title.trim().match(/^#(\d+)/)
  if (matchId) {
    const extId = Number(matchId[1])
    match =
      Array.from(issueCache.values()).find((r) => r.external_id === extId) ||
      issueResults.value.find((r) => r.external_id === extId)
  }

  if (!match) {
    const key = title.trim()
    match =
      issueCache.get(key) ||
      issueResults.value.find(
        (r) => `#${r.external_id} - ${r.issue_title}` === key || r.issue_title === key
      )
  }

  if (match) {
    form.externalIssueId = String(match.external_id)
    form.issueId = undefined
    form.issueTitle = `#${match.external_id} - ${match.issue_title}`
    selectedIssueProjectName.value = match.project_name

    // Auto-fill project if not filled
    if (!form.projectId) {
      const localProj = projects.value.find(
        (p) =>
          (p.externalId && p.externalId === match.project_external_id) ||
          p.name.trim().toLowerCase() === match.project_name.trim().toLowerCase()
      )
      if (localProj) {
        isAutoFillingProject = true
        form.projectId = localProj.id
        form.isProjectManuallySelected = false
        isAutoFillingProject = false
      }
    }
  } else {
    form.externalIssueId = undefined
    form.issueId = undefined
    form.issueTitle = ''
    selectedIssueProjectName.value = ''
  }
}

function _onIssueFocus() {
  // Ensure form.issueTitle is empty when focusing to enter search mode
  // This allows live search to work properly
  if (!issueQuery.value) {
    form.issueTitle = ''
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

    const payloadFields = {
      projectId: form.projectId ?? null,
      issueId: form.externalIssueId ? null : (form.issueId ?? null),
      externalIssueId: form.externalIssueId ?? null,
      description: form.description || null,
      timeStart: new Date(form.timeStart).toISOString(),
      timeEnd: new Date(form.timeEnd).toISOString(),
      tagIds: form.tagIds
    }

    if (isEdit.value && props.entry) {
      saved = await timerStore.updateEntry(props.entry.id, payloadFields)
    } else {
      saved = await timerStore.createEntry(payloadFields)
    }

    if (!saved) {
      toast.add({
        title: isEdit.value ? 'Failed to update entry' : 'Failed to create entry',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return
    }

    // Determine if there is an issue mismatch (only if project was manually selected by user)
    let issueMismatch = false
    if (
      form.isProjectManuallySelected &&
      form.projectId &&
      (form.externalIssueId || form.issueId) &&
      saved.projectId !== form.projectId
    ) {
      issueMismatch = true
    }

    // Target project ID after checking issue mismatch
    const targetProjectId = issueMismatch ? form.projectId : saved.projectId

    // Check tag mismatch based on target project ID
    let tagMismatch = false
    const validTagIds = (form.tagIds || []).filter((tagId) => {
      const tag = (tagsStore.tags || []).find((t) => t.id === tagId)
      if (tag && tag.projectId && targetProjectId && tag.projectId !== targetProjectId) {
        tagMismatch = true
        return false
      }
      return true
    })

    // If we have any mismatch, make a single follow-up update to clear mismatched values in the database
    if (issueMismatch || tagMismatch) {
      const followUp = await timerStore.updateEntry(saved.id, {
        projectId: targetProjectId ?? null,
        issueId: issueMismatch ? null : saved.issueId,
        externalIssueId: null, // already resolved
        description: saved.description,
        timeStart: saved.timeStart,
        timeEnd: saved.timeEnd || new Date().toISOString(),
        tagIds: validTagIds
      })
      if (followUp) {
        saved = followUp
      }
    }

    if (issueMismatch || tagMismatch) {
      let desc = ''
      if (issueMismatch && tagMismatch) {
        desc =
          'The selected issue and tags do not belong to the selected project. The entry was saved, but they were cleared.'
      } else if (issueMismatch) {
        desc =
          'The selected issue does not belong to the selected project. The entry was saved, but the issue was cleared.'
      } else {
        desc =
          'The selected tags do not belong to the selected project. The entry was saved, but the tags were cleared.'
      }
      toast.add({
        title: 'Project mismatch',
        description: desc,
        color: 'warning',
        icon: 'i-lucide-alert-triangle'
      })
    } else {
      toast.add({
        title: isEdit.value ? 'Time entry updated' : 'Time entry created',
        color: 'success',
        icon: 'i-lucide-check'
      })
    }

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
              placeholder="Search task (will set project if empty)…"
              :allow-custom="false"
              class="w-full"
              @query-change="(q) => (issueQuery = q)"
              @update:model-value="onIssueSelected"
            />
          </UFormField>

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
