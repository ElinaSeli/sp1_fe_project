# Skill: Deimplementing Mock and Connecting to Real API

How to selectively route specific paths from the Nitro mock middleware to the real Micronaut backend, without deleting the mock entirely.

---

## Architecture

The mock middleware (`server/middleware/01.mockApi.ts`) intercepts all `/api-proxy/*` requests. To connect specific endpoints to the real BE, add them to `REAL_PATHS` and proxy them manually — do NOT delete the mock yet for other endpoints.

```
Browser → /api-proxy/<path>
            ↓
     Nitro mock middleware
            ↓
  path in REAL_PATHS?
   yes → $fetch.raw → real BE (NUXT_PUBLIC_API_BASE_URL)
   no  → handleMockRequest()
```

---

## Env File

**Nuxt only loads `.env`, not `.env.local`.** The c12 config loader defaults `fileName: ".env"` — `.env.local` is silently ignored. Both are gitignored via `.gitignore` (`!.env.example` pattern).

```
# .env  ← correct
# .env.local  ← NEVER loaded by Nuxt/c12
NUXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The env var maps to `runtimeConfig.public.apiBaseUrl` via the `NUXT_PUBLIC_` prefix convention. The dev server must be restarted after creating `.env` — the value is read at startup.

---

## Adding an Endpoint to Real Backend

In `server/middleware/01.mockApi.ts`:

```ts
const REAL_PATHS = new Set(['/login', '/api/users/register', '/api/users/me'])
```

Proxy block (already implemented — extend `REAL_PATHS` only):

```ts
if (REAL_PATHS.has(path)) {
  const {
    public: { apiBaseUrl }
  } = useRuntimeConfig()
  if (!apiBaseUrl) {
    setResponseStatus(event, 503)
    return { message: 'NUXT_PUBLIC_API_BASE_URL is not set — check your .env' }
  }
  const rawBody =
    method !== 'GET' && method !== 'DELETE'
      ? ((await readRawBody(event, 'utf8')) ?? undefined)
      : undefined
  const headers: Record<string, string> = { accept: 'application/json' }
  const ct = getHeader(event, 'content-type')
  if (ct) headers['content-type'] = ct
  const auth = getHeader(event, 'authorization')
  if (auth) headers['authorization'] = auth

  const result = await $fetch.raw(`${apiBaseUrl}${path}`, {
    method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers,
    body: rawBody,
    ignoreResponseError: true
  })
  setResponseStatus(event, result.status)
  return result._data
}
```

---

## Critical: Do NOT Use `proxyRequest` for Micronaut

`proxyRequest(event, target)` from h3 streams the Node.js request object as the body (`body: event.node?.req`). Micronaut cannot deserialize a streamed body — it receives `null` and returns:

```json
{
  "message": "Failed to convert argument [request] for value [null] due to: Error deserializing type: RegisterRequest request"
}
```

**Use `readRawBody(event, 'utf8')` + `$fetch.raw`** instead. This reads the body into a string first, then sends it as a plain string. Micronaut parses it correctly.

---

## Micronaut-Specific Gotchas

### All `required` fields must be present in JSON

Micronaut fails deserialization (400 Bad Request, `null` body error) if a field marked `required` in the OpenAPI spec is absent from the JSON — even if the field allows empty string with no `minLength`.

```ts
// WRONG — omits lastName when empty, Micronaut rejects
...(form.value.lastName.trim() ? { lastName: form.value.lastName.trim() } : {})

// CORRECT — always send the field, even as ""
lastName: form.value.lastName
```

### 403 on undocumented endpoints

If an endpoint returns 403 (not 404), it exists on the BE but access is restricted. `/api/users/me` is not in the OpenAPI spec and returns 403 with a valid JWT — the user's role likely lacks permission, or the endpoint is internal.

Workaround: make the call non-fatal. Token-based auth (`isAuthenticated`) does not depend on `currentUser` being populated.

```ts
// login.vue — don't block navigation if profile fetch fails
await authStore.fetchUserProfile() // best-effort, errors caught inside
await useWorkspacesStore().fetchWorkspaces()
await router.push('/')
```

---

## Type Alignment: `AuthResponse`

The real `LoginResponse` from the BE differs from the initial mock-based type:

| Field           | Mock type  | Real API spec               |
| --------------- | ---------- | --------------------------- |
| `roles`         | `string[]` | **not present**             |
| `expires_in`    | `number`   | `number \| null` (optional) |
| `refresh_token` | absent     | `string \| null` (optional) |

```ts
// app/types/index.ts
export interface AuthResponse {
  username: string
  access_token: string
  token_type: string
  expires_in?: number | null
  refresh_token?: string | null
}
```

When passing `expires_in` to `setSession(token, expiresIn?: number)`, handle null:

```ts
authStore.setSession(response.data.access_token, response.data.expires_in ?? undefined)
```

---

## Testing the Proxy Chain

Always test both levels:

```bash
# 1. Direct to BE (bypasses Nuxt) — confirms BE works
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"u1","email":"u1@x.com","password":"pass1234","firstName":"A","lastName":""}'

# 2. Through Nuxt proxy — tests the full chain
curl -X POST http://localhost:3000/api-proxy/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"u1","email":"u1@x.com","password":"pass1234","firstName":"A","lastName":""}'
```

If (1) works but (2) fails with the null deserialization error → proxy body forwarding issue.
If both fail with the same error → BE validation issue.

---

## Full Switch to Real Backend

When the real BE is complete, per `INDEX.md`:

1. Delete `server/` and `shared/` directories
2. Uncomment the Vite proxy in `nuxt.config.ts`
3. Remove `app/plugins/mockApi.client.ts` if present
