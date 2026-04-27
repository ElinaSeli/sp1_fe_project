import { defineStore } from 'pinia'
import type { Integration } from '~/types'

/**
 * useIntegrationStore
 *
 * Manages external workspace integrations (e.g., Jira, GitLab).
 */
export const useIntegrationStore = defineStore(
  'integration',
  () => {
    // --- State ---
    const integrations = ref<Integration[]>([])
    const verifyStatus = ref<'idle' | 'verifying' | 'success' | 'error'>('idle')
    const verifyError = ref<string | null>(null)

    // --- Actions ---
    function setIntegrations(list: Integration[]) {
      integrations.value = list
    }

    return {
      integrations,
      verifyStatus,
      verifyError,
      setIntegrations
    }
  },
  {
    persist: {
      pick: ['integrations']
    }
  }
)
