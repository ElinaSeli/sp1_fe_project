import { defineStore } from 'pinia'
import { authService } from '~/services'
import type { AuthUser } from '~/types'

/**
 * useAuthStore
 *
 * Manages the authenticated user session and JWT token.
 * Uses pinia-plugin-persistedstate to stay logged in across refreshes.
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    // --- State ---
    const currentUser = ref<AuthUser | null>(null)
    const token = useCookie('auth_token')

    // If no token cookie on init, wipe any stale user left in localStorage.
    if (!token.value) currentUser.value = null

    // --- Getters ---
    const isAuthenticated = computed(() => !!token.value)

    // --- Actions ---
    function setSession(newToken: string, expiresIn?: number) {
      // Re-initialize the cookie with maxAge from the server's expires_in so the
      // cookie lifetime matches the JWT lifetime. Falls back to session cookie if omitted.
      useCookie('auth_token', { maxAge: expiresIn }).value = newToken
      token.value = newToken
    }

    function clearSession() {
      currentUser.value = null
      token.value = null
    }

    async function fetchUserProfile() {
      const { data, error } = await authService.me()
      if (!error && data) {
        currentUser.value = data
      }
      return { data, error }
    }

    return {
      currentUser,
      token,
      isAuthenticated,
      setSession,
      clearSession,
      fetchUserProfile
    }
  },
  {
    persist: {
      // Only persist the user profile in localStorage.
      // The token is handled by useCookie.
      pick: ['currentUser']
    }
  }
)
