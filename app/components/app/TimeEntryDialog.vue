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
const issuesStore = useIssuesStore()
const tagsStore = useTagsStore()
const toast = useToast()
const confirm = useConfirm()

const isEdit = computed(() => Boolean(props.entry))
const isLoading = ref(false)

const projects = computed(() => projectsStore.projects)
const filteredTags = computed(() => {
  const all = tagsStore.tags || []
  let filtered = all
  if (form.projectId) {
    filtered = all.filter((t) => t.projectId === form.projectId)
  }
  const uniqueNames = new Set<string>()
  const result: typeof all = []
  for (const tag of filtered) {
    if (!uniqueNames.has(tag.name)) {
      uniqueNames.add(tag.name)
      result.push(tag)
    }
  }
  return result
})

const filteredIssues = computed(() => {
  const all = issuesStore.issues || []
  let filtered = all
  if (form.projectId) {
    filtered = all.filter((i) => i.projectId === form.projectId)
  }
  const uniqueNames = new Set<string>()
  const result: typeof all = []
  for (const issue of filtered) {
    if (!uniqueNames.has(issue.name)) {
      uniqueNames.add(issue.name)
      result.push(issue)
    }
  }
  return result
})

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
  tagIds: [] as string[],
  timeStart: defaultStart(),
  timeEnd: defaultEnd()
})

watch(
  () => props.open,
  (open) => {
    if (!open) {
      form.projectId = undefined
      form.issueId = undefined
      form.tagIds = []
      form.description = ''
      return
    }
    if (props.entry) {
      form.description = props.entry.description ?? ''
      form.projectId = props.entry.projectId ?? undefined
      form.issueId = props.entry.issueId ?? undefined
      form.tagIds = [...(props.entry.tagIds ?? [])]
      form.timeStart = toLocalInput(props.entry.timeStart)
      form.timeEnd = props.entry.timeEnd ? toLocalInput(props.entry.timeEnd) : defaultEnd()
    } else {
      form.description = ''
      form.projectId = undefined
      form.issueId = undefined
      form.tagIds = []
      form.timeStart = props.initialTimeStart
        ? toLocalInput(props.initialTimeStart.toISOString())
        : defaultStart()
      form.timeEnd = props.initialTimeEnd
        ? toLocalInput(props.initialTimeEnd.toISOString())
        : defaultEnd()
    }
  }
)

watch(
  () => form.projectId,
  (newVal, oldVal) => {
    // Only swap dependent fields if the project is actually changing from one value to another
    // (ignores the initial set when the dialog opens, where oldVal is usually undefined or matches the entry)
    if (oldVal !== undefined && newVal !== oldVal) {
      // Swap Issue ID
      if (form.issueId) {
        const oldIssue = (issuesStore.issues || []).find((i) => i.id === form.issueId)
        if (oldIssue) {
          const newIssue = (issuesStore.issues || []).find(
            (i) => i.name === oldIssue.name && i.projectId === newVal
          )
          form.issueId = newIssue ? newIssue.id : undefined
        } else {
          form.issueId = undefined
        }
      }

      // Swap Tag IDs
      if (form.tagIds && form.tagIds.length > 0) {
        const newTagIds: string[] = []
        for (const oldId of form.tagIds) {
          const oldTag = (tagsStore.tags || []).find((t) => t.id === oldId)
          if (oldTag) {
            const newTag = (tagsStore.tags || []).find(
              (t) => t.name === oldTag.name && t.projectId === newVal
            )
            if (newTag) newTagIds.push(newTag.id)
          }
        }
        form.tagIds = newTagIds
      }
    }
  }
)

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
        issueId: form.issueId ?? null,
        description: form.description || null,
        timeStart: new Date(form.timeStart).toISOString(),
        timeEnd: new Date(form.timeEnd).toISOString(),
        tagIds: form.tagIds
      }
      saved = await timerStore.updateEntry(props.entry.id, payload)
    } else {
      const payload: CreateTimeEntryRequest = {
        projectId: form.projectId ?? null,
        issueId: form.issueId ?? null,
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
              <USelectMenu
                v-model="form.issueId"
                :items="filteredIssues"
                value-key="id"
                label-key="name"
                placeholder="Select issue"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Tags" name="tagIds">
            <USelectMenu
              v-model="form.tagIds"
              :items="filteredTags"
              value-key="id"
              label-key="name"
              placeholder="Select tags"
              multiple
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
