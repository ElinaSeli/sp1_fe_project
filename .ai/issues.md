# Project Issues — feature/auth-ui

Last reviewed: 2026-04-27. Significant issues found in this session.

---

## Architecture (functional, low priority)

**5. `useCookie` called inside async context — `app/composables/useApiClient.ts:22`**

- `useCookie('auth_token').value` called inside async `request()`, outside Vue setup
- Patched with `await nextTick()` in login.vue but root cause remains
- Every authenticated request re-creates a cookie ref outside setup context
- Fix: capture `useCookie` at composable init level, or read token from the auth store ref directly

**6. `useCookie` called inside Pinia action — `app/stores/auth.store.ts:28`**

- `useCookie('auth_token', { maxAge: expiresIn }).value = newToken` inside `setSession()`
- Pinia actions run outside Vue setup; works in SPA but fragile
- Fix: initialize cookie with default options in setup; update `.value` and `maxAge` via a single ref

---

## Backend alignment

**7. `GET /api/users/me` not in Swagger spec — `app/services/auth.service.ts:56`**

- Used for profile fetch post-login; endpoint not documented
- Mock covers it; will 404 on real BE until endpoint is added or path corrected

**8. Projects endpoints not in Swagger spec — `app/services/projects.service.ts`**

- `GET/POST/PATCH/DELETE /api/workspaces/{id}/projects` — none appear in the spec
- `services/index.ts` comment says "placeholder" but service is fully implemented
- Verify BE has these routes before wiring up UI

---

## Minor / Polish

**11. "New Project" button is a stub — `app/pages/index.vue:37`**

- No click handler or route; silently does nothing

**12. `/forgot-password` page — `app/pages/forgot-password.vue`**

- UI-only stub; submit shows success message after fake delay, no real API call yet
