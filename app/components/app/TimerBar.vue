<script setup lang="ts">
const timerStore = useTimerStore()
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const tagsStore = useTagsStore()
const issuesStore = useIssuesStore()

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
    timerStore.draftEntry.isProjectManuallySelected = true
  }
})

// --- Live Issue Search (Redmine pass-through) ---
const workspaceId = computed(() => workspacesStore.activeWorkspaceId)
const {
  query: issueQuery,
  results: issueResults,
  isSearching: isSearchingIssues
} = useIssueSearch(
  workspaceId,
  computed(() => null)
)

// Strip any leading "#id - " the backend may already include in issue_title, then re-format
const formatIssueLabel = (r: { external_id: number; issue_title: string }) =>
  r.issue_title.includes(`#${r.external_id}`)
    ? r.issue_title
    : `#${r.external_id} - ${r.issue_title}`

// Normalize a stored issueTitle that may have been saved with a doubled prefix
const normalizeIssueTitle = (title: string, extId: string | null) => {
  if (!title || !extId) return title
  const prefix = `#${extId} - `
  if (title.startsWith(prefix) && title.slice(prefix.length).includes(`#${extId}`)) {
    return title.slice(prefix.length)
  }
  return title
}

// Map search results to option labels for the combobox
const issueOptions = computed(() => issueResults.value.map(formatIssueLabel))

const issueCache = new Map<
  string,
  { external_id: number; issue_title: string; project_name: string; project_external_id: string }
>()

watch(
  () => issueResults.value,
  (newResults) => {
    if (newResults) {
      for (const r of newResults) {
        issueCache.set(formatIssueLabel(r), r)
      }
    }
  },
  { immediate: true, deep: true }
)

// The currently selected issue label (for display in the combobox)
const selectedIssueProjectName = computed(() => {
  if (
    timerStore.draftEntry.issueTitle &&
    (timerStore.draftEntry.externalIssueId || timerStore.draftEntry.issueId)
  ) {
    return timerStore.draftEntry.issueProjectName || ''
  }
  return ''
})

const activeIssueName = computed({
  get: () =>
    normalizeIssueTitle(
      timerStore.draftEntry.issueTitle ?? '',
      timerStore.draftEntry.externalIssueId
    ),
  set: (name: string) => {
    if (!name) {
      timerStore.draftEntry.externalIssueId = null
      timerStore.draftEntry.issueTitle = ''
      timerStore.draftEntry.issueProjectName = ''
      return
    }

    let match = null
    const matchId = name.trim().match(/^#(\d+)/)
    if (matchId) {
      const extId = Number(matchId[1])
      match =
        Array.from(issueCache.values()).find((r) => r.external_id === extId) ||
        issueResults.value.find((r) => r.external_id === extId)
    }

    if (!match) {
      const key = name.trim()
      match =
        issueCache.get(key) ||
        issueResults.value.find((r) => formatIssueLabel(r) === key || r.issue_title === key)
    }

    if (match) {
      timerStore.draftEntry.externalIssueId = String(match.external_id)
      timerStore.draftEntry.issueTitle = formatIssueLabel(match)
      timerStore.draftEntry.issueProjectName = match.project_name

      const localProj = projects.value.find(
        (p) =>
          (p.externalId && p.externalId === match.project_external_id) ||
          p.name.trim().toLowerCase() === match.project_name.trim().toLowerCase()
      )

      if (!timerStore.draftEntry.projectId) {
        // No project set — auto-fill silently
        if (localProj) {
          isAutoFillingProjectFromIssue = true
          timerStore.draftEntry.projectId = localProj.id
          timerStore.draftEntry.isProjectManuallySelected = false
          isAutoFillingProjectFromIssue = false
        }
      } else {
        // Project already set — check for mismatch
        const currentProj = projects.value.find((p) => p.id === timerStore.draftEntry.projectId)
        const sameProject =
          currentProj &&
          (currentProj.name.toLowerCase() === match.project_name.toLowerCase() ||
            (currentProj.externalId && currentProj.externalId === match.project_external_id))
        if (!sameProject) {
          if (localProj) {
            // Switch project to match the selected task (issue wins — it's the last action)
            isAutoFillingProjectFromIssue = true
            timerStore.draftEntry.projectId = localProj.id
            timerStore.draftEntry.isProjectManuallySelected = false
            isAutoFillingProjectFromIssue = false
            toast.add({
              title: 'Project switched',
              description: `Project changed to "${match.project_name}" to match the selected task.`,
              color: 'warning',
              icon: 'i-lucide-refresh-cw'
            })
          } else {
            // Issue's project not found locally — can't auto-switch; inline warning will show
            toast.add({
              title: 'Project mismatch',
              description: `This task belongs to "${match.project_name}", which doesn't match the selected project.`,
              color: 'warning',
              icon: 'i-lucide-alert-triangle'
            })
          }
        }
      }
    }
  }
})

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
        timerStore.draftEntry.isProjectManuallySelected = false
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

// Flag to suppress project-change watcher when issue auto-fills project
let isAutoFillingProjectFromIssue = false

// When project is manually changed, clear any issue that no longer matches
watch(
  () => timerStore.draftEntry.projectId,
  (newId) => {
    if (isAutoFillingProjectFromIssue) return
    if (!timerStore.draftEntry.isProjectManuallySelected) return
    if (!timerStore.draftEntry.externalIssueId || !timerStore.draftEntry.issueProjectName) return
    const newProj = projects.value.find((p) => p.id === newId)
    if (
      newProj &&
      newProj.name.toLowerCase() !== timerStore.draftEntry.issueProjectName.toLowerCase()
    ) {
      const clearedTitle = timerStore.draftEntry.issueTitle
      timerStore.draftEntry.externalIssueId = null
      timerStore.draftEntry.issueTitle = ''
      timerStore.draftEntry.issueProjectName = ''
      toast.add({
        title: 'Task removed',
        description: `"${clearedTitle}" was removed — it doesn't belong to the selected project.`,
        color: 'warning',
        icon: 'i-lucide-x-circle'
      })
    }
  }
)
const descriptionInput = ref<HTMLInputElement | null>(null)
const descFocused = ref(false)
const descDisplayRef = ref<HTMLDivElement | null>(null)
const descTextRef = ref<HTMLSpanElement | null>(null)
const descOverflowing = ref(false)

const checkDescOverflow = async () => {
  await nextTick()
  if (!descDisplayRef.value || !descTextRef.value) {
    descOverflowing.value = false
    return
  }
  const containerW = descDisplayRef.value.clientWidth
  const textW = descTextRef.value.scrollWidth
  if (textW > containerW) {
    descOverflowing.value = true
    descTextRef.value.style.setProperty('--marquee-offset', `${containerW - textW}px`)
  } else {
    descOverflowing.value = false
  }
}

watch([description, descFocused], () => {
  if (!descFocused.value && description.value) checkDescOverflow()
  else descOverflowing.value = false
})

const focusDescInput = () => {
  descFocused.value = true
  nextTick(() => descriptionInput.value?.focus())
}

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
      await Promise.all([
        projectsStore.fetchProjects(),
        tagsStore.fetchTags(),
        issuesStore.fetchIssues()
      ])
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
      class="flex-1 w-full md:w-auto order-last md:order-none mt-3 md:mt-0 px-3 py-1.5 mx-0 sm:mx-4 rounded-lg border transition-all duration-300"
      :class="
        timerBarFocused
          ? 'border-primary-500/50 bg-white dark:bg-gray-800 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
      "
      @focusin="timerBarFocused = true"
      @focusout="onTimerBarFocusout"
    >
      <!-- Scrollable fields row -->
      <div class="overflow-x-auto">
        <div class="inline-flex flex-row flex-nowrap items-center gap-x-1 min-h-8">
          <!-- Description: marquee display when idle + value set -->
          <div
            class="relative min-w-[130px] w-[200px] lg:w-[260px] h-8 overflow-hidden flex items-center"
          >
            <div
              v-if="!descFocused && description"
              ref="descDisplayRef"
              class="absolute inset-0 flex items-center overflow-hidden cursor-text"
              @click="focusDescInput"
            >
              <span
                ref="descTextRef"
                class="whitespace-nowrap text-xs text-gray-900 dark:text-gray-200"
                :class="{ 'desc-marquee': descOverflowing }"
                >{{ description }}</span
              >
            </div>
            <input
              ref="descriptionInput"
              v-model="description"
              data-focus="desc-field"
              placeholder="What are you working on? (Alt+T or /)"
              class="w-full bg-transparent border-none outline-none text-xs text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 h-8"
              :class="{ 'opacity-0': !descFocused && description }"
              @focus="descFocused = true"
              @blur="descFocused = false"
            />
          </div>

          <span class="text-gray-200 dark:text-gray-700 select-none">|</span>

          <AppComboboxInput
            v-model="activeProjectName"
            :options="availableProjects"
            placeholder="Project"
            :dark="true"
            class="shrink-0 w-28 lg:w-36"
          />

          <span class="text-gray-200 dark:text-gray-700 select-none">|</span>

          <AppComboboxInput
            v-model="activeIssueName"
            :options="issueOptions"
            :loading="isSearchingIssues"
            placeholder="Search task…"
            :allow-custom="false"
            :dark="true"
            class="shrink-0 w-44 lg:w-60"
            @query-change="(q) => (issueQuery = q)"
          />

          <span class="text-gray-200 dark:text-gray-700 select-none">|</span>

          <AppComboboxInput
            v-model="selectedTagName"
            :options="availableTags"
            placeholder="Tag"
            :multiple="false"
            :dark="true"
            class="shrink-0 w-20 lg:w-24"
          />
        </div>
      </div>

      <!-- Warning message if project and issue don't align -->
      <div
        v-if="
          selectedIssueProjectName &&
          timerStore.draftEntry.projectId &&
          projects.find((p) => p.id === timerStore.draftEntry.projectId)?.name !==
            selectedIssueProjectName
        "
        class="text-xs text-warning-500 dark:text-warning-400 mt-1 flex items-center gap-1.5 px-1 font-medium"
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

<style scoped>
@keyframes desc-marquee {
  0%,
  15% {
    transform: translateX(0);
  }
  85%,
  100% {
    transform: translateX(var(--marquee-offset, 0px));
  }
}
.desc-marquee {
  animation: desc-marquee 4s ease-in-out infinite alternate;
}
</style>
