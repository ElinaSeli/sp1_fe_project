<script setup lang="ts">
// TODO: persist via API / user settings store once available
const prefs = reactive({
  emailNotifications: true,
  desktopNotifications: false,
  // TODO: arbitrary time value, replace with real user preference
  dailySummary: false
})
</script>

<template>
  <div class="py-4">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-bell" class="text-gray-500" />
          <span class="font-semibold text-gray-800 dark:text-gray-100">Notifications</span>
        </div>
      </template>

      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Email notifications</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Receive activity summaries and alerts by email</p>
          </div>
          <USwitch v-model="prefs.emailNotifications" />
        </div>

        <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Desktop notifications</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Show browser or OS push notifications</p>
          </div>
          <USwitch v-model="prefs.desktopNotifications" />
        </div>

        <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div>
            <!-- TODO: time value is placeholder, real default TBD -->
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Daily summary at 18:00-TODO</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Get a daily digest of tracked time at end of day</p>
          </div>
          <USwitch v-model="prefs.dailySummary" />
        </div>
      </div>
    </UCard>
  </div>
</template>
