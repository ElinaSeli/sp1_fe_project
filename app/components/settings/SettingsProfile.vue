<script setup lang="ts">
const authStore = useAuthStore()
const { dateFormat, setFormat, previewFormatted } = useDateFormat()

const dateFormatOptions = [
  { value: 'american' as const, label: 'MM/DD/YYYY' },
  { value: 'european' as const, label: 'DD/MM/YYYY' }
]

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

const appConfig = useAppConfig()
const primaryColor = ref(appConfig.ui.colors.primary)
const showAllColors = ref(false)

const colorOptions = [
  // Top 9 recommended / diverse colors
  { name: 'emerald', bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-500' },
  { name: 'blue', bgClass: 'bg-blue-500', ringClass: 'ring-blue-500' },
  { name: 'indigo', bgClass: 'bg-indigo-500', ringClass: 'ring-indigo-500' },
  { name: 'violet', bgClass: 'bg-violet-500', ringClass: 'ring-violet-500' },
  { name: 'rose', bgClass: 'bg-rose-500', ringClass: 'ring-rose-500' },
  { name: 'orange', bgClass: 'bg-orange-500', ringClass: 'ring-orange-500' },
  { name: 'amber', bgClass: 'bg-amber-500', ringClass: 'ring-amber-500' },
  { name: 'cyan', bgClass: 'bg-cyan-500', ringClass: 'ring-cyan-500' },
  { name: 'slate', bgClass: 'bg-slate-500', ringClass: 'ring-slate-500' },
  // Extended colors
  { name: 'pink', bgClass: 'bg-pink-500', ringClass: 'ring-pink-500' },
  { name: 'fuchsia', bgClass: 'bg-fuchsia-500', ringClass: 'ring-fuchsia-500' },
  { name: 'red', bgClass: 'bg-red-500', ringClass: 'ring-red-500' },
  { name: 'yellow', bgClass: 'bg-yellow-500', ringClass: 'ring-yellow-500' },
  { name: 'lime', bgClass: 'bg-lime-500', ringClass: 'ring-lime-500' },
  { name: 'green', bgClass: 'bg-green-500', ringClass: 'ring-green-500' },
  { name: 'teal', bgClass: 'bg-teal-500', ringClass: 'ring-teal-500' },
  { name: 'sky', bgClass: 'bg-sky-500', ringClass: 'ring-sky-500' },
  { name: 'purple', bgClass: 'bg-purple-500', ringClass: 'ring-purple-500' },
  { name: 'gray', bgClass: 'bg-gray-500', ringClass: 'ring-gray-500' },
  { name: 'zinc', bgClass: 'bg-zinc-500', ringClass: 'ring-zinc-500' },
  { name: 'neutral', bgClass: 'bg-neutral-500', ringClass: 'ring-neutral-500' },
  { name: 'stone', bgClass: 'bg-stone-500', ringClass: 'ring-stone-500' }
]

const visibleColors = computed(() =>
  showAllColors.value ? colorOptions : colorOptions.slice(0, 9)
)

onMounted(async () => {
  const saved = localStorage.getItem('nuxt-ui-primary')
  if (saved) {
    primaryColor.value = saved
  }

  watch(primaryColor, (newColor) => {
    localStorage.setItem('nuxt-ui-primary', newColor)
    appConfig.ui.colors.primary = newColor
  })

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

    <!-- Appearance section -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-palette" class="text-gray-500" />
          <span class="font-semibold text-gray-800 dark:text-gray-100">Appearance</span>
        </div>
      </template>

      <div class="space-y-6 max-w-sm">
        <UFormField label="Primary Theme Color">
          <div class="flex flex-wrap gap-3 mt-2 items-center">
            <button
              v-for="color in visibleColors"
              :key="color.name"
              type="button"
              class="w-8 h-8 rounded-full shadow-sm ring-2 ring-offset-2 dark:ring-offset-gray-900 transition-all border border-black/10 dark:border-white/10"
              :class="[
                color.bgClass,
                primaryColor === color.name
                  ? `${color.ringClass} scale-110`
                  : 'ring-transparent opacity-80 hover:opacity-100 hover:scale-105'
              ]"
              :title="color.name"
              @click="primaryColor = color.name"
            />

            <!-- Toggle button -->
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              :title="showAllColors ? 'Show less' : 'Show all colors'"
              @click="showAllColors = !showAllColors"
            >
              <UIcon
                :name="showAllColors ? 'i-lucide-chevron-up' : 'i-lucide-plus'"
                class="w-4 h-4"
              />
            </button>
          </div>
        </UFormField>

        <!-- Date Format -->
        <UFormField label="Date Format">
          <div class="mt-2 space-y-2">
            <div
              class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-fit"
            >
              <button
                v-for="opt in dateFormatOptions"
                :key="opt.value"
                type="button"
                class="px-4 py-2 text-sm font-medium transition-colors focus:outline-none"
                :class="
                  dateFormat === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                "
                @click="setFormat(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500">
              Preview:
              <span class="font-semibold text-gray-600 dark:text-gray-300">{{
                previewFormatted
              }}</span>
            </p>
          </div>
        </UFormField>
      </div>
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
