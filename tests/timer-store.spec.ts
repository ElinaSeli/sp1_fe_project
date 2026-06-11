import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimerStore } from '~/stores/timer.store'
import { useWorkspacesStore } from '~/stores/workspaces.store'
import { useProjectsStore } from '~/stores/projects.store'
import { useIssuesStore } from '~/stores/issues.store'
import { timerService } from '~/services/timer.service'

// Mock the specific service files imported by the store
vi.mock('~/services/timer.service', () => {
  return {
    timerService: {
      start: vi.fn(() =>
        Promise.resolve({
          data: { id: 'new-entry-id', timeStart: new Date().toISOString() },
          error: null
        })
      ),
      getActive: vi.fn(() => Promise.resolve({ data: null, error: null })),
      stop: vi.fn()
    }
  }
})

vi.mock('~/services/timeEntries.service', () => {
  return {
    timeEntriesService: {
      update: vi.fn(),
      getAll: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }
  }
})

describe('Timer Store - Start Timer Default Resolution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Setup workspaces store mock state
    const workspacesStore = useWorkspacesStore()
    workspacesStore.activeWorkspaceId = 'workspace-1'

    // Setup projects store mock state
    const projectsStore = useProjectsStore()
    projectsStore.projects = [
      {
        id: 'proj-no-project',
        workspaceId: 'workspace-1',
        name: 'No Project',
        isExternal: false,
        isSystem: true
      },
      {
        id: 'proj-1',
        workspaceId: 'workspace-1',
        name: 'Project A',
        isExternal: false,
        isSystem: false
      }
    ]

    // Setup issues store mock state
    const issuesStore = useIssuesStore()
    issuesStore.issues = [
      {
        id: 'issue-no-issue-no-proj',
        workspaceId: 'workspace-1',
        projectId: 'proj-no-project',
        name: 'No Issue',
        isSystem: true
      },
      {
        id: 'issue-no-issue-proj-1',
        workspaceId: 'workspace-1',
        projectId: 'proj-1',
        name: 'No Issue',
        isSystem: true
      },
      {
        id: 'issue-custom-1',
        workspaceId: 'workspace-1',
        projectId: 'proj-1',
        name: 'Task 1',
        isSystem: false
      }
    ]
  })

  it('should auto-fill No Project and No Issue when starting empty timer', async () => {
    const timerStore = useTimerStore()

    // Empty draft
    timerStore.draftEntry.projectId = null
    timerStore.draftEntry.issueId = null
    timerStore.draftEntry.externalIssueId = null

    await timerStore.startTimer()

    // Expecting local drafts to resolve to system defaults
    expect(timerStore.draftEntry.projectId).toBe('proj-no-project')
    expect(timerStore.draftEntry.issueId).toBe('issue-no-issue-no-proj')

    // Expecting timerService.start to have been called with the resolved default IDs
    expect(timerService.start).toHaveBeenCalledWith('workspace-1', {
      description: null,
      projectId: 'proj-no-project',
      issueId: 'issue-no-issue-no-proj'
    })
  })

  it('should auto-fill No Issue when project is selected but issue is empty', async () => {
    const timerStore = useTimerStore()

    // Project A selected, no issue
    timerStore.draftEntry.projectId = 'proj-1'
    timerStore.draftEntry.issueId = null
    timerStore.draftEntry.externalIssueId = null

    await timerStore.startTimer()

    // Expecting projectId to remain Project A, and issueId to resolve to Project A's system default issue
    expect(timerStore.draftEntry.projectId).toBe('proj-1')
    expect(timerStore.draftEntry.issueId).toBe('issue-no-issue-proj-1')

    expect(timerService.start).toHaveBeenCalledWith('workspace-1', {
      description: null,
      projectId: 'proj-1',
      issueId: 'issue-no-issue-proj-1'
    })
  })

  it('should preserve chosen issue when starting timer', async () => {
    const timerStore = useTimerStore()

    // Custom issue already selected
    timerStore.draftEntry.projectId = 'proj-1'
    timerStore.draftEntry.issueId = 'issue-custom-1'
    timerStore.draftEntry.externalIssueId = null

    await timerStore.startTimer()

    // Should preserve the selected values
    expect(timerStore.draftEntry.projectId).toBe('proj-1')
    expect(timerStore.draftEntry.issueId).toBe('issue-custom-1')

    expect(timerService.start).toHaveBeenCalledWith('workspace-1', {
      description: null,
      projectId: 'proj-1',
      issueId: 'issue-custom-1'
    })
  })

  it('should resolve to default No Issue when a Redmine issue is selected', async () => {
    const timerStore = useTimerStore()

    // Redmine issue selected (externalIssueId is set, local issueId is null)
    timerStore.draftEntry.projectId = 'proj-1'
    timerStore.draftEntry.issueId = null
    timerStore.draftEntry.externalIssueId = '11476'

    await timerStore.startTimer()

    // Local issueId should get populated with Project A's "No Issue" UUID
    expect(timerStore.draftEntry.projectId).toBe('proj-1')
    expect(timerStore.draftEntry.issueId).toBe('issue-no-issue-proj-1')

    // Start request should NOT contain externalIssueId or tagIds
    expect(timerService.start).toHaveBeenCalledWith('workspace-1', {
      description: null,
      projectId: 'proj-1',
      issueId: 'issue-no-issue-proj-1'
    })
  })
})
