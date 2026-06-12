# Entity Mapping do 3-vrstvé Architektury

## 📊 Tabulka: Kde Patří Jaká Komponenta?

| **Database Table**       | **Domain Entity**       | **Data Layer**          | **Business Layer**                                                    | **Presentation Layer**                                             | **Key Dependencies**                               |
| ------------------------ | ----------------------- | ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| **app_user**             | `AppUser`               | `UserRepository`        | `AuthenticationService` `UserService`                                 | `LoginComponent` `RegisterComponent`                               | Encryption.Service (password)                      |
| **workspace**            | `Workspace`             | `WorkspaceRepository`   | `WorkspaceService`                                                    | `WorkspaceListComponent` `WorkspaceCreateComponent`                | Auth.Services (authorization)                      |
| **workspace_membership** | `WorkspaceMembership`   | `WorkspaceRepository`   | `WorkspaceMembershipService`                                          | `WorkspaceMemberComponent`                                         | Workspace.Service                                  |
| **invitation**           | `Invitation`            | `WorkspaceRepository`   | `InvitationService`                                                   | `InvitationComponent`                                              | Workspace.Service, EmailService                    |
| **integration**          | `Integration`           | `IntegrationRepository` | `IntegrationConfigService`                                            | `IntegrationSetupComponent` `StatusComponent`                      | Encryption.Service (API keys)                      |
| **project**              | `Project`               | `ProjectRepository`     | `ProjectService` `DataSyncService`                                    | `ProjectListComponent` `ProjectSelectComponent`                    | Integration.Services (import)                      |
| **issue**                | `Issue`                 | `IssueRepository`       | `IssueService`                                                        | `IssueListComponent`                                               | Project.Service, Cache Layer                       |
| **tag**                  | `Tag`                   | `TagRepository`         | `TagService`                                                          | `TagSelectorComponent`                                             | Cache Layer                                        |
| **project_tag**          | `ProjectTag` (m:n)      | `TagRepository`         | `TagService`                                                          | (implicit filtering)                                               | Project + Tag services                             |
| **time_entry** ⭐        | `TimeEntry` (Aggregate) | `TimeEntryRepository`   | `TimeTrackerService` `TimeEntryService` `TimeEntryValidationService`  | `TimerComponent` `TimeEntryFormComponent` `TimeEntryListComponent` | **TimeEntry.Sync.Services** **Workspace.Services** |
| **time_entry_tag** ⭐    | `TimeEntryTag` (m:n)    | `TimeEntryRepository`   | `TimeTaggingService`                                                  | `TimeEntryFormComponent` Tag-picker                                | TimeEntry.Service + Tag.Service                    |
| **sync_outbox** ⭐       | `SyncOutboxJob`         | `SyncOutboxRepository`  | `SyncOutboxService` `TimeEntrySyncService` `SyncOrchestrationService` | `SyncStatusComponent` (polled)                                     | **Integration.Services** **TicketingGateway**      |

---

## 🔍 Detailní Roztřídění dle Domény

### 1️⃣ **Identity & Access Management (IAM)**

| Entity                   | Vrstva                                   | Komponenty               | Poznámka                                |
| ------------------------ | ---------------------------------------- | ------------------------ | --------------------------------------- |
| `app_user`               | Auth.Services → UserRepository           | Login, Register, Session | Hashed passwords, unique email/username |
| SessionToken (in-memory) | Cross-Cutting                            | SessionManager           | Token validation na API calls           |
| Workspace Role           | Workspace.Services → WorkspaceMembership | RoleComponent            | OWNER/ADMIN/MEMBER                      |

**Arch. přístup:**

```
User → Auth.Services.authenticate(email, password)
  → Encryption.Service.comparePassword()
  → SessionManager.issueToken()
  → Presentation gets UserContext
```

---

### 2️⃣ **Workspace & Collaboration**

| Entity                 | Vrstva             | Komponenty             | Poznámka            |
| ---------------------- | ------------------ | ---------------------- | ------------------- |
| `workspace`            | Workspace.Services | WorkspaceListComponent | Tenant boundary     |
| `workspace_membership` | Workspace.Services | InvitationComponent    | User allocation     |
| `invitation`           | Invitation.Service | InvitationComponent    | Token-based, expiry |

**Arch. přístup:**

```
Create Workspace:
  Workspace.UI → WorkspaceService.create()
    → WorkspaceRepository.insert(ws)
    → LocalStore.tx { insert into workspace }

Share Workspace:
  Workspace.UI → InvitationService.invite(email, role)
    → generates token_hash
    → SyncOutbox: [send email to invitee]
```

---

### 3️⃣ **Integration & External Data Sync** ⭐⭐

| Entity               | Vrstva               | Komponenty                | Poznámka                  |
| -------------------- | -------------------- | ------------------------- | ------------------------- |
| `integration`        | Integration.Services | IntegrationSetupComponent | Redmine connection config |
| `project` (imported) | DataSyncService      | ProjectListComponent      | Cached from Redmine       |
| `issue` (imported)   | IssueService         | IssueListComponent        | Cached from Redmine       |
| `tag` (imported)     | TagService           | TagSelectorComponent      | Cached from Redmine       |

**Arch. přístup:**

```
Setup Integration (F11):
  Integ.UI → IntegrationConfigService.setupRedmine(baseUrl, apiToken)
    → EncryptionService.encrypt(apiToken)
    → IntegrationRepository.upsert(integration)
    → Test connection: TicketingGateway.testConnection()
    → Status: VERIFYING → ACTIVE

Import Data (F12):
  DataSyncService.syncAll(workspaceId) [Background job]
    → TicketingGateway.fetchProjects()
    → for each project: fetch issues & tags
    → ProjectRepository.upsert() [local]
    → IssueRepository.upsert() [local]
    → TagRepository.upsert() [local]
    → Cache invalidate
```

---

### 4️⃣ **Time Tracking Core** 🌟🌟🌟

| Entity                  | Vrstva                         | Komponenty                     | Poznámka                      |
| ----------------------- | ------------------------------ | ------------------------------ | ----------------------------- |
| `time_entry`            | TimeEntry.Services (Aggregate) | TimerComponent + FormComponent | **Jádro aplikace**            |
| `time_entry_tag`        | TimeTaggingService             | Tag picker v formě             | M:N relace                    |
| `time_entry.state`      | Validation Service             | State machine                  | DRAFT → RUNNING → VALIDATED   |
| `time_entry.sync_state` | Sync Services                  | Async status                   | LOCAL_ONLY → PENDING → SYNCED |

**State Diagram v kódu:**

```typescript
// TimeEntry State Machine (Business Layer)
enum TimeEntryState {
  DRAFT = 'DRAFT', // User edited but not submitted
  RUNNING = 'RUNNING', // Timer active
  VALIDATED = 'VALIDATED', // Ready for sync
  SYNC_PENDING = 'SYNC_PENDING', // Queued
  SYNCED = 'SYNCED', // Successfully pushed to Redmine
  DELETED = 'DELETED' // Soft delete
}

enum SyncState {
  LOCAL_ONLY = 'LOCAL_ONLY', // Not yet synced
  PENDING = 'PENDING', // In sync_outbox queue
  SYNCED = 'SYNCED', // Success
  ERROR = 'ERROR' // Failed, in retry
}
```

**Arch. přístup:**

```
Start Timer (F7):
  TimerComponent → TimeTrackerService.startTimer(projectId, issueId)
    ├─ TimeEntryValidationService.validateWorkspace()
    ├─ Check: no overlapping entries
    ├─ Create TimeEntry(state=RUNNING)
    ├─ TimeEntry.Sync.Services.enqueueForSync(CREATE op)
    │   └─ SyncOutboxRepository.insert({operation: 'CREATE', status: 'PENDING'})
    └─ TimeEntryRepository.insert(timeEntry)
       └─ LocalStore.tx { insert into time_entry, time_entry_tag }

Stop Timer (F7 cont):
  TimerComponent → TimeTrackerService.stopTimer(timeEntryId)
    ├─ TimeEntry: state = VALIDATED (validated by system)
    ├─ Calculate duration
    └─ TimeEntryRepository.update(timeEntry)

Manual Entry (F8):
  TimeEntryFormComponent → TimeEntryService.createManual(formData)
    ├─ Validate input (start_time, end_time, project, issue, description)
    ├─ Create TimeEntry(state=VALIDATED)
    └─ TimeEntryRepository.insert() + enqueueForSync()

Edit Entry (F9):
  TimeEntryFormComponent → TimeEntryService.update(timeEntryId, formData)
    ├─ Check: not already synced (unless allow override)
    ├─ TimeEntry: state = VALIDATED
    ├─ TimeEntryRepository.update()
    └─ TimeEntry.Sync.Services.enqueueForSync(UPDATE op)

Delete Entry (F10):
  TimeEntryListComponent → TimeEntryService.delete(timeEntryId)
    ├─ Soft delete: state = DELETED
    ├─ If already sync'd: enqueue DELETE op to sync_outbox
    └─ TimeEntryRepository.delete()
```

---

### 5️⃣ **Synchronization Queue** 🌟⭐

| Entity              | Vrstva                    | Komponenty          | Poznámka               |
| ------------------- | ------------------------- | ------------------- | ---------------------- |
| `sync_outbox`       | SyncOutboxService         | SyncStatusComponent | **Resilience pattern** |
| Retry logic         | SyncOrchestrationService  | (background)        | Exponential backoff    |
| Conflict resolution | ConflictResolutionService | (async)             | Override strategy      |

**Arch. přístup (Local-First Sync):**

```
Timeline:
  T0: User creates TimeEntry
      ├─ Insert into local time_entry ✓ [IMMEDIATE]
      ├─ Insert into sync_outbox (status=PENDING) ✓
      └─ UI shows success [NO network needed]

  T1: Background sync job wakes up (every 5mins or on-demand)
      ├─ Pull from sync_outbox where status='PENDING'
      ├─ Call TicketingGateway.pushTimeEntry(...)
      │   ├─ Success → sync_outbox.status = DONE,
      │   │             time_entry.sync_state = SYNCED
      │   └─ Failure → sync_outbox.status = FAILED,
      │               next_attempt_at = NOW() + exponential_backoff
      └─ Cache invalidation on success

Offline scenario:
  ✓ User can create/edit/delete time entries without internet
  ✓ All stored in local DB
  ✓ When internet comes back: sync_outbox processes queued jobs
  ✓ User receives notification: "Synced 3 time entries"
```

**SyncOutbox Table:**

```sql
CREATE TABLE sync_outbox (
  id UUID PRIMARY KEY,
  time_entry_id UUID NOT NULL,              -- Which entry to sync
  integration_id UUID NOT NULL,             -- Target integration
  operation VARCHAR(16) NOT NULL            -- CREATE|UPDATE|DELETE
    CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
  status VARCHAR(16) NOT NULL               -- PENDING|PROCESSING|DONE|FAILED
    CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
  attempt_count INT NOT NULL DEFAULT 0,     -- Retry counter
  next_attempt_at TIMESTAMPTZ,              -- Exponential backoff
  last_error TEXT,                          -- Error message
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_sync_outbox_status_next_attempt
  ON sync_outbox(status, next_attempt_at);
  -- For fast polling: SELECT * WHERE status='PENDING' AND next_attempt_at <= NOW()
```

---

### 6️⃣ **Reporting & Analytics**

| Entity                    | Vrstva          | Komponenty         | Poznámka                     |
| ------------------------- | --------------- | ------------------ | ---------------------------- |
| `time_entry` (aggregated) | Report.Services | DashboardComponent | Time rollup                  |
| KPI calculations          | ReportService   | ReportComponent    | Hours/day, project breakdown |
| Export                    | ExportService   | ExportComponent    | CSV/PDF generation           |

**Arch. přístup:**

```
Generate Daily Report:
  ReportComponent → TimeReportService.getDailyReport(userId, date)
    ├─ Query: SELECT SUM(duration) FROM time_entry
    │          WHERE user_id=? AND DATE(time_start)=?
    ├─ Group by: project_id, issue_id
    ├─ Format: { projectName: 'X', hours: 8.5, issues: [...] }
    └─ Return to UI

Export to CSV:
  ExportComponent → ExportService.generateCSV(filters)
    ├─ TimeReportService.getData()
    ├─ Format as CSV
    └─ Download file
```

---

## 🔗 Cross-Entity Dependencies

### TimeEntry → Project

```
When user selects Project in TimeEntryFormComponent:
  ├─ ProjectListComponent shows imported + local projects
  ├─ Local projects: workspace.projects where is_imported=false
  ├─ Imported projects: from Integration sync
  └─ Each time_entry.project_id references project
```

### TimeEntry → Issue

```
When user selects Issue in TimeEntryFormComponent:
  ├─ Must have selected Project first
  ├─ IssueListComponent filters: issue.project_id = selected_project_id
  ├─ Issues are imported from Redmine or local
  └─ Each time_entry.issue_id references issue

Constraint: time_entry.issue_id IS NULL OR time_entry.project_id IS NOT NULL
  (Can't have issue without project)
```

### TimeEntry → Tag

```
Many-to-many via time_entry_tag junction table:
  ├─ User can tag time entries with multiple tags
  ├─ Tags: from Integration import + local tags
  ├─ Tag cache layer for fast loading
  └─ Filtering: "Show time entries with tag='Bug Fix'"
```

### Project ↔ Tag (m:n)

```
Also has many-to-many via project_tag junction:
  ├─ Projects can be tagged for organization
  ├─ Used for project categorization
  └─ Impacts filtering in TimeEntryForm
```

---

## 🏗️ Architectural Principles Applied

### 1. **Layered Dependency Flow**

```
Presentation → Business → Data
      ↓          ↓         ↓
  UI Logic   Domain Logic  Storage

NO reverse dependencies!
NO Presentation calling Repository directly!
NO Business calling UI!
```

### 2. **Aggregate Pattern**

```
TimeEntry = Aggregate Root
  ├─ TimeEntry entity
  ├─ TimeEntryTag (collection)
  └─ Cohesive business logic in TimeEntry.Services

Workspace = Aggregate Root
  ├─ Workspace entity
  ├─ WorkspaceMembership (collection)
  ├─ Invitation (collection)
  └─ Logic in WorkspaceService
```

### 3. **Repository Pattern**

```
Each Data Entity has:
  ├─ Repository: Abstraction over storage
  ├─ Mapper: Domain ↔ DB Record conversion
  └─ Query methods: getById, list by filter, etc.

Benefit: Can swap PostgreSQL for MongoDB without changing Business Layer
```

### 4. **Service Layer Interception**

```
Business Services can:
  ✓ Call other Business Services (e.g., TimeEntry → Workspace validation)
  ✓ Call Repository interfaces for data
  ✓ Use Cross-Cutting Services (DateTime, Encryption, Logging)
  ✗ Call Presentation directly
  ✗ Call external APIs directly (goes through Gateway)
```

### 5. **Local-First + Sync Pattern**

```
Timeline:
  User action → Insert to local DB IMMEDIATELY
              → Enqueue sync job
              → UI confirms
              ↓
              Background job polls sync_outbox
              → Calls external API
              → On success/failure: update local DB
              → Eventual consistency achieved
```

---

## 📝 Use Case → Component Mapping

| #   | Use Case               | Presentation              | Business                                | Data                                |
| --- | ---------------------- | ------------------------- | --------------------------------------- | ----------------------------------- |
| F1  | 👤 Register            | RegisterComponent         | AuthService.register()                  | UserRepository.insert()             |
| F2  | 🔑 Login               | LoginComponent            | AuthService.login()                     | UserRepository.getByEmail()         |
| F3  | 🚪 Logout              | LogoutComponent           | AuthService.logout()                    | SessionStore.clear()                |
| F4  | 🔒 Isolation           | (Auth middleware)         | Auth.validateWorkspaceAccess()          | WorkspaceMembership query           |
| F5  | 📁 Create WS           | WorkspaceCreateComponent  | WorkspaceService.create()               | WorkspaceRepository.insert()        |
| F6  | 📱 Offline             | (Timer runs local)        | OfflineSyncService                      | LocalStore (no network)             |
| F7  | ⏱️ Timer               | TimerComponent            | TimeTrackerService.startTimer/stopTimer | TimeEntryRepository.update()        |
| F8  | ✏️ Manual              | TimeEntryFormComponent    | TimeEntryService.createManual()         | TimeEntryRepository.insert()        |
| F9  | 📝 Edit                | TimeEntryFormComponent    | TimeEntryService.update()               | TimeEntryRepository.update()        |
| F10 | 🗑️ Delete              | TimeEntryListComponent    | TimeEntryService.delete()               | TimeEntryRepository.delete()        |
| F11 | 🔗 Setup Integration   | IntegrationSetupComponent | IntegrationConfigService.setup()        | IntegrationRepository.upsert()      |
| F12 | 🔄 Import from Redmine | (Background)              | DataSyncService.syncAll()               | ProjectRepository.upsert()          |
| F13 | 📤 Push to Redmine     | TimeEntryListComponent    | TimeEntrySyncService.push()             | SyncOutboxRepository.process()      |
| F15 | 🔄 Auto Close          | (Background)              | IssueStateService.autoTransition()      | TicketingGateway.updateIssueState() |
| F16 | 😴 Idle                | IdleDetectionComponent    | IdleDetectionService.detect()           | ActivityLog                         |
| F17 | 🍅 Pomodoro            | (Future)                  | PomodoroService.start()                 | TimeEntryRepository.createSession() |
| F18 | 📡 Continuous Sync     | (Background)              | BackgroundSyncService.poll()            | SyncOutboxService.processQueue()    |

---

## 🎯 Summary

**Presentation Layer hostuje:**

- Všechny UI komponenty (React, Vue, Angular, Svelte, atd.)
- Event handlers & form state
- UI validation (quick feedback)
- HTTP client wrapper (dependency injection)

**Business Layer je srdcem aplikace:**

- Domain entities & aggregates
- Business rules & workflows
- Service orchestration
- Error handling & logging

**Data Layer zajišťuje persistenci:**

- Local-first PostgreSQL/SQLite
- Repository pattern for abstraction
- External API gateways (Redmine, Jira, etc.)
- Sync resilience via outbox pattern
- Caching for performance

**Výsledek:** ✅ Cleanable, Testable, Maintainable, Scalable architektura!
