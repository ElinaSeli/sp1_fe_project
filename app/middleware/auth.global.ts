import { useAuthStore } from '~/stores/auth.store'

/**
 * Global Authentication Middleware
 *
 * Ensures that:
 * 1. Guests cannot access protected routes (redirect to /login).
 * 2. Authenticated users cannot access auth routes (redirect to /).
 */
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(to.path)

  // 1. If not authenticated and trying to access a protected route
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/login')
  }

  // 2. If authenticated and trying to access login/register
  if (authStore.isAuthenticated && isPublicRoute) {
    return navigateTo('/')
  }
})
