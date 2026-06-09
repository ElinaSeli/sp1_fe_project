<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo('/time-entries')
    }
  ]
})
</script>

<template>
  <div></div>
</template>
