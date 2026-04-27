<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store'
import { useWorkspacesStore } from '~/stores/workspaces.store'

const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()
const router = useRouter()

const links = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Projects', icon: 'i-lucide-briefcase', to: '/projects' },
  { label: 'Reports', icon: 'i-lucide-bar-chart-3', to: '/reports' },
  { label: 'Team', icon: 'i-lucide-users', to: '/team' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
]

const selectedWorkspaceId = computed({
  get: () => workspacesStore.activeWorkspaceId,
  set: (id) => {
    if (id) workspacesStore.setActiveWorkspace(id)
  }
})

const userMenuItems = computed(() => [
  [
    {
      label: authStore.currentUser?.username || 'User',
      slot: 'account',
      disabled: true
    }
  ],
  [
    { label: 'Profile', icon: 'i-lucide-user' },
    { label: 'Keybindings', icon: 'i-lucide-keyboard' }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: () => {
        authStore.clearSession()
        router.push('/login')
      }
    }
  ]
])
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shrink-0"
    >
      <div class="p-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="text-white text-xl" />
          </div>
          <span class="font-bold text-lg tracking-tight">SP1 Time</span>
        </div>
      </div>

      <nav class="flex-1 px-4 py-2">
        <UNavigationMenu orientation="vertical" :items="links" highlight />
      </nav>

      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
          Version 0.1.0-alpha
        </p>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header
        class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center justify-between px-8 shrink-0"
      >
        <div class="flex items-center gap-4">
          <USelectMenu
            v-model="selectedWorkspaceId"
            :items="workspacesStore.workspaces"
            value-key="id"
            label-key="name"
            class="w-48"
            placeholder="Select Workspace"
          />
        </div>

        <div class="flex items-center gap-4">
          <UColorModeButton />

          <UDropdownMenu :items="userMenuItems" :content="{ side: 'bottom', align: 'end' }">
            <UButton variant="ghost" color="neutral" class="rounded-full p-0">
              <UAvatar :alt="authStore.currentUser?.username || 'User'" size="sm" />
            </UButton>

            <template #account>
              <div class="text-left">
                <p class="text-xs text-gray-400">Signed in as</p>
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ authStore.currentUser?.email }}
                </p>
              </div>
            </template>
          </UDropdownMenu>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
