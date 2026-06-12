import { defineStore } from 'pinia'
import type { Integration, IntegrationRequest, TestConnectionRequest } from '~/types'
import { integrationService } from '~/services'

export const useIntegrationStore = defineStore('integration', () => {
  const integration = ref<Integration | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const testStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
  const testMessage = ref<string | null>(null)

  async function fetchIntegration(workspaceId: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await integrationService.get(workspaceId)
      if (response.error) {
        // 404 means no integration yet — not an error state
        integration.value = null
      } else {
        integration.value = response.data
      }
    } catch {
      error.value = 'Failed to fetch integration'
    } finally {
      isLoading.value = false
    }
  }

  async function createIntegration(
    workspaceId: string,
    payload: IntegrationRequest
  ): Promise<Integration | null> {
    isLoading.value = true
    error.value = null
    try {
      const response = await integrationService.create(workspaceId, payload)
      if (response.error || !response.data) {
        error.value = response.error ?? 'Failed to create integration'
        return null
      }
      integration.value = response.data
      return response.data
    } catch {
      error.value = 'Failed to create integration'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateIntegration(
    workspaceId: string,
    id: string,
    payload: IntegrationRequest
  ): Promise<Integration | null> {
    isLoading.value = true
    error.value = null
    try {
      const response = await integrationService.update(workspaceId, id, payload)
      if (response.error || !response.data) {
        error.value = response.error ?? 'Failed to update integration'
        return null
      }
      integration.value = response.data
      return response.data
    } catch {
      error.value = 'Failed to update integration'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function deleteIntegration(workspaceId: string, id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await integrationService.delete(workspaceId, id)
      if (response.error) {
        error.value = response.error
        return false
      }
      integration.value = null
      return true
    } catch {
      error.value = 'Failed to delete integration'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function testConnection(workspaceId: string, payload: TestConnectionRequest) {
    testStatus.value = 'testing'
    testMessage.value = null
    try {
      const response = await integrationService.testConnection(workspaceId, payload)
      if (response.error || !response.data) {
        testStatus.value = 'error'
        testMessage.value = response.error ?? 'Connection test failed'
        return
      }
      testStatus.value = response.data.success ? 'success' : 'error'
      testMessage.value = response.data.message
    } catch {
      testStatus.value = 'error'
      testMessage.value = 'Connection test failed'
    }
  }

  function resetTestStatus() {
    testStatus.value = 'idle'
    testMessage.value = null
  }

  return {
    integration,
    isLoading,
    error,
    testStatus,
    testMessage,
    fetchIntegration,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    resetTestStatus
  }
})
