# Codebase Index — SP1 Time Tracking FE

Quick reference for LLMs and agents. Read this before exploring the repo.

---

## Stack

| Item            | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Framework       | **Nuxt 4** (SPA mode, `ssr: false`)                   |
| UI library      | **@nuxt/ui v4** (Nuxt UI v4 — NOT v3)                 |
| Styling         | Tailwind CSS v4                                       |
| State           | Pinia + `pinia-plugin-persistedstate`                 |
| Icons           | `@iconify-json/lucide` + `@iconify-json/simple-icons` |
| Desktop target  | Tauri v2 (`src-tauri/`)                               |
| Package manager | **pnpm** (v10) — never use npm/yarn                   |
| Language        | TypeScript (strict)                                   |
| Tests           | Vitest + `@vue/test-utils` + happy-dom                |

---

## Pre-commit gates (Husky)

Every commit runs **both** of these — if either fails the commit is blocked:

1. `lint-staged` — ESLint + Prettier on staged `*.{js,ts,vue,mjs,cjs}` files
2. `nuxt typecheck` — full TypeScript check across the app

Run manually: `pnpm lint:fix` and `pnpm typecheck`.

---

## Key scripts

```
pnpm dev            # dev server
pnpm build          # production build
pnpm typecheck      # ts check
pnpm lint           # eslint (no fix)
pnpm lint:fix       # eslint --fix
pnpm test           # vitest run
pnpm test:coverage  # vitest + coverage
pnpm format         # prettier --write .
```

---

## Directory map

```
sp1-timetracking-fe-drafts/
├── app/                        # Nuxt app source root
│   ├── app.vue                 # Root component
│   ├── app.config.ts           # UI theme config (primary: green, neutral: slate)
│   ├── assets/css/main.css     # Global CSS
│   ├── components/
│   │   ├── AppLogo.vue
│   │   └── app/
│   │       ├── SideNav.vue     # Sidebar navigation
│   │       └── TimerBar.vue    # Persistent top timer widget
│   ├── composables/
│   │   └── useApiClient.ts     # Central $fetch wrapper — ALL services use this
│   ├── layouts/
│   │   ├── auth.vue            # Layout for login/register pages
│   │   └── dashboard.vue       # Layout for authenticated pages
│   ├── middleware/
│   │   └── auth.global.ts      # Route guard: guests → /login, authed → /
│   ├── pages/                  # File-based routing
│   │   ├── index.vue           # Dashboard (/)
│   │   ├── login.vue
│   │   ├── register.vue
│   │   ├── forgot-password.vue
│   │   ├── workspaces.vue
│   │   ├── integrations.vue
│   │   ├── reports.vue
│   │   └── settings.vue
│   ├── services/               # API service layer (thin wrappers over useApiClient)
│   │   ├── index.ts            # Barrel export — import services from here
│   │   ├── auth.service.ts
│   │   ├── timer.service.ts
│   │   ├── timeEntries.service.ts
│   │   ├── workspaces.service.ts
│   │   └── projects.service.ts
│   ├── stores/                 # Pinia stores
│   │   ├── auth.store.ts       # Session, token (cookie), currentUser
│   │   ├── timer.store.ts      # Active timer state
│   │   ├── timeEntries.store.ts
│   │   ├── workspaces.store.ts
│   │   ├── integration.store.ts
│   │   └── keybindings.store.ts
│   └── types/
│       └── index.ts            # ALL domain types live here — single source of truth
│
├── server/                     # Nuxt server (mock only — delete when real BE is ready)
│   ├── middleware/
│   │   └── 01.mockApi.ts       # Intercepts /api-proxy/* — mock credentials: testuser/password123
│   └── utils/
│       └── mockData.ts         # All mock data constants (MOCK_*)
│
├── tests/
│   └── setup.spec.ts           # Vitest setup
│
├── public/                     # Static assets
├── src-tauri/                  # Tauri desktop app config
├── nuxt.config.ts              # Nuxt config — API base URL via NUXT_PUBLIC_API_BASE_URL
├── eslint.config.mjs
├── vitest.config.ts
├── tsconfig.json
└── .husky/pre-commit           # lint-staged + typecheck
```

---

## API / networking

- All requests go through `app/composables/useApiClient.ts`
- Base path: `/api-proxy` (Vite proxy or mock middleware intercepts)
- Auth: JWT stored in `auth_token` cookie, sent as `Authorization: Bearer <token>`
- Real BE URL injected via env: `NUXT_PUBLIC_API_BASE_URL`
- **Mock mode** (current): `server/middleware/01.mockApi.ts` handles all `/api-proxy/*` routes. To switch to real BE: delete `server/`, uncomment the Vite proxy in `nuxt.config.ts`

---

## Types — `app/types/index.ts`

All domain types in one file. Key types:

| Type                       | Purpose                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| `User` / `AuthUser`        | Authenticated user profile                                                     |
| `Workspace`                | Tenant/workspace entity                                                        |
| `Project` / `Task` / `Tag` | Imported from Redmine or local                                                 |
| `TimeEntry`                | Core entity — has `timeEntryState` + `syncState`                               |
| `TimeEntryViewModel`       | View-layer projection of TimeEntry                                             |
| `ServiceResponse<T>`       | `{ data: T \| null, error: string \| null }` — all service methods return this |
| `SyncState`                | `LOCAL_ONLY \| PENDING \| SYNCED \| ERROR`                                     |
| `TimeEntryState`           | `DRAFT \| RUNNING \| VALIDATED \| SYNC_PENDING \| SYNCED \| DELETED`           |
| `KeybindingActionId`       | Timer keyboard shortcut action ids                                             |

---

## Patterns to follow

**Services** return `ServiceResponse<T>` — never throw, always return `{ data, error }`.

**Mock data** lives exclusively in `server/utils/mockData.ts` — never inline mock data in services, stores, or components.

**`pinia-plugin-persistedstate`** is active — stores opt-in with `persist: { pick: [...] }`. Token is in a cookie, not localStorage.

---

## Documentation — `.ai/documentation/`

Project design docs live here. Not all docs are current or relevant to every task.

**Before implementing a new feature or changing major behaviour — check docs and ask the user if the change aligns with the documented design.**

| Subdirectory / File              | Content                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| `Aktivity-Diagram/`              | Activity diagrams per use case (DA - …). Each has `.md` + PNG attachment  |
| `Use Case/` (root: `Diagramy/`)  | Use case specs (UC - …) per feature                                       |
| `Funkční a nefunkční požadavky/` | Functional + non-functional requirements, requirement-to-UC mapping table |
| `Databazovy-Diagram/`            | DB entity diagram (PNG: `KOM.png`), keyboard shortcuts doc                |
| `FE notes/`                      | (empty or minimal)                                                        |
| `FOLDER-STRUCTURE-Guide.md`      | Aspirational monorepo layout (design doc, not current structure)          |
| `MAPPING-Entity-to-Layers.md`    | Entity → 3-layer arch mapping; service/repo responsibilities per domain   |
| `Package-Model-3-Vrstvý.md`      | 3-layer architecture overview                                             |
| `Project-Plan.md`                | Links to use cases, activity diagrams, wireframes                         |

Key use cases with diagrams: Login, Register, Logout, Create workspace, Timer (start/stop), Manual time entry, Edit/delete entry, Redmine integration setup, Redmine data sync, Push entries to Redmine, Keyboard shortcuts.

---

## Nuxt UI v4 notes

- Component prefix: `U` (e.g. `<UButton>`, `<UInput>`, `<UModal>`)
- Color tokens configured in `app.config.ts` (`primary: 'green'`, `neutral: 'slate'`)
- Icon usage: `<UIcon name="i-lucide-play" />` or `i-simple-icons-*`
- Docs: https://ui.nuxt.com (v4 — breaking changes from v3, do not use v3 API)

---

## API reference

`.ai/API.md` — all endpoints, request/response shapes, mock vs real BE discrepancies. Sourced from the OpenAPI spec at `http://3.122.251.179:8080/swagger/time-tracking-api-0.1.yml` (prone to change — verify against Swagger before implementing).

---

## Issues tracker

`.ai/issues.md` — known issues and TODO items for the project.
