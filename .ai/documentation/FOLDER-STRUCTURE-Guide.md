# Folder Structure - Time Tracking Ecosystem (3-Layer Architecture)

## 📁 Doporučená Struktura Projektu

```
time-tracking-ecosystem/
│
├── README.md (Project overview)
├── Architecture.md (link to 3-layer model docs)
│
│─── packages / applications
│
├── 📱 apps/
│   ├── 🌐 web-app/             (React/Vue/Angular SPA)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── LoginComponent.tsx
│   │   │   │   │   ├── RegisterComponent.tsx
│   │   │   │   │   └── LogoutComponent.tsx
│   │   │   │   ├── Workspace/
│   │   │   │   │   ├── WorkspaceListComponent.tsx
│   │   │   │   │   ├── WorkspaceCreateComponent.tsx
│   │   │   │   │   └── WorkspaceMemberComponent.tsx
│   │   │   │   ├── TimeEntry/
│   │   │   │   │   ├── TimerComponent.tsx ⭐
│   │   │   │   │   ├── TimeEntryFormComponent.tsx
│   │   │   │   │   ├── TimeEntryListComponent.tsx
│   │   │   │   │   └── TimeEntryDeleteComponent.tsx
│   │   │   │   ├── Integration/
│   │   │   │   │   ├── IntegrationSetupComponent.tsx
│   │   │   │   │   └── IntegrationStatusComponent.tsx
│   │   │   │   ├── Project/
│   │   │   │   │   ├── ProjectListComponent.tsx
│   │   │   │   │   └── IssueListComponent.tsx
│   │   │   │   ├── Reports/
│   │   │   │   │   ├── DashboardComponent.tsx
│   │   │   │   │   └── TimeReportComponent.tsx
│   │   │   │   └── Settings/
│   │   │   │       ├── UISettingsComponent.tsx
│   │   │   │       └── SyncSettingsComponent.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTimeEntry.ts
│   │   │   │   ├── useWorkspace.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── store/ (Redux / Zustand / Pinia state management)
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── workspaceSlice.ts
│   │   │   │   └── timeEntrySlice.ts
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── 🖥️ desktop-app/         (Electron + SQLite local DB)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── main.ts (Electron main process)
│   │   │   │   ├── preload.ts
│   │   │   │   ├── ipc-handlers/
│   │   │   │   │   ├── timeEntry.ipc.ts
│   │   │   │   │   └── workspace.ipc.ts
│   │   │   │   └── idle-detection/
│   │   │   │       └── IdleDetector.ts ⭐
│   │   │   ├── renderer/ (same as web-app, reuses components)
│   │   │   ├── backend/ (Node.js backend process)
│   │   │   │   ├── services/
│   │   │   │   │   └── [shared via monorepo]
│   │   │   │   └── storage/
│   │   │   │       └── SQLiteStore.ts (wraps PostgreSQL through API or local DB)
│   │   │   └── assets/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── 📱 mobile-app/          (React Native / Flutter)
│       ├── src/
│       │   ├── screens/
│       │   ├── components/ (reused from web)
│       │   └── services/ (shared via monorepo)
│       ├── package.json
│       └── app.json
│
│
├── 🧠 packages/ (Shared libraries - BUSINESS LAYER)
│   │
│   ├── @tts/core-domain/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   │   ├── User.ts
│   │   │   │   ├── Workspace.ts
│   │   │   │   ├── TimeEntry.ts (AGGREGATE ROOT) ⭐
│   │   │   │   ├── Integration.ts
│   │   │   │   ├── Project.ts
│   │   │   │   ├── Issue.ts
│   │   │   │   └── Tag.ts
│   │   │   ├── aggregates/
│   │   │   │   ├── TimeEntryAggregate.ts ⭐
│   │   │   │   └── WorkspaceAggregate.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── Email.ts
│   │   │   │   ├── TimeRange.ts
│   │   │   │   ├── SyncState.ts
│   │   │   │   └── IntegrationStatus.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/auth-service/
│   │   ├── src/
│   │   │   ├── AuthenticationService.ts
│   │   │   ├── UserService.ts
│   │   │   └── SessionManager.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/workspace-service/
│   │   ├── src/
│   │   │   ├── WorkspaceService.ts
│   │   │   ├── WorkspaceMembershipService.ts
│   │   │   ├── InvitationService.ts
│   │   │   └── validators/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/time-entry-service/  ⭐⭐⭐ CORE
│   │   ├── src/
│   │   │   ├── TimeTrackerService.ts (CRITICAL - Timer logic)
│   │   │   ├── TimeEntryService.ts
│   │   │   ├── TimeEntryValidationService.ts
│   │   │   ├── TimeTaggingService.ts
│   │   │   ├── exports/
│   │   │   │   └── TimeEntryExportService.ts
│   │   │   └── use-cases/
│   │   │       ├── StartTimerUseCase.ts
│   │   │       ├── StopTimerUseCase.ts
│   │   │       ├── CreateManualEntryUseCase.ts
│   │   │       └── DeleteTimeEntryUseCase.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/integration-service/  ⭐⭐ SYNC ENGINE
│   │   ├── src/
│   │   │   ├── IntegrationConfigService.ts
│   │   │   ├── DataSyncService.ts (F12 - import from Redmine)
│   │   │   ├── TimeEntrySyncService.ts (F13 - push to Redmine)
│   │   │   ├── SyncOrchestrationService.ts (polling + orchestration)
│   │   │   ├── gateway/
│   │   │   │   ├── ITicketingGateway.ts (interface)
│   │   │   │   ├── RedmineGateway.ts ⭐ (Redmine API)
│   │   │   │   └── JiraGateway.ts (future)
│   │   │   ├── handlers/
│   │   │   │   └── SyncJobHandler.ts
│   │   │   └── types/
│   │   │       └── SyncPayload.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/workspace-sync-service/
│   │   ├── src/
│   │   │   ├── SyncOutboxService.ts
│   │   │   ├── ConflictResolutionService.ts
│   │   │   ├── OfflineSyncService.ts (F6 - offline capability)
│   │   │   ├── BackgroundSyncJobService.ts (F18 - continuous sync)
│   │   │   └── RetryStrategy.ts (exponential backoff)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/project-service/
│   │   ├── src/
│   │   │   ├── ProjectService.ts
│   │   │   ├── IssueService.ts
│   │   │   ├── TagService.ts
│   │   │   └── loaders/ (DataLoader for N+1 prevention)
│   │   │       └── IssueDataLoader.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/report-service/
│   │   ├── src/
│   │   │   ├── TimeReportService.ts
│   │   │   ├── DashboardService.ts
│   │   │   ├── ExportService.ts
│   │   │   └── aggregations/
│   │   │       ├── DailyAggregation.ts
│   │   │       └── ProjectBreakdown.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/idle-detection/
│   │   ├── src/
│   │   │   ├── IdleDetectionService.ts (F16)
│   │   │   ├── desktop/
│   │   │   │   └── ElectronIdleDetector.ts (native hooks)
│   │   │   └── web/
│   │   │       └── WebIdleDetector.ts (mouse/keyboard events)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/pomodoro/
│   │   ├── src/
│   │   │   ├── PomodoroService.ts (F17 - future)
│   │   │   └── PomodoroValidator.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── @tts/cross-cutting/
│       ├── src/
│       │   ├── DateTime/
│       │   │   ├── DateTimeService.ts (Timezone handling)
│       │   │   └── types.ts
│       │   ├── Encryption/
│       │   │   ├── EncryptionService.ts
│       │   │   └── SecureKeyStore.ts
│       │   ├── Logging/
│       │   │   ├── Logger.ts (Winston / Pino)
│       │   │   └── AuditLogger.ts
│       │   ├── ErrorHandling/
│       │   │   ├── AppError.ts
│       │   │   ├── ValidationError.ts
│       │   │   ├── ExternalServiceError.ts
│       │   │   └── ErrorTranslator.ts (external → internal)
│       │   ├── DependencyInjection/
│       │   │   ├── Container.ts
│       │   │   └── decorators.ts
│       │   └── types/
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
│
├── 💾 packages/data/ (DATA LAYER)
│   │
│   ├── @tts/data-core/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── Repository.ts (base interface)
│   │   │   │   └── QueryFilter.ts
│   │   │   ├── mappers/
│   │   │   │   ├── Mapper.ts (base abstract)
│   │   │   │   ├── TimeEntryMapper.ts
│   │   │   │   └── ProjectMapper.ts
│   │   │   └── cache/
│   │   │       ├── CacheStrategy.ts
│   │   │       └── TTLCache.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/data-repositories/
│   │   ├── src/
│   │   │   ├── UserRepository.ts
│   │   │   ├── WorkspaceRepository.ts
│   │   │   ├── TimeEntryRepository.ts ⭐ (largest dataset)
│   │   │   ├── ProjectRepository.ts
│   │   │   ├── IssueRepository.ts
│   │   │   ├── TagRepository.ts
│   │   │   ├── IntegrationRepository.ts
│   │   │   ├── InvitationRepository.ts
│   │   │   └── SyncOutboxRepository.ts ⭐ (resilience pattern)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/data-store-postgres/
│   │   ├── src/
│   │   │   ├── PostgresLocalStore.ts ⭐ (MAIN)
│   │   │   ├── connection/
│   │   │   │   ├── ConnectionPool.ts
│   │   │   │   └── TransactionManager.ts
│   │   │   ├── migrations/
│   │   │   │   ├── V1__Initial_Schema.sql
│   │   │   │   ├── V2__Add_SyncOutbox.sql
│   │   │   │   └── migration.runner.ts
│   │   │   ├── seeds/
│   │   │   │   └── seed.ts
│   │   │   └── indexes.ts (performance tuning)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @tts/data-store-sqlite/
│   │   ├── src/
│   │   │   ├── SqliteLocalStore.ts (for Desktop app internal DB)
│   │   │   ├── schema.ts
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── @tts/data-external-gateways/
│       ├── src/
│       │   ├── TicketingGateway.ts (interface)
│       │   ├── redmine/
│       │   │   ├── RedmineGateway.ts
│       │   │   ├── RedmineClient.ts (HTTP wrapper)
│       │   │   ├── mappers/
│       │   │   │   ├── ProjectMapper.ts (Redmine Project → local)
│       │   │   │   ├── IssueMapper.ts (Redmine Issue → local)
│       │   │   │   └── TimeEntryMapper.ts (local → Redmine API)
│       │   │   └── types/
│       │   ├── jira/ (future)
│       │   │   └── JiraGateway.ts
│       │   └── adapters/
│       │       └── HttpClientAdapter.ts (Axios / Fetch wrapper)
│       ├── package.json
│       └── tsconfig.json
│
│
├── 🧪 tests/
│   ├── unit/
│   │   ├── core-domain/
│   │   │   └── TimeEntry.test.ts
│   │   ├── services/
│   │   │   ├── TimeTrackerService.test.ts
│   │   │   └── IntegrationService.test.ts
│   │   └── repositories/
│   │       └── TimeEntryRepository.test.ts
│   ├── integration/
│   │   ├── sync-flow.test.ts
│   │   └── offline-first.test.ts
│   ├── e2e/
│   │   ├── user-registration.e2e.ts
│   │   ├── create-time-entry.e2e.ts
│   │   └── sync-to-redmine.e2e.ts
│   └── fixtures/
│       ├── user.fixture.ts
│       ├── workspace.fixture.ts
│       └── timeEntry.fixture.ts
│
│
├── 📖 docs/
│   ├── Architecture.md
│   ├── Package-Model-3-Vrstvý.md 📄 (THIS FILE)
│   ├── MAPPING-Entity-to-Layers.md
│   ├── API.md (external endpoints)
│   ├── DATABASE.md (schema docs)
│   ├── SETUP.md (dev environment)
│   └── DEPLOYMENT.md
│
│
├── 🔧 infra/
│   ├── docker-compose.yml (PostgreSQL, Redis, etc.)
│   ├── kubernetes/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── github-actions/ (CI/CD)
│       ├── test.yml
│       ├── build.yml
│       └── deploy.yml
│
│
├── root files
│   ├── workspace.json (Turborepo workspace config)
│   ├── package.json (root monorepo config)
│   ├── tsconfig.json (root TS config)
│   ├── .prettierrc
│   ├── .eslintrc
│   ├── jest.config.js
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── README.md

```

---

## 🎯 Balíček Organizace Logika

### **Horizontal Split (Feature-based within layers)**

Alternativě lze organizovat ve features:

```
packages/
├── @tts/auth-feature/
│   ├── src/
│   │   ├── presentation/ (React Component)
│   │   ├── business/ (AuthService)
│   │   └── data/ (UserRepository)
│   └── index.ts (exports)
│
├── @tts/time-entry-feature/
│   ├── src/
│   │   ├── presentation/ (Timer, Form)
│   │   ├── business/ (TimeTrackerService, Validation)
│   │   └── data/ (TimeEntryRepository)
│   └── index.ts (exports)
│
└── @tts/integration-feature/
    ├── src/
    │   ├── presentation/ (Setup UI)
    │   ├── business/ (SyncService, Gateway)
    │   └── data/ (IntegrationRepository)
    └── index.ts (exports)
```

**Výhody:**

- ✓ Jednotlivý feature se snáze přesouvá
- ✗ Vedoucí k code duplication (util services)

**Výhody Vertical (Layer-based):**

- ✓ Snazší sdílení services (auth, logging)
- ✓ Clear dependency direction
- ✓ Jednodušší testování layer by layer

**DOPORUČENÍ:** Hybrid - Layer-based packages + feature flags v business layer

---

## 📦 Monorepo Setup (Turborepo / Nx)

### `workspace.json` or `turbo.json`:

```json
{
  "version": "1",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "dev": {
      "cache": false
    }
  }
}
```

### Root `package.json`:

```json
{
  "name": "time-tracking-ecosystem",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "packages/data/*"],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "turbo": "latest"
  }
}
```

---

## 🔄 Dependency Flow Diagram

```
apps/
  ├── web-app/        imports from packages/
  ├── desktop-app/    imports from packages/
  └── mobile-app/     imports from packages/
         ↓
    (Presentation Layer)
         ↓
packages/
  (Business Layer services)
    @tts/auth-service
    @tts/time-entry-service ⭐
    @tts/integration-service ⭐
    @tts/workspace-sync-service
    ├→ depends on
    └→ @tts/core-domain
    └→ @tts/cross-cutting
         ↓
packages/data/
  (Data Layer)
    @tts/data-repositories
    @tts/data-store-postgres ⭐
    @tts/data-external-gateways
         ↓
    External Systems:
    🗄️ PostgreSQL LocalStore
    🌐 Redmine API
```

---

## 📋 CI/CD Pipeline v GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v3

# .github/workflows/build.yml
name: Build & Push
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

---

## ✅ Checklist pro Setup

- [ ] Create monorepo structure (Turborepo / Nx initialized)
- [ ] Setup root TypeScript config (`tsconfig.json`)
- [ ] Create `@tts/core-domain` package
- [ ] Create `@tts/auth-service` package
- [ ] Create `@tts/time-entry-service` package ⭐
- [ ] Create `@tts/integration-service` package ⭐
- [ ] Create `@tts/data-repositories` package
- [ ] Create `@tts/data-store-postgres` package with migrations
- [ ] Create `@tts/data-external-gateways` package (Redmine)
- [ ] Create `apps/web-app` (React/Vue SPA)
- [ ] Create `apps/desktop-app` (Electron)
- [ ] Setup & document dependency injection container
- [ ] Setup testing infrastructure (Jest / Vitest)
- [ ] Setup linting (ESLint / Prettier)
- [ ] Setup CI/CD pipeline (GitHub Actions / GitLab CI)
- [ ] Document architecture in `/docs`

---

## 🚀 Getting Started (Dev Experience)

```bash
# Clone & setup
git clone <repo>
cd time-tracking-ecosystem
npm install

# Run all apps in parallel
npm run dev

# Run only web app
npm run dev --filter=web-app

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

---

**Result:** Clean, scalable, testable 3-layer architecture! 🎉
