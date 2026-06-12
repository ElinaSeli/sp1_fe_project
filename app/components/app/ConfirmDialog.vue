<script setup lang="ts">
withDefaults(
  defineProps<{
    open?: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmColor?: 'error' | 'primary' | 'neutral' | 'warning' | 'success'
    icon?: string
    loading?: boolean
  }>(),
  { open: false }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: [value: boolean]
}>()

function onConfirm() {
  emit('close', true)
}

function onCancel() {
  emit('close', false)
}

function onUpdateOpen(val: boolean) {
  if (!val) emit('close', false)
}
</script>

<template>
  <UModal :open="open" @update:open="onUpdateOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon v-if="icon" :name="icon" class="text-red-500" />
            <h2 class="text-lg font-semibold">{{ title }}</h2>
          </div>
        </template>

        <p v-if="description" class="text-sm text-gray-600 dark:text-gray-300">
          {{ description }}
        </p>

        <div class="flex justify-end gap-3 pt-4">
          <UButton color="neutral" variant="ghost" @click="onCancel">
            {{ cancelLabel ?? 'Cancel' }}
          </UButton>
          <UButton
            :color="confirmColor ?? 'primary'"
            :loading="loading ?? false"
            @click="onConfirm"
          >
            {{ confirmLabel ?? 'Confirm' }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
