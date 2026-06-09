<script setup lang="ts">
const timerStore = useTimerStore()
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const tagsStore = useTagsStore()

const description = computed({
  get: () => timerStore.draftEntry.description,
  set: (v) => {
    timerStore.draftEntry.description = v
  }
})

// --- Defensive Mapping for Combobox ---
const projects = computed(() =>
  Array.isArray(projectsStore.projects) ? projectsStore.projects : []
)
const availableProjects = computed(() => projects.value.map((p) => p.name))
const activeProjectName = computed({
  get: () => projects.value.find((p) => p.id === timerStore.draftEntry.projectId)?.name || '',
  set: (name: string) => {
    const p = projects.value.find((x) => x.name === name)
    timerStore.draftEntry.projectId = p ? p.id : null
  }
})

// --- Live Issue Search (Redmine pass-through) ---
const workspaceId = computed(() => workspacesStore.activeWorkspaceId)
const activeProjectExternalId = computed(
  () =>
    projectsStore.projects.find((p) => p.id === timerStore.draftEntry.projectId)?.externalId ?? null
)
const {
  query: issueQuery,
  results: issueResults,
  isSearching: isSearchingIssues
} = useIssueSearch(workspaceId, activeProjectExternalId)

// Map search results to option labels for the combobox
const issueOptions = computed(() => issueResults.value.map((r) => r.issue_title))

// The currently selected issue label (for display in the combobox)
const selectedIssueProjectName = ref('')

const activeIssueName = computed({
  get: () => timerStore.draftEntry.issueTitle ?? '',
  set: (name: string) => {
    if (!name) {
      timerStore.draftEntry.externalIssueId = null
      timerStore.draftEntry.issueTitle = ''
      selectedIssueProjectName.value = ''
      return
    }
    const match = issueResults.value.find((r) => r.issue_title === name)
    if (match) {
      timerStore.draftEntry.externalIssueId = String(match.external_id)
      timerStore.draftEntry.issueTitle = match.issue_title
      selectedIssueProjectName.value = match.project_name

      const proj = projects.value.find((p) => p.name === match.project_name)
      if (proj) {
        timerStore.draftEntry.projectId = proj.id
      } else {
        toast.add({
          title: 'Project mismatch',
          description: `This issue belongs to project "${match.project_name}", which is not in this workspace.`,
          color: 'warning',
          icon: 'i-lucide-alert-triangle'
        })
      }
    }
  }
})

// Initialize selectedIssueProjectName when projects or draftEntry project loads
watch(
  [() => timerStore.draftEntry.projectId, projects],
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
  () => timerStore.draftEntry.projectId,
  (newProjId, oldProjId) => {
    if (newProjId !== oldProjId) {
      if (!newProjId) {
        timerStore.draftEntry.externalIssueId = null
        timerStore.draftEntry.issueTitle = ''
        selectedIssueProjectName.value = ''
        return
      }
      const currentProj = projects.value.find((p) => p.id === newProjId)
      if (
        currentProj &&
        selectedIssueProjectName.value &&
        currentProj.name !== selectedIssueProjectName.value
      ) {
        timerStore.draftEntry.externalIssueId = null
        timerStore.draftEntry.issueTitle = ''
        selectedIssueProjectName.value = ''

        toast.add({
          title: 'Issue cleared',
          description: 'The selected issue does not belong to the new project.',
          color: 'warning',
          icon: 'i-lucide-info'
        })
      }
    }
  }
)

const allTags = computed(() => (Array.isArray(tagsStore.tags) ? tagsStore.tags : []))
const availableTags = computed(() => {
  return Array.from(new Set(allTags.value.map((t) => t.name)))
})

const selectedTagName = computed({
  get: () => {
    const currentIds = timerStore.draftEntry.tagIds || []
    if (currentIds.length === 0) return ''
    const id = currentIds[0]
    return allTags.value.find((t) => t.id === id)?.name || ''
  },
  set: (name: string) => {
    if (!name) {
      timerStore.draftEntry.tagIds = []
      return
    }

    let t = null
    if (timerStore.draftEntry.projectId) {
      t = allTags.value.find(
        (x) => x.name === name && x.projectId === timerStore.draftEntry.projectId
      )
    }
    if (!t) {
      t = allTags.value.find((x) => x.name === name)
    }

    if (t?.id) {
      timerStore.draftEntry.tagIds = [t.id]
      if (!timerStore.draftEntry.projectId && t.projectId) {
        timerStore.draftEntry.projectId = t.projectId
      }
    } else {
      timerStore.draftEntry.tagIds = []
    }
  }
})

const isRunning = computed(() => timerStore.isRunning)
const isStarting = computed(() => timerStore.isStarting)
const isStopping = computed(() => timerStore.isStopping)
const elapsedSeconds = ref(0)
const toast = useToast()
const timerBarFocused = ref(false)
const descriptionInput = ref<HTMLInputElement | null>(null)

const onTimerBarFocusout = (e: FocusEvent) => {
  const currentTarget = e.currentTarget as Node | null
  if (currentTarget && !currentTarget.contains(e.relatedTarget as Node)) {
    timerBarFocused.value = false
  }
}

watch(
  workspaceId,
  async (id) => {
    if (id) {
      await Promise.all([projectsStore.fetchProjects(), tagsStore.fetchTags()])
    }
  },
  { immediate: true }
)

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

// Calculate elapsed time from startTimestamp
let tickerInterval: ReturnType<typeof setInterval> | null = null
watch(
  () => timerStore.isRunning,
  (running) => {
    if (running && timerStore.startTimestamp) {
      tickerInterval = setInterval(() => {
        elapsedSeconds.value = Math.floor((Date.now() - timerStore.startTimestamp!) / 1000)
      }, 1000)
    } else {
      if (tickerInterval) clearInterval(tickerInterval)
      elapsedSeconds.value = 0
    }
  },
  { immediate: true }
)

const startTracking = async () => {
  try {
    await timerStore.startTimer()
  } catch (e: unknown) {
    toast.add({
      title: 'Failed to start timer',
      description: e instanceof Error ? e.message : 'Unexpected error',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

const stopTracking = async () => {
  try {
    await timerStore.stopTimer()
  } catch (e: unknown) {
    toast.add({
      title: 'Failed to stop timer',
      description: e instanceof Error ? e.message : 'Unexpected error',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

onMounted(() => {
  workspacesStore.fetchWorkspaces()
  timerStore.fetchActiveTimer()
})

onUnmounted(() => {
  if (tickerInterval) clearInterval(tickerInterval)
})
</script>

<template>
  <header
    class="min-h-16 h-auto py-2 md:py-0 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 flex flex-wrap items-center justify-between px-4 shrink-0 shadow-sm z-20 border-b border-gray-200 dark:border-gray-800"
  >
    <!-- Middle: Input Bar (Keyboard First) -->
    <div
      class="flex-1 w-full md:w-auto order-last md:order-none mt-3 md:mt-0 flex flex-col md:flex-row items-center flex-wrap gap-x-1 gap-y-2 px-3 py-2 mx-0 sm:mx-4 rounded-lg border transition-all duration-300"
      :class="
        timerBarFocused
          ? 'border-primary-500/50 bg-white dark:bg-gray-800 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
      "
      @focusin="timerBarFocused = true"
      @focusout="onTimerBarFocusout"
    >
      <!-- Group 1: Description + Project -->
      <div class="flex w-full md:w-auto flex-1 items-center gap-1">
        <input
          ref="descriptionInput"
          v-model="description"
          data-focus="desc-field"
          placeholder="What are you working on? (Alt+T or /)"
          class="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 h-9 truncate"
        />

        <span class="text-gray-200 dark:text-gray-700 select-none hidden md:block">|</span>

        <AppComboboxInput
          v-model="activeProjectName"
          :options="availableProjects"
          placeholder="Project"
          :dark="true"
          class="flex-1 min-w-[130px] md:w-32 lg:w-40"
        />
      </div>

      <span class="text-gray-200 dark:text-gray-700 select-none hidden md:block">|</span>

      <!-- Group 2: Task + Tags -->
      <div class="flex w-full md:w-auto items-center gap-1">
        <AppComboboxInput
          v-model="activeIssueName"
          :options="issueOptions"
          :loading="isSearchingIssues"
          placeholder="Search task…"
          :allow-custom="false"
          :dark="true"
          class="flex-1 min-w-[130px] md:w-32 lg:w-40"
          @query-change="(q) => (issueQuery = q)"
        />

        <span class="text-gray-200 dark:text-gray-700 select-none hidden md:block">|</span>

        <AppComboboxInput
          v-model="selectedTagName"
          :options="availableTags"
          placeholder="Tag"
          :multiple="false"
          :dark="true"
          class="flex-1 min-w-[100px] md:w-32 lg:w-40"
        />
      </div>

      <!-- Warning message if project and issue don't align -->
      <div
        v-if="
          selectedIssueProjectName &&
          timerStore.draftEntry.projectId &&
          projects.find((p) => p.id === timerStore.draftEntry.projectId)?.name !==
            selectedIssueProjectName
        "
        class="w-full text-xs text-warning-500 dark:text-warning-400 mt-1 flex items-center gap-1.5 px-1 font-medium"
      >
        <UIcon name="i-lucide-alert-triangle" class="size-3.5 shrink-0" />
        <span
          >This task belongs to project "{{ selectedIssueProjectName }}", but active project is "{{
            projects.find((p) => p.id === timerStore.draftEntry.projectId)?.name
          }}".</span
        >
      </div>
    </div>

    <!-- Right: Controls -->
    <div class="flex items-center gap-2 sm:gap-6 shrink-0">
      <div
        class="text-xl sm:text-2xl font-mono font-medium tracking-wider text-primary-500 w-20 sm:w-32 text-right"
      >
        {{ formatDuration(elapsedSeconds) }}
      </div>

      <UButton
        :icon="isRunning ? 'i-lucide-square' : 'i-lucide-play'"
        :color="isRunning ? 'error' : 'primary'"
        :loading="isStarting || isStopping"
        size="md"
        class="min-w-[80px] sm:min-w-[100px] justify-center font-bold shadow-lg"
        @click="isRunning ? stopTracking() : startTracking()"
      >
        {{ isRunning ? 'STOP' : 'START' }}
      </UButton>
    </div>
  </header>
</template>
