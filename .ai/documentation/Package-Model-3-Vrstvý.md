# Time Tracking Ecosystem - 3-vrstvý Package Model

## Přehled Architektury

```
┌─────────────────────────────────────────────────────────┐
│           PRESENTATION LAYER (UI)                       │
│  Web App | Desktop Mini-App | Mobile                    │
├─────────────────────────────────────────────────────────┤
│           BUSINESS LAYER (Domain Logic)                 │
│  Use Cases | Services | Domain Entities | Workflows     │
├─────────────────────────────────────────────────────────┤
│           DATA LAYER (Persistence)                      │
│  Local Database | External API Connectors               │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ PRESENTATION LAYER (Vrstva Prezentace)

### Odpovědnost:

- Uživatelské interakce
- Renderování UI
- Vstupní validace (UI level)
- Komunikace s Business Layer

### Balíčky/Komponenty:

#### 1.1 **Auth.Presentation**

- `LoginComponent` → Přihlášení (s webovým prohlížečem)
- `RegisterComponent` → Registrace
- `LogoutComponent` → Odhlášení
- `SessionManager` → Správa aktivní session

#### 1.2 **Workspace.Presentation**

- `WorkspaceListComponent` → Výběr workspace
- `WorkspaceCreateComponent` → Vytvoření workspace
- `WorkspaceMemberComponent` → Správa týmu (pozvánky, role)

#### 1.3 **TimeEntry.Presentation** ⭐ KLÍČOVÝ

- `TimerComponent` → Spuštění/zastavení časovače
- `TimeEntryListComponent` → Seznam časových záznamů
- `TimeEntryFormComponent` → Ručnícreate/edit záznamu
- `TimeEntryDeleteComponent` → Smazání
- `IdleDetectionComponent` → Detekce nečinnosti (desktop)

#### 1.4 **Integration.Presentation**

- `IntegrationSetupComponent` → Konfigurace Redmine
- `IntegrationStatusComponent` → Stav synchronizace
- `SyncHistoryComponent` → Historie sync operací

#### 1.5 **Project.Presentation** (Importované + Lokální)

- `ProjectListComponent` → Výběr projektu
- `IssueListComponent` → Výběr úkolu z projektu
- `ProjectTagComponent` → Filtrování podle štítků

#### 1.6 **Reports.Presentation**

- `TimeReportComponent` → Agregované reporty
- `DashboardComponent` → Přehled aktivit
- `ExportComponent` → Export dat

#### 1.7 **Settings.Presentation**

- `UISettingsComponent` → Light/Dark mode, preference UI
- `SyncSettingsComponent` → Konfigurace interval synchronizace

---

## 2️⃣ BUSINESS LAYER (Vrstva Business Logic)

### Odpovědnost:

- Implementace Use Cases
- Domain Logic & Business Rules
- Orchestrace mezi entitami
- Error Handling a Resilience

### Balíčky/Szolgáltatások:

#### 2.1 **Auth.Services**

- `AuthenticationService` → ✅ Login/Logout, Session Token Validation
- `UserService` → User Registration, Profile Management
- **Závislosti:** Data.Repository.User, LocalStore

#### 2.2 **Workspace.Services**

- `WorkspaceService` → Create/List/Archive Workspaces
- `WorkspaceMembershipService` → Add/Remove Members, Role Management
- `InvitationService` → Generate & Validate Invitations
- **Závislosti:** Data.Repository.Workspace, Auth.Services

#### 2.3 **TimeEntry.Services** ⭐⭐ KRITICKÝ (F7-F10)

- `TimeTrackerService` → **Start/Stop Timer** (F7)
- `TimeEntryService` → Create/Update/Delete (F8-F10)
- `TimeEntryValidationService` → Business rules (overlap check, duration validation)
- `TimeTaggingService` → Assign/Remove tags
- **Závislosti:** Data.Repository.TimeEntry, Data.Repository.Tag, Sync.Services

#### 2.4 **Integration.Services**

- `IntegrationConfigService` → Setup Redmine Connection (F11)
- `DataSyncService` → Import Projects/Issues/Tags (F12)
- `TimeEntrySyncService` → **Push to Redmine** (F13, F18)
- `SyncOrchestrationService` → Resilient queue management
- `TicketingGatewayAdapter` → Abstraction pro API (Redmine, Jira, atd.)
- **Závislosti:** Data.Repository.Integration, Data.LocalStore, Sync.Outbox, DateTime.Service

#### 2.5 **Project.Services**

- `ProjectService` → CRUD (local + imported)
- `IssueService` → Fetch/Cache External Issues
- `TagService` → Tag Management
- **Závislosti:** Data.Repository.Project, Integration.Services

#### 2.6 **Report.Services**

- `TimeReportService` → Aggregate, Filter, Calculate
- `DashboardService` → KPI Calculations
- `ExportService` → Generate CSV/PDF
- **Závislosti:** Data.Repository.TimeEntry, DateTime.Service

#### 2.7 **Workspace.Sync.Services**

- `SyncOutboxService` → Enqueue/Dequeue operations
- `ConflictResolutionService` → Handle sync conflicts
- `OfflineSyncService` → Local-first sync strategy (F6)
- **Závislosti:** Data.Repository.SyncOutbox, Integration.Services

#### 2.8 **Domain Entities** (Value Objects, Aggregates)

```
- TimeEntry Aggregate
  ├── TimeEntry (Root)
  ├── TimeEntryState: enum [DRAFT, RUNNING, VALIDATED, SYNC_PENDING, SYNCED, DELETED]
  ├── SyncState: enum [LOCAL_ONLY, PENDING, SYNCED, ERROR]
  └── Tags: collection

- Integration Aggregate
  ├── Integration (Root)
  ├── IntegrationStatus: enum [UNCONFIGURED, VERIFYING, ACTIVE, INVALID]
  └── SyncInterval

- User Aggregate
  ├── AppUser (Root)
  ├── Email, Username
  └── PasswordHash

- Workspace Aggregate
  ├── Workspace (Root)
  ├── State: enum [ACTIVE, ARCHIVED]
  ├── Members: collection
  └── Invitations: collection
```

#### 2.9 **Cross-Cutting Services**

- `DateTimeService` → Timezone Handling, Timestamps
- `EncryptionService` → API Keys, Passwords
- `LoggingService` → Audit Trails
- `ErrorHandlingService` → Structured Error Handling

---

## 3️⃣ DATA LAYER (Vrstva Persistence)

### Odpovědnost:

- Abstrakce ke storage (Local DB, External APIs)
- Data Mapping (Domain ↔ Storage)
- Query Optimization
- Transaction Management

### Balíčky/Komponenty:

#### 3.1 **Data.Repository**

- `UserRepository` → CRUD User
- `WorkspaceRepository` → CRUD Workspace
- `ProjectRepository` → CRUD Project
- `IssueRepository` → Query Issues (cached)
- `TimeEntryRepository` → CRUD TimeEntry + queries (filtering, reporting)
- `TagRepository` → CRUD Tag
- `IntegrationRepository` → CRUD Integration
- `InvitationRepository` → CRUD Invitation
- **Pattern:** Repository Pattern (abstrakce DAL)

#### 3.2 **Data.LocalStore** (PostgreSQL - Local-First)

```
┌─────────────────────────────────┐
│ Local Database (PostgreSQL)      │
├─────────────────────────────────┤
│ dbo.app_user                    │
│ dbo.workspace                   │
│ dbo.workspace_membership        │
│ dbo.invitation                  │
│ dbo.integration                 │
│ dbo.project                     │
│ dbo.issue                       │
│ dbo.tag                         │
│ dbo.project_tag                 │
│ dbo.time_entry                  │
│ dbo.time_entry_tag              │
│ dbo.sync_outbox       ⭐ KEY    │
└─────────────────────────────────┘
```

**Klíčové vlastnosti:**

- ✅ Offline capabilities (user pracuje bez internetu)
- ✅ Local-first data ownership (data nejdříve lokálně)
- ✅ Transactional integrity (ACID)
- ✅ Indexes pro performance queries (time_entry, sync_outbox)

#### 3.3 **Data.ExternalGateway**

- `RedmineGateway` → API connector na Redmine
  - `fetchProjects()`
  - `fetchIssues()`
  - `fetchTags()`
  - `pushTimeEntry()` ← Synchronizace času **OUT**
  - `updateIssueState()` (F15 - nice to have)
- `JiraGateway` (future expansion)
- **Abstrakce:** `ITicketingGateway` interface

#### 3.4 **Data.Mapper & QueryBuilder**

- `TimeEntryMapper` → Domain Entity ↔ DB Record
- `ProjectMapper` → Domain Entity ↔ DB Record
- `QueryBuilder` → Type-safe query construction
- **Cíl:** Oddělení domain modelu od storage modelu

#### 3.5 **Data.Migration**

- Schema migrations (Flyway / Liquibase)
- Data seed pro seed data
- Schema versioning

#### 3.6 **Data.Cache**

- `ProjectCache` → Cache imported projects (s TTL/invalidation)
- `IssueCache` → Cache issues (invalidate na sync)
- `TagCache` → Cache tags
- **Strategie:** Write-through, invalidate-on-sync

---

## 📊 Dependency Graph

```
┌────────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                         │
│     (Web|Desktop|Mobile UI Components)                     │
└─────────────────────┬──────────────────────────────────────┘
                      │ Dependency
                      ▼
┌────────────────────────────────────────────────────────────┐
│                  BUSINESS LAYER                            │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Auth.Services                                             │
│    ↓                                                        │
│    └→ Data.Repository.User                                │
│                                                             │
│  Workspace.Services                                        │
│    ↓                                                        │
│    ├→ Data.Repository.Workspace                           │
│    ├→ Auth.Services                                        │
│    └→ EmailService (Invitations)                          │
│                                                             │
│  TimeEntry.Services  ⭐⭐⭐  CORE LOGIC                    │
│    ↓                                                        │
│    ├→ Data.Repository.TimeEntry                           │
│    ├→ Data.Repository.Tag                                 │
│    ├→ TimeEntry.Sync.Services                             │
│    ├→ DateTime.Service (Timezone)                         │
│    └→ Workspace.Services (validation)                     │
│                                                             │
│  Integration.Services  ⭐⭐  SYNC ENGINE                  │
│    ↓                                                        │
│    ├→ Data.Repository.Integration                         │
│    ├→ Data.LocalStore (tx mgmt)                           │
│    ├→ Data.ExternalGateway (Redmine API)                  │
│    ├→ Project.Services (import)                           │
│    ├→ TimeEntry.Sync.Services                             │
│    ├→ EncryptionService (API Keys)                        │
│    └→ DateTime.Service (sync timestamps)                  │
│                                                             │
│  Project.Services                                          │
│    ↓                                                        │
│    ├→ Data.Repository.Project                             │
│    ├→ Data.Repository.Issue                               │
│    ├→ Data.Cache                                          │
│    └→ Integration.Services (import)                        │
│                                                             │
│  Report.Services                                           │
│    ↓                                                        │
│    ├→ Data.Repository.TimeEntry                           │
│    └→ DateTime.Service                                     │
│                                                             │
│  Workspace.Sync.Services                                   │
│    ↓                                                        │
│    ├→ Data.Repository.SyncOutbox                          │
│    ├→ Data.LocalStore (tx mgmt)                           │
│    ├→ Integration.Services                                │
│    └→ ErrorHandling.Service                               │
│                                                             │
│  Cross-Cutting Services:                                   │
│    - DateTime.Service                                      │
│    - Encryption.Service                                    │
│    - Logging.Service                                       │
│    - ErrorHandling.Service                                 │
│                                                             │
└─────────────────┬────────────────────────────────────────┘
                  │ Dependency
                  ▼
┌────────────────────────────────────────────────────────────┐
│                   DATA LAYER                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Repositories:                                             │
│    ├→ UserRepository                                       │
│    ├→ WorkspaceRepository                                  │
│    ├→ TimeEntryRepository  ⭐ Largest dataset             │
│    ├→ ProjectRepository                                    │
│    ├→ IssueRepository                                      │
│    ├→ IntegrationRepository                                │
│    └→ SyncOutboxRepository                                 │
│           ↓                                                 │
│      LocalStore (PostgreSQL):                             │
│        dbo.time_entry (PK: id, IX: workspace,user,start)  │
│        dbo.sync_outbox (PK: id, IX: status,next_attempt)  │
│        dbo.* (other tables)                                │
│                                                             │
│  External Gateway:                                         │
│    ├→ RedmineGateway                                       │
│    │    └→ HTTP Client (API calls)                         │
│    └→ Cache Layer                                          │
│                                                             │
│  Mappers:                                                  │
│    ├→ TimeEntry.Mapper (Domain ↔ DB)                      │
│    └→ Project.Mapper (Domain ↔ DB)                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Use Case Mapping na Architecture

| Use Case                      | Presentation               | Business Layer                                | Data Layer                                                                     |
| ----------------------------- | -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| **F1: Register**              | RegisterComponent          | AuthService.register()                        | UserRepository.insert()                                                        |
| **F2: Login**                 | LoginComponent             | AuthService.login() + SessionMgr              | UserRepository.getByEmail()                                                    |
| **F3: Logout**                | LogoutComponent            | AuthService.logout()                          | SessionStore.clear()                                                           |
| **F5: Create WS**             | WorkspaceCreateComponent   | WorkspaceService.create()                     | WorkspaceRepository.insert()                                                   |
| **F7: Timer (Start/Stop)** ⭐ | TimerComponent             | TimeTrackerService.startTimer() / stopTimer() | TimeEntryRepository.update(state=RUNNING/VALIDATED)                            |
| **F8: Manual Entry** ⭐       | TimeEntryFormComponent     | TimeEntryService.create()                     | TimeEntryRepository.insert()                                                   |
| **F9: Edit Entry** ⭐         | TimeEntryFormComponent     | TimeEntryService.update()                     | TimeEntryRepository.update() + TimeEntry.Sync.Services.enqueueSync()           |
| **F10: Delete**               | TimeEntryDeleteComponent   | TimeEntryService.delete()                     | TimeEntryRepository.delete() + enqueueSync()                                   |
| **F11: Setup Integration**    | IntegrationSetupComponent  | IntegrationConfigService.configure()          | IntegrationRepository.upsert() + EncryptionService                             |
| **F12: Sync from Redmine**    | IntegrationStatusComponent | DataSyncService.syncAll()                     | ProjectRepository.upsert() + IssueRepository.upsert() + TagRepository.upsert() |
| **F13: Sync to Redmine** ⭐   | TimeEntryListComponent     | TimeEntrySyncService.pushToExternal()         | SyncOutboxRepository.enqueue() + RedmineGateway.pushTimeEntry()                |
| **F15: Auto Close Issue**     | (Backend job)              | IssueStateService.autoTransition()            | RedmineGateway.updateIssueState()                                              |
| **F16: Idle Detection**       | IdleDetectionComponent     | IdleDetectionService.detectInactivity()       | LogActivity to DB                                                              |
| **F17: Pomodoro**             | (Future)                   | PomodoroService.startSession()                | TimeEntryRepository.createPomodoroSession()                                    |
| **F18: Continuous Sync**      | (Background)               | BackgroundSyncService.continuousPush()        | SyncOutboxService.processQueue()                                               |

---

## 🏗️ Vrstvení v Praxi (Příklad: Create TimeEntry - Use Case F8)

```
User clicks "Create Time Entry" button
    ↓
TimeEntryFormComponent (PRESENTATION)
    ↓ onSubmit(formData)
TimeEntryService.createManualEntry(formData) (BUSINESS)
    ├─ TimeEntryValidationService.validate(formData) ✓
    ├─ Workspace.Services.getCurrentWorkspace() ✓
    ├─ Project.Services.getProject(projectId) ✓
    ├─ TimeEntry aggregate creation
    └─ TimeEntry.Sync.Services.enqueueForSync()
        ↓
        SyncOutboxService.enqueueSyncOutbox({
            operation: 'CREATE',
            timeEntryId: '...',
            status: 'PENDING'
        })
        ↓
        DATA LAYER:
        ├─ TimeEntryRepository.insert(timeEntry) (LOCAL DB)
        └─ SyncOutboxRepository.insert(syncJob) (LOCAL DB)
    ↓
SyncOrchestrationService polls SyncOutbox (background job)
    ↓
    TimeEntrySyncService.pushToExternal(syncJob)
        ├─ RemoteGateway.pushTimeEntry(...) → HTTP to Redmine
        ├─ On success: SyncOutboxRepository.markDone(jobId)
        └─ On failure: SyncOutboxRepository.markFailed(jobId, retry_at)
```

---

## 🔐 Bezpečnost & Izolace

### Workspace Isolation

- ✅ `Workspace` je tenant boundaries
- ✅ Každý uživatel vidí jen svoj **SVŮJ** workspace
- ✅ Row-level security: `time_entry.workspace_id`
- ✅ `WorkspaceMembership` determina přístup

### Data Encryption

- ✅ `Integration.api_key_encrypted` → `EncryptionService`
- ✅ Passwords hashed (bcrypt / Argon2)
- ✅ Secrets nikdy v logs

### Offline-First Security

- ✅ Local DB je chráněn OS file permissions
- ✅ Desktop app má local SQLite (encrypted optional)
- ✅ Sync queue garantuje eventual consistency

---

## 🚀 Deployment & Scalability

### Frontend

- **Web**: Single Page App (React/Vue/Angular)
  - Vrstvy: UI Components → Services → Data Layer (LocalStore abstraction)
- **Desktop**: Electron App
  - SQLite local DB (offline capability)
  - Background sync daemon
  - Idle detection native API hooks

- **Mobile**: React Native / Flutter
  - Realm DB / SQLite
  - Push notifications (WebSocket / FCM)

### Backend (Future)

- BFF (Backend-for-Frontend) API Layer
- Event-driven sync (Kafka/RabbitMQ)
- Horizontal scaling of sync workers
- Distributed tracing (OpenTelemetry)

---

## 📋 Souhrn Dependencies mezi Vrstvami

### Presentation → Business

```
ALL presentation components → Business Services (dependency injection)
No direct database access from UI
No external API calls from UI
```

### Business → Data

```
Business Services → Repositories (abstraction)
Business Services → ExternalGateway (API calls)
Repositories → Local Store (transaction management)
ExternalGateway → HTTP Client
```

### Cross-Layer Concerns

```
- Logging: All layers log to LoggingService
- Error Handling: Business layer catches & translates errors
- DateTime: Centralized timezone handling
- Encryption: Shared crypto service
```

---

## ✅ Benefits tohoto Modelu

1. **Separation of Concerns** ✓
   - UI logika oddělena od business logiky
   - Business logika oddělena od storage logiky

2. **Testability** ✓
   - Mock repositories v unit tests
   - Mock UI v service tests
   - End-to-end testy s embedded DB

3. **Reusability** ✓
   - Services = can be used by Web AND Desktop AND Mobile
   - Repository pattern = swap DB easily (PostgreSQL → MongoDB)

4. **Maintainability** ✓
   - Clear layer responsibilities
   - Easy to locate code (feature-based organization within layers)
   - Dependency direction = always downward (Presentation → Business → Data)

5. **Offline-First Architecture** ✓
   - Local-first design (POST to local DB first, sync async)
   - Sync resilience (SyncOutbox queue pattern)
   - Conflict resolution ready

6. **Performance** ✓
   - Indexes optimized per layer
   - Cache layer in Data repository
   - Query optimization separate from business logic
