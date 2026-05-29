<script setup lang="ts">
const authStore = useAuthStore()

const account = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: ''
})

const password = reactive({
  current: '',
  next: '',
  confirm: ''
})

onMounted(async () => {
  await authStore.fetchUserProfile()
  const u = authStore.currentUser
  if (u) {
    account.firstName = u.firstName
    account.lastName = u.lastName
    account.username = u.username
    account.email = u.email
  }
})

function saveAccount() {
  // TODO: wire to user profile update API
  console.warn('[settings] saveAccount — TODO')
}

function changePassword() {
  // TODO: wire to password change API
  console.warn('[settings] changePassword — TODO')
}
</script>

<template>
  <div class="space-y-8 py-4">
    <!-- Account section -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="text-gray-500" />
          <span class="font-semibold text-gray-800 dark:text-gray-100">Account</span>
        </div>
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="First name">
          <UInput v-model="account.firstName" placeholder="First name" class="w-full" />
        </UFormField>

        <UFormField label="Last name">
          <UInput v-model="account.lastName" placeholder="Last name" class="w-full" />
        </UFormField>

        <UFormField label="Username">
          <UInput v-model="account.username" placeholder="Username" class="w-full" disabled />
        </UFormField>

        <UFormField label="Email">
          <UInput
            v-model="account.email"
            type="email"
            placeholder="Email"
            class="w-full"
            disabled
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="primary" @click="saveAccount">Save changes</UButton>
        </div>
      </template>
    </UCard>

    <!-- Password section -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-lock" class="text-gray-500" />
          <span class="font-semibold text-gray-800 dark:text-gray-100">Change password</span>
        </div>
      </template>

      <div class="space-y-4 max-w-sm">
        <UFormField label="Current password">
          <UInput
            v-model="password.current"
            type="password"
            placeholder="Current password"
            class="w-full"
          />
        </UFormField>

        <UFormField label="New password">
          <UInput
            v-model="password.next"
            type="password"
            placeholder="New password"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Confirm new password">
          <UInput
            v-model="password.confirm"
            type="password"
            placeholder="Confirm new password"
            class="w-full"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="primary" @click="changePassword">Change password</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
