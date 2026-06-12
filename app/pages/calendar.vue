<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { TimeEntryViewModel, TimeEntry, Project } from '~/types'

definePageMeta({
  layout: 'dashboard'
})

const timerStore = useTimerStore()
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const issuesStore = useIssuesStore()
const tagsStore = useTagsStore()
const { activeWorkspaceId } = storeToRefs(workspacesStore)
const { projects } = storeToRefs(projectsStore)

// Fetch entries and projects/issues/tags for the calendar. We'll use our temporary hack.
onMounted(async () => {
  if (activeWorkspaceId.value) {
    await Promise.all([
      timerStore.fetchEntries({ size: 100 }),
      projectsStore.fetchProjects(),
      issuesStore.fetchIssues(),
      tagsStore.fetchTags()
    ])
  }
})

watch(activeWorkspaceId, async (id) => {
  if (id) {
    await Promise.all([
      timerStore.fetchEntries({ size: 100 }),
      projectsStore.fetchProjects(),
      issuesStore.fetchIssues(),
      tagsStore.fetchTags()
    ])
  }
})

// --- Dialog State ---
const dialogOpen = ref(false)
const editingEntry = ref<TimeEntry | null>(null)
const initialTimeStart = ref<Date | null>(null)
const initialTimeEnd = ref<Date | null>(null)
function openCreate(date: Date, hour?: number) {
  editingEntry.value = null
  const start = new Date(date)
  if (hour !== undefined) {
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1, 0, 0, 0)
    initialTimeStart.value = start
    initialTimeEnd.value = end
  } else {
    // If just day clicked, default to 9 AM
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    initialTimeStart.value = start
    initialTimeEnd.value = end
  }
  dialogOpen.value = true
}

function openEdit(entry: TimeEntryViewModel) {
  const raw = timerStore.rawEntries.find((e) => e.id === entry.id)
  if (!raw) return
  editingEntry.value = raw
  initialTimeStart.value = null
  initialTimeEnd.value = null
  dialogOpen.value = true
}

function onDialogSaved() {
  timerStore.fetchEntries({ size: 100 }) // Refresh calendar view
}

// --- View State ---
const viewMode = ref<'month' | 'week' | 'day'>('month')
const currentDate = ref(new Date())

function goToDayView(day: Date) {
  viewMode.value = 'day'
  currentDate.value = day
}

const currentMonth = computed(() => currentDate.value.getMonth())

const monthName = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' })
  } else if (viewMode.value === 'day') {
    return currentDate.value.toLocaleString('default', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  } else {
    // Week view
    const days = calendarDays.value
    if (days.length === 0) return ''
    const first = days[0]!
    const last = days[6]!
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleString('default', { month: 'short' })} ${first.getDate()} - ${last.getDate()}, ${first.getFullYear()}`
    }
    return `${first.toLocaleString('default', { month: 'short' })} ${first.getDate()} - ${last.toLocaleString('default', { month: 'short' })} ${last.getDate()}, ${first.getFullYear()}`
  }
})

function prevPeriod() {
  if (viewMode.value === 'month') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() - 1,
      1
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 7
    )
  } else {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() - 1
    )
  }
}

function nextPeriod() {
  if (viewMode.value === 'month') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1,
      1
    )
  } else if (viewMode.value === 'week') {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 7
    )
  } else {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      currentDate.value.getDate() + 1
    )
  }
}

function goToday() {
  currentDate.value = new Date()
}

// Generate calendar grid based on view
const calendarDays = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth()
  const d = currentDate.value.getDate()

  if (viewMode.value === 'day') {
    return [new Date(y, m, d)]
  }

  if (viewMode.value === 'week') {
    const days = []
    let dayOfWeek = currentDate.value.getDay() - 1
    if (dayOfWeek < 0) dayOfWeek = 6 // Monday first
    const startOfWeek = new Date(y, m, d - dayOfWeek)
    for (let i = 0; i < 7; i++) {
      days.push(
        new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i)
      )
    }
    return days
  }

  // Month view
  const firstDayOfMonth = new Date(y, m, 1)
  const lastDayOfMonth = new Date(y, m + 1, 0)

  let startOffset = firstDayOfMonth.getDay() - 1
  if (startOffset < 0) startOffset = 6 // Sunday becomes 6

  const days = []
  for (let i = startOffset; i > 0; i--) {
    days.push(new Date(y, m, 1 - i))
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(new Date(y, m, i))
  }
  const remaining = 35 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(y, m + 1, i))
  }
  return days
})

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = Array.from({ length: 24 }, (_, i) => i)

// Helper to format date as YYYY-MM-DD
function formatDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Group entries by date
const entriesByDate = computed(() => {
  const map = new Map<string, TimeEntryViewModel[]>()
  timerStore.entries.forEach((entry) => {
    const start = new Date(entry.timeStart)
    const end = new Date(entry.timeEnd || new Date().toISOString())

    // Normalize to midnight local time
    let current = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())

    while (current.getTime() <= last.getTime()) {
      const dStr = formatDateStr(current)
      if (!map.has(dStr)) map.set(dStr, [])
      map.get(dStr)!.push(entry)
      // Add 1 day
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
    }
  })
  return map
})

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function getDurationForDate(entry: TimeEntryViewModel, dateStr: string) {
  const start = new Date(entry.timeStart)
  const end = new Date(entry.timeEnd || new Date().toISOString())

  // Use local time for day boundaries
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return 0
  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)

  const effectiveStart = start < dayStart ? dayStart : start
  const effectiveEnd = end > dayEnd ? dayEnd : end

  const diff = effectiveEnd.getTime() - effectiveStart.getTime()
  return diff > 0 ? diff / 1000 : 0
}

function sumDurationForDate(dateStr: string) {
  const entries = entriesByDate.value.get(dateStr) || []
  return entries.reduce((acc, e) => acc + getDurationForDate(e, dateStr), 0)
}

// Get project color for a time entry
function getProjectColor(projectId: string | null): string | null {
  if (!projectId) return null
  const project = projects.value.find(
    (p: Project) => p.id.toLowerCase() === projectId.toLowerCase()
  )
  return project?.color || null
}

function getTag(tagId: string) {
  return tagsStore.tags.find((t) => t.id === tagId)
}

// Get entry background style with project color
function getEntryBackgroundStyle(entry: TimeEntryViewModel) {
  const color = getProjectColor(entry.projectId)
  if (!color) return {}

  return {
    '--project-color': color
  }
}

// Helper to position entries in the hourly grid
function getEntryStyle(
  entry: TimeEntryViewModel,
  allEntriesForDay: TimeEntryViewModel[],
  currentDayObj: Date
) {
  // Sort all entries for the day by start time
  const sorted = [...allEntriesForDay].sort(
    (a, b) => new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime()
  )

  // Assign columns for side-by-side splitting
  const columns: (typeof sorted)[] = []
  let myColIndex = 0

  for (const e of sorted) {
    let placed = false
    const eStart = new Date(e.timeStart).getTime()
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]!
      const lastInCol = col[col.length - 1]!
      const lastEnd = new Date(lastInCol.timeEnd || new Date().toISOString()).getTime()
      if (eStart >= lastEnd) {
        col.push(e)
        if (e.id === entry.id) myColIndex = i
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([e])
      if (e.id === entry.id) myColIndex = columns.length - 1
    }
  }

  const numCols = columns.length

  // Calculate boundaries for the specific day
  const dayStart = new Date(
    currentDayObj.getFullYear(),
    currentDayObj.getMonth(),
    currentDayObj.getDate(),
    0,
    0,
    0,
    0
  )
  const dayEnd = new Date(
    currentDayObj.getFullYear(),
    currentDayObj.getMonth(),
    currentDayObj.getDate(),
    23,
    59,
    59,
    999
  )

  const startD = new Date(entry.timeStart)
  const endD = new Date(entry.timeEnd || new Date().toISOString())

  // Cap to the current day's boundaries
  const effectiveStart = startD < dayStart ? dayStart : startD
  const effectiveEnd = endD > dayEnd ? dayEnd : endD

  const startMinutes = effectiveStart.getHours() * 60 + effectiveStart.getMinutes()
  const durationMinutes = (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000

  // Percentages relative to 24 hours (1440 minutes)
  const top = (startMinutes / 1440) * 100
  const height = (Math.max(durationMinutes, 15) / 1440) * 100 // minimum 15 mins height

  return {
    top: `${top}%`,
    height: `${height}%`,
    left: `calc(${(myColIndex / numCols) * 100}% + 2px)`,
    width: `calc(${(1 / numCols) * 100}% - 4px)` // tiny gap
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-4 max-w-7xl mx-auto w-full gap-3">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="text-primary-500 w-7 h-7" />
          Calendar
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Calendar overview of your time entries
        </p>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5">
          <UButton
            label="Month"
            size="sm"
            :color="viewMode === 'month' ? 'primary' : 'neutral'"
            :variant="viewMode === 'month' ? 'solid' : 'soft'"
            @click="viewMode = 'month'"
          />
          <UButton
            label="Week"
            size="sm"
            :color="viewMode === 'week' ? 'primary' : 'neutral'"
            :variant="viewMode === 'week' ? 'solid' : 'soft'"
            @click="viewMode = 'week'"
          />
          <UButton
            label="Day"
            size="sm"
            :color="viewMode === 'day' ? 'primary' : 'neutral'"
            :variant="viewMode === 'day' ? 'solid' : 'soft'"
            @click="viewMode = 'day'"
          />
        </div>
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
        <UButton variant="soft" color="primary" @click="goToday">Today</UButton>
        <div
          class="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            color="neutral"
            @click="prevPeriod"
          />
          <div class="w-36 text-center font-semibold text-gray-800 dark:text-gray-100">
            {{ monthName }}
          </div>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            color="neutral"
            @click="nextPeriod"
          />
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div
      class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0"
    >
      <!-- Header (Days of week) -->
      <div
        v-if="viewMode !== 'day'"
        class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0 flex"
      >
        <div
          v-if="viewMode === 'week'"
          class="w-14 shrink-0 border-r border-gray-200 dark:border-gray-700"
        ></div>
        <div class="flex-1 grid grid-cols-7">
          <div
            v-for="day in weekDays"
            :key="day"
            class="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {{ day }}
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0"
      >
        <!-- Spacer for Y-axis -->
        <div class="w-14 shrink-0 border-r border-gray-200 dark:border-gray-700"></div>
        <div
          class="flex-1 p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
        >
          {{ weekDays[((calendarDays[0]?.getDay() || 1) + 6) % 7] }}
        </div>
      </div>

      <!-- Month View Body -->
      <div v-if="viewMode === 'month'" class="flex-1 grid grid-cols-7 grid-rows-5 h-full min-h-0">
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="border-r border-b border-gray-100 dark:border-gray-700/50 p-1 min-h-0 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer"
          :class="{
            'bg-gray-50/50 dark:bg-gray-900/20 opacity-60': day.getMonth() !== currentMonth,
            'border-r-0': (idx + 1) % 7 === 0,
            'border-b-0': idx >= 28
          }"
          @click="openCreate(day)"
        >
          <div class="flex justify-between items-center pointer-events-none">
            <span
              class="text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full"
              :class="{
                'bg-primary-500 text-white shadow-sm':
                  formatDateStr(day) === formatDateStr(new Date()),
                'text-gray-900 dark:text-gray-100':
                  formatDateStr(day) !== formatDateStr(new Date()) &&
                  day.getMonth() === currentMonth,
                'text-gray-400': day.getMonth() !== currentMonth
              }"
            >
              {{ day.getDate() }}
            </span>
            <span
              v-if="sumDurationForDate(formatDateStr(day)) > 0"
              class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mr-1"
            >
              {{ formatDuration(sumDurationForDate(formatDateStr(day))) }}
            </span>
          </div>

          <!-- Month Entries -->
          <div
            class="flex-1 overflow-hidden space-y-0.5 pointer-events-none group-hover:pointer-events-auto mt-0.5"
          >
            <div
              v-for="entry in (entriesByDate.get(formatDateStr(day)) || []).slice(0, 1)"
              :key="entry.id"
              class="text-[10px] leading-tight px-1 py-0.5 rounded border transition-colors flex justify-between gap-1 shadow-sm cursor-pointer pointer-events-auto"
              :class="
                getProjectColor(entry.projectId)
                  ? 'project-colored-entry'
                  : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-100 dark:border-primary-800/40 hover:border-primary-300 dark:hover:border-primary-700'
              "
              :style="getEntryBackgroundStyle(entry)"
              @click.stop="openEdit(entry)"
            >
              <span class="font-medium truncate">{{ entry.description || 'No description' }}</span>
              <span class="font-bold shrink-0 opacity-80">{{
                formatDuration(getDurationForDate(entry, formatDateStr(day)))
              }}</span>
            </div>
            <div
              v-if="(entriesByDate.get(formatDateStr(day)) || []).length > 1"
              class="text-[9px] font-semibold text-gray-500 dark:text-gray-400 text-center cursor-pointer pointer-events-auto hover:text-primary-500"
              @click.stop="goToDayView(day)"
            >
              +{{ (entriesByDate.get(formatDateStr(day)) || []).length - 1 }} more
            </div>
          </div>
        </div>
      </div>

      <!-- Hourly Timeline (Week & Day View) -->
      <div
        v-else
        class="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800 relative"
      >
        <div class="flex flex-row w-full min-h-[960px] h-full">
          <!-- Y-axis labels -->
          <div
            class="w-14 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0 flex flex-col"
          >
            <div
              v-for="h in hours"
              :key="h"
              class="flex-1 text-right pr-2 text-[10px] text-gray-400 font-mono relative"
            >
              <span
                class="absolute right-2 bg-gray-50 dark:bg-gray-900 px-1"
                :class="h === 0 ? 'top-0' : '-top-2'"
                >{{
                  h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : h - 12 + ' PM'
                }}</span
              >
            </div>
          </div>

          <!-- Days Grid -->
          <div class="flex-1 relative flex flex-col">
            <!-- Horizontal grid lines -->
            <div class="absolute inset-0 pointer-events-none flex flex-col">
              <div
                v-for="h in hours"
                :key="h"
                class="flex-1 border-t border-gray-200 dark:border-gray-600"
              ></div>
            </div>

            <!-- Columns container -->
            <div class="absolute inset-0 flex">
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="flex-1 border-r border-gray-200 dark:border-gray-600 relative flex flex-col"
              >
                <div
                  v-for="h in hours"
                  :key="h"
                  class="flex-1 cursor-pointer hover:bg-primary-50/50 dark:hover:bg-primary-900/10 border-t border-transparent"
                  @click="openCreate(day, h)"
                ></div>

                <!-- Hourly Entries -->
                <div
                  v-for="entry in entriesByDate.get(formatDateStr(day))"
                  :key="entry.id"
                  class="absolute rounded border p-1 cursor-pointer hover:shadow-md hover:z-10 transition-shadow overflow-hidden shadow-sm flex flex-col"
                  :class="
                    getProjectColor(entry.projectId)
                      ? 'project-colored-entry'
                      : 'bg-primary-100 dark:bg-primary-900/70 border-primary-300 dark:border-primary-700'
                  "
                  :style="{
                    ...getEntryStyle(entry, entriesByDate.get(formatDateStr(day)) || [], day),
                    ...getEntryBackgroundStyle(entry)
                  }"
                  @click.stop="openEdit(entry)"
                >
                  <div
                    class="text-[10px] font-bold leading-none mb-0.5"
                    :class="
                      getProjectColor(entry.projectId)
                        ? ''
                        : 'text-primary-800 dark:text-primary-200'
                    "
                  >
                    {{ formatDuration(getDurationForDate(entry, formatDateStr(day))) }}
                  </div>
                  <div
                    class="text-[11px] leading-tight font-medium line-clamp-2"
                    :class="getProjectColor(entry.projectId) ? '' : 'text-gray-900 dark:text-white'"
                  >
                    {{ entry.description || '(No description)' }}
                  </div>

                  <div
                    v-if="
                      getDurationForDate(entry, formatDateStr(day)) >= 3600 &&
                      (entry.issueId || (entry.tagIds && entry.tagIds.length))
                    "
                    class="mt-1 flex flex-wrap gap-1 overflow-hidden"
                  >
                    <span
                      v-if="entry.issueId"
                      class="flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded bg-white/40 dark:bg-black/30 truncate"
                      :class="
                        getProjectColor(entry.projectId)
                          ? ''
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      "
                    >
                      <UIcon name="i-lucide-check-square" class="text-[9px] opacity-70 shrink-0" />
                      <span class="truncate">{{
                        issuesStore.issues.find((i) => i.id === entry.issueId)?.name ||
                        entry.issueTitle ||
                        'Issue ' + entry.issueId.split('-')[0]
                      }}</span>
                    </span>
                    <span
                      v-for="tagId in entry.tagIds || []"
                      :key="tagId"
                      class="flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded truncate border"
                      :class="
                        getTag(tagId)?.color
                          ? 'project-colored-badge'
                          : getProjectColor(entry.projectId)
                            ? 'bg-white/40 dark:bg-black/30 border-transparent text-inherit'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      "
                      :style="
                        getTag(tagId)?.color ? { '--project-color': getTag(tagId)?.color! } : {}
                      "
                    >
                      <UIcon name="i-lucide-tag" class="text-[9px] opacity-70 shrink-0" />
                      <span class="truncate">{{ getTag(tagId)?.name || 'Tag' }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppTimeEntryDialog
      v-model:open="dialogOpen"
      :entry="editingEntry"
      :initial-time-start="initialTimeStart"
      :initial-time-end="initialTimeEnd"
      @saved="onDialogSaved"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.3);
}
</style>
