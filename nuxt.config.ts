// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],

  // Run as SPA. required for Tauri desktop target.
  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light'
  },

  // Backend base URL is injected via NUXT_PUBLIC_API_BASE_URL env variable.
  // NEVER hardcode the IP here — use .env.local or CI/CD secrets instead.
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/'
    }
  },

  routeRules: {
    '/api/**': {
      proxy: 'http://127.0.0.1:8080/api/**'
    },
    '/login': {
      proxy: 'http://127.0.0.1:8080/login'
    }
  },

  // Lock dev server to port 3000 — tauri.conf.json devUrl hardcodes this port.
  // If 3000 is occupied, Nuxt will error loudly rather than silently falling back to 3001
  // (which would leave Tauri pointing at the wrong port).
  devServer: {
    port: 3000
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    preset: 'static'
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
