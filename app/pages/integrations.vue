<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { IntegrationRequest } from '~/types'

definePageMeta({ layout: 'dashboard' })

const integrationStore = useIntegrationStore()
const workspacesStore = useWorkspacesStore()
const { integration, isLoading, error, testStatus, testMessage } = storeToRefs(integrationStore)
const { activeWorkspaceId } = storeToRefs(workspacesStore)
const toast = useToast()
const confirm = useConfirm()

// --- Add / Edit modal ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const formState = reactive<IntegrationRequest>({ name: '', url: '', apiKey: '' })

function openCreate() {
  isEditing.value = false
  formState.name = ''
  formState.url = ''
  formState.apiKey = ''
  showApiKey.value = false
  integrationStore.resetTestStatus()
  isModalOpen.value = true
}

function openEdit() {
  if (!integration.value) return
  isEditing.value = true
  formState.name = integration.value.name
  formState.url = integration.value.url
  formState.apiKey = integration.value.apiKey
  showApiKey.value = false
  integrationStore.resetTestStatus()
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  integrationStore.resetTestStatus()
}

const canSubmit = computed(
  () => formState.name.trim() && formState.url.trim() && formState.apiKey.trim()
)

async function onTestConnection() {
  if (!activeWorkspaceId.value) return
  await integrationStore.testConnection(activeWorkspaceId.value, {
    url: formState.url.trim(),
    apiKey: formState.apiKey.trim()
  })
}

async function onSubmit() {
  if (!activeWorkspaceId.value || !canSubmit.value) return

  const payload: IntegrationRequest = {
    name: formState.name.trim(),
    url: formState.url.trim(),
    apiKey: formState.apiKey.trim()
  }

  let result
  if (isEditing.value && integration.value) {
    result = await integrationStore.updateIntegration(
      activeWorkspaceId.value,
      integration.value.id,
      payload
    )
  } else {
    result = await integrationStore.createIntegration(activeWorkspaceId.value, payload)
  }

  if (!result) {
    toast.add({
      title: isEditing.value ? 'Failed to update integration' : 'Failed to create integration',
      description: error.value ?? 'An unexpected error occurred.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  toast.add({
    title: isEditing.value ? 'Integration updated' : `"${result.name}" connected`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
  isModalOpen.value = false
}

const showApiKey = ref(false)

async function openDelete() {
  if (!activeWorkspaceId.value || !integration.value) return
  const confirmed = await confirm({
    title: `Remove "${integration.value.name}"?`,
    description: 'This will not delete your imported projects or issues.',
    confirmLabel: 'Remove',
    confirmColor: 'error',
    icon: 'i-lucide-trash-2'
  })
  if (!confirmed) return
  const ok = await integrationStore.deleteIntegration(activeWorkspaceId.value, integration.value.id)
  if (ok) {
    toast.add({ title: 'Integration removed', color: 'success', icon: 'i-lucide-check-circle' })
  } else {
    toast.add({
      title: 'Failed to remove integration',
      description: error.value ?? '',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

onMounted(() => {
  if (activeWorkspaceId.value) integrationStore.fetchIntegration(activeWorkspaceId.value)
})

watch(activeWorkspaceId, (id) => {
  if (id) integrationStore.fetchIntegration(id)
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Integrations
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect external services to sync projects and issues
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" :disabled="!!integration" @click="openCreate">
        Add Integration
      </UButton>
    </div>

    <!-- No workspace selected -->
    <div v-if="!activeWorkspaceId" class="flex flex-col items-center py-16 text-center gap-3">
      <UIcon name="i-lucide-briefcase" class="text-4xl text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Select a workspace to manage integrations
      </p>
    </div>

    <template v-else>
      <!-- Loading skeleton -->
      <div v-if="isLoading && !integration" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="i in 1"
          :key="i"
          class="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      </div>

      <!-- Error state -->
      <div
        v-else-if="error && !integration"
        class="flex flex-col items-center py-16 text-center gap-3"
      >
        <UIcon name="i-lucide-wifi-off" class="text-4xl text-red-400" />
        <p class="text-sm text-red-500">{{ error }}</p>
        <UButton
          variant="soft"
          color="neutral"
          size="sm"
          @click="integrationStore.fetchIntegration(activeWorkspaceId!)"
        >
          Retry
        </UButton>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!isLoading && !integration"
        class="flex flex-col items-center py-20 text-center gap-4"
      >
        <div
          class="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-2"
        >
          <UIcon name="i-lucide-plug-2" class="text-4xl text-emerald-500" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">No integrations yet</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Connect Redmine to sync projects and issues into this workspace.
        </p>
        <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
          Add Integration
        </UButton>
      </div>

      <!-- Integration card -->
      <div v-else-if="integration" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          class="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3"
        >
          <!-- Icon + name -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-950/40"
            >
              <UIcon name="i-simple-icons-redmine" class="text-red-500 text-xl" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-gray-900 dark:text-white truncate">
                {{ integration.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Redmine</p>
            </div>
          </div>

          <!-- Details -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0">
              <UIcon name="i-lucide-link" class="shrink-0 text-gray-400 text-xs" />
              <span class="truncate">{{ integration.url }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800"
          >
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="openEdit"
            >
              Edit
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="openDelete"
            >
              Delete
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Add / Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-simple-icons-redmine" class="text-red-500" />
              <h2 class="text-lg font-semibold">
                {{ isEditing ? 'Edit Integration' : 'Add Redmine Integration' }}
              </h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="onSubmit">
            <UFormField label="Name" name="name" required>
              <UInput
                v-model="formState.name"
                placeholder="e.g. Work Redmine"
                autofocus
                class="w-full"
              />
            </UFormField>

            <UFormField label="Redmine URL" name="url" required>
              <UInput
                v-model="formState.url"
                placeholder="https://redmine.example.com"
                class="w-full"
              />
            </UFormField>

            <UFormField label="API Key" name="apiKey" required>
              <UInput
                v-model="formState.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="Your Redmine API key"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    :icon="showApiKey ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    tabindex="-1"
                    @click="showApiKey = !showApiKey"
                  />
                </template>
              </UInput>
            </UFormField>

            <!-- Test connection -->
            <div class="space-y-2">
              <UButton
                type="button"
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-zap"
                :loading="testStatus === 'testing'"
                :disabled="!formState.url.trim() || !formState.apiKey.trim()"
                @click="onTestConnection"
              >
                Test Connection
              </UButton>
              <div
                v-if="testStatus === 'success'"
                class="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"
              >
                <UIcon name="i-lucide-check-circle" />
                {{ testMessage }}
              </div>
              <div
                v-else-if="testStatus === 'error'"
                class="flex items-center gap-1.5 text-sm text-red-500"
              >
                <UIcon name="i-lucide-x-circle" />
                {{ testMessage }}
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <UButton type="button" color="neutral" variant="ghost" @click="closeModal">
                Cancel
              </UButton>
              <UButton type="submit" color="primary" :loading="isLoading" :disabled="!canSubmit">
                {{ isEditing ? 'Save Changes' : 'Connect' }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
