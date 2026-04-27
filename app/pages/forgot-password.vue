<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const form = ref({ email: '' })
const loading = ref(false)
const submitted = ref(false)

async function onSubmit() {
  if (loading.value) return
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 800))
  submitted.value = true
  loading.value = false
}
</script>

<template>
  <UCard class="shadow-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-center text-gray-900 dark:text-white">
        Reset password
      </h1>
    </template>

    <div v-if="submitted" class="flex flex-col items-center gap-4 py-2">
      <UIcon name="i-lucide-mail-check" class="text-4xl text-primary-500" />
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        If an account with that email exists, you'll receive a reset link shortly.
      </p>
    </div>

    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <UFormField label="Email">
        <UInput
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          icon="i-lucide-mail"
          autofocus
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UButton type="submit" color="primary" block :loading="loading">Send reset link</UButton>
    </form>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        Remembered it?
        <NuxtLink to="/login" class="text-primary-500 hover:underline font-medium">
          Sign in
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
