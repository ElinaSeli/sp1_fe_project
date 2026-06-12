<script setup lang="ts">
/**
 * Main App Entry Point
 *
 * We use NuxtLayout to support dynamic layouts (like 'auth' for login/register).
 * UApp is the root component for Nuxt UI v4.
 */
useKeybindings()

useHead({
  title: 'SP1 Time Tracking',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
})

const appConfig = useAppConfig()
onMounted(() => {
  const savedColor = localStorage.getItem('nuxt-ui-primary')
  if (savedColor) {
    appConfig.ui.colors.primary = savedColor
  }
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<style>
/* Global styles */
html,
body,
#__nuxt {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
