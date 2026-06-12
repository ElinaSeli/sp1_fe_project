# API Reference

**Spec source (authoritative):** http://3.122.251.179:8080/swagger/time-tracking-api-0.1.yml  
**Swagger UI:** http://3.122.251.179:8080/swagger-ui#/

> Spec version 0.1 — prone to change. Verify against Swagger before implementing new features.

All requests go to `/api-proxy/*`. In dev the mock middleware (`server/middleware/01.mockApi.ts`)
intercepts these. In production a Vite proxy forwards them to `NUXT_PUBLIC_API_BASE_URL`.

Auth: `Authorization: Bearer <token>` on all protected routes (JWT).

---

## Users

| Method | Path                  | Auth | Summary           |
| ------ | --------------------- | ---- | ----------------- |
| POST   | `/api/users/register` | —    | Register new user |

**POST /api/users/register**

```ts
// Request
{ username: string, email: string, password: string /* min 8 */, firstName: string, lastName: string }
// Response: 201 (no body) | 400 duplicate email/username | 422 validation error
```

> `/login` and `/api/users/me` are NOT in the BE spec — auth flow TBD. Mock uses `POST /login` returning `AuthResponse`.

---

## Workspaces

| Method | Path                                   | Auth | Summary                          |
| ------ | -------------------------------------- | ---- | -------------------------------- |
| GET    | `/api/workspaces`                      | ✓    | List workspaces for current user |
| POST   | `/api/workspaces`                      | ✓    | Create workspace                 |
| GET    | `/api/workspaces/:workspaceId`         | ✓    | Get workspace by ID              |
| POST   | `/api/workspaces/:workspaceId/members` | ✓    | Add member (OWNER/ADMIN only)    |

**WorkspaceResponse**

```ts
{ id: string /* uuid */, name: string, description?: string | null, createdAt?: string | null /* date-time */ }
```

**POST /api/workspaces** body: `{ name: string /* min 1 */, description?: string | null }`

**POST /api/workspaces/:workspaceId/members** body:

```ts
{ userId: string /* uuid */, role: 'OWNER' | 'ADMIN' | 'MEMBER' }
// Response: MembershipResponse { id, userId, username, role }
```

---

## Time Entries

| Method | Path                                            | Auth | Summary             |
| ------ | ----------------------------------------------- | ---- | ------------------- |
| GET    | `/api/workspaces/:workspaceId/time-entries`     | ✓    | List entries        |
| POST   | `/api/workspaces/:workspaceId/time-entries`     | ✓    | Create manual entry |
| GET    | `/api/workspaces/:workspaceId/time-entries/:id` | ✓    | Get entry by ID     |
| PUT    | `/api/workspaces/:workspaceId/time-entries/:id` | ✓    | Update entry        |
| DELETE | `/api/workspaces/:workspaceId/time-entries/:id` | ✓    | Soft-delete entry   |

**TimeEntryResponse**

```ts
{
  id: string            // uuid
  projectId: string | null
  issueId: string | null
  description: string | null
  timeStart: string     // date-time
  timeEnd: string | null
  timeEntryState: 'DRAFT' | 'RUNNING' | 'VALIDATED' | 'SYNC_PENDING' | 'SYNCED' | 'DELETED'
  syncState: 'LOCAL_ONLY' | 'PENDING' | 'SYNCED' | 'ERROR'
  tagIds: string[]      // uuid[]
}
```

**POST (create) body** — `projectId`, `timeStart`, `timeEnd`, `tagIds` required:

```ts
{ projectId: string, issueId?: string | null, description?: string | null, timeStart: string, timeEnd: string, tagIds: string[] }
```

**PUT (update) body** — `timeStart`, `timeEnd`, `tagIds` required:

```ts
{ description?: string | null, timeStart: string, timeEnd: string, tagIds: string[] }
```

---

## Timer

| Method | Path                                       | Auth | Summary                         |
| ------ | ------------------------------------------ | ---- | ------------------------------- |
| GET    | `/api/workspaces/:workspaceId/timer`       | ✓    | Get running timer (204 if none) |
| POST   | `/api/workspaces/:workspaceId/timer/start` | ✓    | Start timer                     |
| POST   | `/api/workspaces/:workspaceId/timer/stop`  | ✓    | Stop running timer              |

**POST /timer/start** body — `projectId` required:

```ts
{ projectId: string /* uuid */, issueId?: string | null, description?: string | null }
```

Responses are `TimeEntryResponse` for all timer routes.

---

## Not in spec (mock-only, not yet on BE)

These routes exist in the mock but have no BE spec endpoint yet:

- `GET /api/workspaces/:id/projects`
- `GET /api/workspaces/:id/tasks`
- `GET /api/workspaces/:id/tags`
- `GET /api/users/me`
- `POST /login`

Do not wire services to these as real endpoints — confirm with BE team first.

---

## Mock discrepancies vs real BE

| Area                    | Mock                          | Real BE                            |
| ----------------------- | ----------------------------- | ---------------------------------- |
| Time entries path       | `/api/workspaces/:id/entries` | `/api/workspaces/:id/time-entries` |
| Timer start `projectId` | optional                      | **required**                       |
| Workspace CRUD          | GET list only                 | GET list, POST create, GET by ID   |
| Members                 | not mocked                    | POST add member                    |
| Time entry CRUD         | not mocked                    | full GET/POST/PUT/DELETE           |
