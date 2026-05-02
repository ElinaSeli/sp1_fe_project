<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const capturing = ref(false)
const containerRef = ref<HTMLElement>()

function startCapture() {
  capturing.value = true
  nextTick(() => containerRef.value?.focus())
}

function clear() {
  emit('update:modelValue', '')
}

function onKeydown(e: KeyboardEvent) {
  if (!capturing.value) return
  e.preventDefault()
  e.stopPropagation()

  if (e.key === 'Escape') {
    capturing.value = false
    return
  }

  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Meta')

  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return

  parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
  emit('update:modelValue', parts.join('+'))
  capturing.value = false
}

function onBlur() {
  capturing.value = false
}

const displayParts = computed(() => (props.modelValue ? props.modelValue.split('+') : []))
</script>

<template>
  <div
    ref="containerRef"
    class="flex items-center gap-2 outline-none"
    tabindex="0"
    @keydown="onKeydown"
    @blur="onBlur"
  >
    <div
      class="flex items-center gap-1 min-w-32 px-3 py-1.5 rounded-md border text-sm cursor-pointer select-none transition-colors"
      :class="
        capturing
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400'
      "
      @click="startCapture"
    >
      <template v-if="capturing">
        <span class="text-xs animate-pulse">Press a key…</span>
      </template>
      <template v-else-if="displayParts.length">
        <UKbd
          v-for="(part, i) in displayParts"
          :key="i"
          size="sm"
          :value="part"
        />
      </template>
      <template v-else>
        <span class="text-gray-400 dark:text-gray-500 text-xs">—</span>
      </template>
    </div>

    <UButton
      v-if="modelValue && !capturing"
      icon="i-lucide-x"
      size="xs"
      variant="ghost"
      color="neutral"
      aria-label="Clear binding"
      @click.stop="clear"
    />
  </div>
</template>
