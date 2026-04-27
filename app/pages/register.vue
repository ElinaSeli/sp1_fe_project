<script setup lang="ts">
import { authService } from '~/services'

definePageMeta({
  layout: 'auth'
})

const router = useRouter()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: ''
})

const loading = ref(false)
const errorMsg = ref<string | null>(null)
const success = ref(false)

const passwordsMatch = computed(
  () => !!form.value.confirmPassword && form.value.password === form.value.confirmPassword
)

let redirectTimer: ReturnType<typeof setTimeout> | null = null
onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})

async function onRegister() {
  if (loading.value) return
  if (!form.value.confirmPassword) {
    errorMsg.value = 'Please confirm your password.'
    return
  }
  if (!passwordsMatch.value) {
    errorMsg.value = 'Passwords do not match.'
    return
  }

  errorMsg.value = null
  loading.value = true

  try {
    const { error } = await authService.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      firstName: form.value.firstName,
      lastName: form.value.lastName
    })

    if (error) {
      errorMsg.value = error
    } else {
      success.value = true
      redirectTimer = setTimeout(() => router.push('/login'), 1500)
    }
  } catch {
    errorMsg.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="shadow-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-center text-gray-900 dark:text-white">
        Create account
      </h1>
    </template>

    <form v-if="!success" class="flex flex-col gap-4" @submit.prevent="onRegister">
      <!-- Names -->
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="First Name">
          <UInput v-model="form.firstName" placeholder="Jane" autofocus required />
        </UFormField>
        <UFormField label="Last Name">
          <UInput v-model="form.lastName" placeholder="Doe" required />
        </UFormField>
      </div>

      <UFormField label="Username">
        <UInput
          v-model="form.username"
          placeholder="jdoe88"
          icon="i-lucide-user"
          autocomplete="username"
          required
        />
      </UFormField>

      <UFormField label="Email">
        <UInput
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          icon="i-lucide-mail"
          autocomplete="email"
          required
        />
      </UFormField>

      <!-- Password -->
      <UFormField
        label="Password"
        :error="!passwordsMatch && form.confirmPassword ? 'Passwords do not match' : undefined"
      >
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          autocomplete="new-password"
          required
        />
      </UFormField>

      <!-- Confirm Password -->
      <UFormField label="Confirm Password">
        <UInput
          v-model="form.confirmPassword"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-check-circle"
          autocomplete="new-password"
          required
        />
      </UFormField>

      <UAlert
        v-if="errorMsg"
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        :description="errorMsg"
      />

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        :disabled="!passwordsMatch && form.confirmPassword !== ''"
      >
        Create account
      </UButton>
    </form>

    <div v-else class="text-center py-6 space-y-4">
      <div
        class="inline-flex items-center justify-center w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full text-success-600 dark:text-success-400"
      >
        <UIcon name="i-lucide-check" class="text-2xl" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Account Created!</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Redirecting to login...</p>
      </div>
    </div>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        Already have an account?
        <NuxtLink to="/login" class="text-primary-500 hover:underline font-medium">
          Sign in
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
