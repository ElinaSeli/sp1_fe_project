<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const tabs = [
  { label: 'Profile', icon: 'i-lucide-user', slot: 'profile' },
  { label: 'Notifications', icon: 'i-lucide-bell', slot: 'notifications' },
  { label: 'Privacy', icon: 'i-lucide-shield', slot: 'privacy' },
  { label: 'Shortcuts', icon: 'i-lucide-keyboard', slot: 'shortcuts' }
]
</script>

<template>
  <div class="max-w-3xl mx-auto py-8 px-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Manage your account and preferences
      </p>
    </div>

    <UTabs :items="tabs" class="w-full">
      <template #profile>
        <SettingsProfile />
      </template>

      <template #notifications>
        <SettingsNotifications />
      </template>

      <template #privacy>
        <SettingsPrivacy />
      </template>

      <template #shortcuts>
        <SettingsShortcuts />
      </template>
    </UTabs>
  </div>
</template>
