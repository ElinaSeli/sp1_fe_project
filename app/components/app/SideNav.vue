<script setup lang="ts">
const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()
const route = useRoute()
const colorMode = useColorMode()

const navLinks = [
  { to: '/', icon: 'i-lucide-layout-dashboard', label: 'Dashboard' },
  { to: '/reports', icon: 'i-lucide-bar-chart-3', label: 'Reports' },
  {
    to: '/workspaces',
    icon: 'i-lucide-briefcase',
    label: 'Workspaces'
  },
  {
    to: '/integrations',
    icon: 'i-lucide-plug-2',
    label: 'Integrations'
  },
  {
    to: '/settings',
    icon: 'i-lucide-settings',
    label: 'Settings'
  }
]

const selectedWorkspaceId = computed({
  get: () => workspacesStore.activeWorkspaceId || undefined,
  set: (val) => {
    if (val) workspacesStore.setActiveWorkspace(val)
  }
})

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v) => {
    colorMode.preference = v ? 'dark' : 'light'
  }
})

const onLogout = async () => {
  authStore.clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <nav
    class="w-64 bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 z-10 transition-colors duration-300 h-full overflow-hidden backdrop-blur-xl"
  >
    <div class="p-6">
      <AppLogo class="h-8 w-auto text-emerald-600 dark:text-emerald-400" />
    </div>

    <div class="flex-1 px-4 space-y-1 overflow-y-auto">
      <!-- Workspace switcher -->
      <div class="mb-6 px-2">
        <label
          class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block px-1"
        >
          Workspace
        </label>
        <USelectMenu
          v-model="selectedWorkspaceId"
          :items="
            workspacesStore.workspaces.map((w) => ({
              ...w,
              label: w.name,
              description: w.description || undefined
            }))
          "
          value-key="id"
          label-key="name"
          class="w-full"
          placeholder="Select Workspace"
          :ui="{
            trigger:
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors'
          }"
        >
          <template #leading>
            <UIcon name="i-lucide-building-2" class="text-gray-400" />
          </template>
        </USelectMenu>
      </div>

      <nav class="space-y-1">
        <UButton
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :icon="link.icon"
          :variant="route.path === link.to ? 'soft' : 'ghost'"
          :color="route.path === link.to ? 'emerald' : 'neutral'"
          class="justify-start w-full transition-all duration-200"
          :class="[
            route.path === link.to
              ? 'font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:translate-x-1'
          ]"
          size="md"
        >
          {{ link.label }}
        </UButton>
      </nav>
    </div>

    <!-- Bottom Panel -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
      <div class="flex items-center justify-between mb-4 px-2">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <UAvatar
            :alt="authStore.currentUser?.username || 'U'"
            size="sm"
            class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
              {{ authStore.currentUser?.username || 'User' }}
            </p>
            <p
              class="text-[10px] text-gray-500 dark:text-gray-400 truncate tracking-tight uppercase"
            >
              Free Plan
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-2">
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          variant="ghost"
          color="neutral"
          size="sm"
          class="justify-center"
          @click="isDark = !isDark"
        />
        <UButton
          to="/settings"
          icon="i-lucide-settings"
          variant="ghost"
          color="neutral"
          size="sm"
          class="justify-center"
        />
      </div>

      <UButton
        icon="i-lucide-log-out"
        variant="ghost"
        color="error"
        size="sm"
        class="w-full justify-start text-gray-500 hover:text-error-600"
        @click="onLogout"
      >
        Logout
      </UButton>
    </div>
  </nav>
</template>
