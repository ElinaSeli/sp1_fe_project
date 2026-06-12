<script setup lang="ts">
import { issuesService } from '~/services'

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
    // Set isProjectManuallySelected BEFORE projectId so the sync watcher sees it as a manual change
    timerStore.draftEntry.isProjectManuallySelected = true
    timerStore.draftEntry.projectId = p ? p.id : null
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
  {
    external_id: number
    issue_title: string
    project_id: string | null
    project_name: string
    project_external_id: string | null
  }
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

// Check mismatch and auto-fill project safely.
// BE may omit project_name — guard only when we truly have no identifier at all.
const handleProjectMapping = (
  projName: string | undefined,
  projId: string | null,
  projExtId: string | null
) => {
  if (!projName && !projId && !projExtId) return

  const localProj =
    (projId && projects.value.find((p) => p.id === projId)) ||
    (projExtId && projects.value.find((p) => p.externalId && p.externalId === projExtId)) ||
    (projName &&
      projects.value.find((p) => p.name.trim().toLowerCase() === projName.trim().toLowerCase())) ||
    null

  const resolvedName = localProj?.name || projName || ''

  const currentProj = projects.value.find((p) => p.id === timerStore.draftEntry.projectId)
  const isCurrentSystemNoProject = currentProj?.isSystem || currentProj?.name === 'No Project'

  if (!timerStore.draftEntry.projectId || isCurrentSystemNoProject) {
    if (localProj) {
      isAutoFillingProjectFromIssue = true
      timerStore.draftEntry.projectId = localProj.id
      timerStore.draftEntry.isProjectManuallySelected = false
      isAutoFillingProjectFromIssue = false
    }
  } else {
    const sameProject =
      (projId && timerStore.draftEntry.projectId === projId) ||
      projects.value.find(
        (p) =>
          p.id === timerStore.draftEntry.projectId &&
          ((projName && p.name.toLowerCase() === projName.toLowerCase()) ||
            (p.externalId && projExtId && p.externalId === projExtId))
      )
    if (!sameProject) {
      if (localProj) {
        isAutoFillingProjectFromIssue = true
        timerStore.draftEntry.projectId = localProj.id
        timerStore.draftEntry.isProjectManuallySelected = false
        isAutoFillingProjectFromIssue = false
        toast.add({
          title: 'Project switched',
          description: `Project changed to "${resolvedName}" to match the selected task.`,
          color: 'warning',
          icon: 'i-lucide-refresh-cw'
        })
      } else if (resolvedName) {
        toast.add({
          title: 'Project mismatch',
          description: `This task belongs to "${resolvedName}", which doesn't match the selected project.`,
          color: 'warning',
          icon: 'i-lucide-alert-triangle'
        })
      }
    }
  }
}

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
      timerStore.draftEntry.issueProjectId = null
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
      // Store the resolved local UUID so we can do fast UUID comparison later
      timerStore.draftEntry.issueProjectId = match.project_id ?? null

      handleProjectMapping(match.project_name, match.project_id, match.project_external_id)

      // SILENT DETAIL RESOLUTION WORKAROUND FOR REDMINE FTS INDEX BUG
      if (workspaceId.value) {
        issuesService
          .search(workspaceId.value, `#${match.external_id}`)
          .then((res) => {
            const rawDetailed = res.data?.[0]
            if (rawDetailed) {
              const r = rawDetailed as {
                external_id?: number | string
                externalId?: number | string
                issue_title?: string
                issueTitle?: string
                project_id?: string | null
                projectId?: string | null
                project_name?: string
                projectName?: string
                project_external_id?: string | null
                projectExternalId?: string | null
              }
              const detailed = {
                external_id:
                  r.external_id !== undefined ? Number(r.external_id) : Number(r.externalId),
                issue_title: r.issue_title !== undefined ? r.issue_title : (r.issueTitle ?? ''),
                project_id: r.project_id !== undefined ? r.project_id : (r.projectId ?? null),
                project_name: r.project_name !== undefined ? r.project_name : (r.projectName ?? ''),
                project_external_id:
                  r.project_external_id !== undefined
                    ? r.project_external_id
                    : (r.projectExternalId ?? null)
              }

              timerStore.draftEntry.issueProjectName = detailed.project_name
              timerStore.draftEntry.issueProjectId = detailed.project_id

              handleProjectMapping(
                detailed.project_name,
                detailed.project_id,
                detailed.project_external_id
              )
            }
          })
          .catch((err) => {
            console.error('Failed to resolve search result details:', err)
          })
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

    const currentProjectId = timerStore.draftEntry.projectId
    const currentProj = projects.value.find((p) => p.id === currentProjectId)
    const isCurrentNoProject = !currentProjectId || (currentProj?.isSystem ?? false)

    let t = null
    if (currentProjectId && !isCurrentNoProject) {
      // Project is a real project: prefer tag from that project
      t = allTags.value.find((x) => x.name === name && x.projectId === currentProjectId)
    }
    if (!t) {
      // No project or system project: find the tag from any project
      t = allTags.value.find((x) => x.name === name)
    }

    if (t?.id) {
      timerStore.draftEntry.tagIds = [t.id]
      // Autofill project from tag if no real project is selected yet
      if (isCurrentNoProject && t.projectId) {
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
const confirm = useConfirm()
const timerBarFocused = ref(false)

function onIssueQueryChange(q: string) {
  issueQuery.value = q
}

// Flag to suppress project-change watcher when issue auto-fills project
let isAutoFillingProjectFromIssue = false

// When project is manually changed and an issue from a different project is selected,
// ask the user: remove the task (keep new project) or keep the task (revert project).
watch(
  () => timerStore.draftEntry.projectId,
  async (newId, oldId) => {
    if (isAutoFillingProjectFromIssue) return
    if (!timerStore.draftEntry.isProjectManuallySelected) return
    // Need an issue selected + at least one project identifier to detect mismatch
    const issueProjectId = timerStore.draftEntry.issueProjectId
    if (
      !timerStore.draftEntry.externalIssueId ||
      (!timerStore.draftEntry.issueProjectName && !issueProjectId)
    )
      return
    // Clearing the project → silently clear the issue too (no dialog)
    if (!newId) {
      timerStore.draftEntry.externalIssueId = null
      timerStore.draftEntry.issueTitle = ''
      timerStore.draftEntry.issueProjectName = ''
      timerStore.draftEntry.issueProjectId = null
      return
    }
    const newProj = projects.value.find((p) => p.id === newId)
    // Check mismatch: prefer UUID comparison, fall back to name
    const mismatch = issueProjectId
      ? newId !== issueProjectId
      : newProj &&
        newProj.name.toLowerCase() !== timerStore.draftEntry.issueProjectName?.toLowerCase()
    if (mismatch) {
      const issueTitle = timerStore.draftEntry.issueTitle
      // Resolve issue's project name from local list (BE may omit project_name)
      const issueProj = issueProjectId ? projects.value.find((p) => p.id === issueProjectId) : null
      const issueProjectName =
        issueProj?.name || timerStore.draftEntry.issueProjectName || 'another project'
      const newProjName = newProj?.name ?? ''
      const removeTask = await confirm({
        title: 'Task belongs to another project',
        description: `"${issueTitle}" belongs to "${issueProjectName}", not "${newProjName}".`,
        confirmLabel: 'Remove task',
        cancelLabel: 'Keep task',
        confirmColor: 'warning',
        icon: 'i-lucide-alert-triangle'
      })
      if (removeTask) {
        // Clear the task, keep the newly selected project
        timerStore.draftEntry.externalIssueId = null
        timerStore.draftEntry.issueTitle = ''
        timerStore.draftEntry.issueProjectName = ''
        timerStore.draftEntry.issueProjectId = null
        // Close the project combobox (focus may have returned to it when dialog closed)
        nextTick(() => projectComboboxRef.value?.close())
      } else {
        // Revert the project back — raise guard so this watcher doesn't re-fire
        isAutoFillingProjectFromIssue = true
        timerStore.draftEntry.projectId = oldId ?? null
        timerStore.draftEntry.isProjectManuallySelected = false
        isAutoFillingProjectFromIssue = false
      }
    }
  },
  { flush: 'sync' }
)
const projectComboboxRef = ref<{ close: () => void } | null>(null)
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

const taskInput = ref<{ focus: () => void } | null>(null)

const focusTaskField = () => {
  taskInput.value?.focus()
}

onMounted(() => {
  workspacesStore.fetchWorkspaces()
  timerStore.fetchActiveTimer()
  window.addEventListener('app:focusTaskField', focusTaskField)
})

onUnmounted(() => {
  if (tickerInterval) clearInterval(tickerInterval)
  window.removeEventListener('app:focusTaskField', focusTaskField)
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
        <div class="flex flex-row flex-nowrap items-center gap-x-1 min-h-8 min-w-full">
          <!-- Description: marquee display when idle + value set -->
          <div class="relative flex-1 min-w-[130px] h-8 overflow-hidden flex items-center">
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
            <button
              v-if="description"
              class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-3.5 h-3.5 p-0 bg-transparent border-none cursor-pointer rounded-sm opacity-50 hover:opacity-100 text-slate-400 transition-opacity duration-100"
              tabindex="-1"
              @mousedown.prevent="description = ''"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 1l8 8M9 1l-8 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <span class="text-gray-200 dark:text-gray-700 select-none">|</span>

          <AppComboboxInput
            ref="projectComboboxRef"
            v-model="activeProjectName"
            :options="availableProjects"
            placeholder="Project"
            :dark="true"
            :clearable="true"
            class="shrink-0 w-36 lg:w-44"
          />

          <span class="text-gray-200 dark:text-gray-700 select-none">|</span>

          <AppComboboxInput
            ref="taskInput"
            v-model="activeIssueName"
            :options="issueOptions"
            :loading="isSearchingIssues"
            placeholder="Search task…"
            :allow-custom="false"
            :dark="true"
            :clearable="true"
            class="shrink-0 w-52 lg:w-72"
            @query-change="onIssueQueryChange"
          />

          <span class="text-gray-200 dark:text-gray-700 select-none">|</span>

          <AppComboboxInput
            v-model="selectedTagName"
            :options="availableTags"
            placeholder="Tag"
            :multiple="false"
            :dark="true"
            :clearable="true"
            class="shrink-0 w-24 lg:w-32"
          />
        </div>
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
