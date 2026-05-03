<script setup lang="ts">
import { authService } from '~/services'
import { useAuthStore } from '~/stores/auth.store'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const errorMsg = ref<string | null>(null)

const fieldErrors = ref<{ username?: string; password?: string }>({})

function validateFields(): boolean {
  fieldErrors.value.username = form.value.username.trim() ? undefined : 'Username is required'
  fieldErrors.value.password = form.value.password ? undefined : 'Password is required'
  return !fieldErrors.value.username && !fieldErrors.value.password
}

async function onLogin() {
  if (loading.value) return
  if (!validateFields()) return

  errorMsg.value = null
  loading.value = true

  try {
    const response = await authService.login(form.value)

    if (response.error) {
      if (response.error.includes('Internal Server Error') || response.error.includes('500')) {
        errorMsg.value =
          'The server encountered an error. Please try again later or contact support.'
      } else {
        errorMsg.value = response.error
      }
    } else if (response.data?.access_token) {
      authStore.setSession(response.data.access_token, response.data.expires_in ?? undefined)
      await nextTick()

      await authStore.fetchUserProfile()
      await useWorkspacesStore().fetchWorkspaces()
      await router.push('/')
    } else {
      errorMsg.value = 'Invalid response from server'
    }
  } catch (e: unknown) {
    errorMsg.value =
      (e as { message?: string })?.message || 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="shadow-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-center text-gray-900 dark:text-white">Sign in</h1>
    </template>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="onLogin">
      <UFormField label="Username" :error="fieldErrors.username">
        <UInput
          v-model="form.username"
          placeholder="Enter your username"
          icon="i-lucide-user"
          autofocus
          autocomplete="username"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Password" :error="fieldErrors.password">
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <UAlert v-if="errorMsg" color="error" variant="soft" :description="errorMsg" />

      <UButton type="submit" color="primary" block :loading="loading"> Sign in </UButton>

      <NuxtLink to="/forgot-password" class="text-xs text-primary-500 hover:underline text-center">
        Forgot password?
      </NuxtLink>
    </form>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        Don't have an account?
        <NuxtLink to="/register" class="text-primary-500 hover:underline font-medium">
          Register
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
