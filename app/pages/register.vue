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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const emailError = computed(() =>
  form.value.email && !emailRegex.test(form.value.email) ? 'Enter a valid email address' : undefined
)

const fieldErrors = ref<{ [k: string]: string | undefined }>({
  firstName: undefined,
  username: undefined,
  email: undefined,
  password: undefined,
  confirmPassword: undefined
})

function validateFields(): boolean {
  fieldErrors.value.firstName = form.value.firstName.trim() ? undefined : 'First name is required'
  fieldErrors.value.username = form.value.username.trim() ? undefined : 'Username is required'
  fieldErrors.value.email = form.value.email.trim() ? undefined : 'Email is required'
  fieldErrors.value.password = form.value.password ? undefined : 'Password is required'
  fieldErrors.value.confirmPassword = !form.value.confirmPassword
    ? 'Please confirm your password'
    : !passwordsMatch.value
      ? 'Passwords do not match'
      : undefined
  return Object.values(fieldErrors.value).every((e) => !e) && !emailError.value
}

let redirectTimer: ReturnType<typeof setTimeout> | null = null
onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})

async function onRegister() {
  if (loading.value) return
  if (!validateFields()) return

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

    <form v-if="!success" class="flex flex-col gap-4" novalidate @submit.prevent="onRegister">
      <!-- Names -->
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="First Name" :error="fieldErrors.firstName">
          <UInput v-model="form.firstName" placeholder="Jane" class="w-full" autofocus />
        </UFormField>
        <UFormField label="Last Name">
          <UInput v-model="form.lastName" placeholder="Doe" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="Username" :error="fieldErrors.username">
        <UInput
          v-model="form.username"
          placeholder="jdoe88"
          icon="i-lucide-user"
          autocomplete="username"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Email" :error="fieldErrors.email || emailError">
        <UInput
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          icon="i-lucide-mail"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <!-- Password -->
      <UFormField label="Password" :error="fieldErrors.password">
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <!-- Confirm Password -->
      <UFormField label="Confirm Password" :error="fieldErrors.confirmPassword">
        <UInput
          v-model="form.confirmPassword"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-check-circle"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <UAlert v-if="errorMsg" color="error" variant="soft" :description="errorMsg" />

      <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
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
