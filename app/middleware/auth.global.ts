import { useAuthStore } from '~/stores/auth.store'

function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1] ?? ''
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (authStore.token && isTokenExpired(authStore.token)) {
    authStore.clearSession()
    return navigateTo('/login')
  }

  const publicRoutes = ['/login', '/register', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (authStore.isAuthenticated && isPublicRoute) {
    return navigateTo('/')
  }
})
