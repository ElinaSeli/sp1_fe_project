<script setup lang="ts">
// TODO: persist via API / user settings store once available
const cookies = reactive({
  necessary: true, // always on, read-only
  analytics: false,
  marketing: false
})
</script>

<template>
  <div class="py-4">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-shield" class="text-gray-500" />
          <span class="font-semibold text-gray-800 dark:text-gray-100">Cookie preferences</span>
        </div>
      </template>

      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Necessary cookies</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Required for the application to function. Cannot be disabled.</p>
          </div>
          <USwitch :model-value="true" disabled />
        </div>

        <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Analytics cookies</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Help us understand how you use the app to improve the experience.</p>
          </div>
          <USwitch v-model="cookies.analytics" />
        </div>

        <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Marketing cookies</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Used to show relevant promotional content.</p>
          </div>
          <USwitch v-model="cookies.marketing" />
        </div>
      </div>
    </UCard>
  </div>
</template>
