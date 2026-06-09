import { describe, it, expect } from 'vitest'
import { reactive, ref } from 'vue'

// Mock store data for our test
const mockTags = [
  { id: 'tag-1-a', name: 'TagA', projectId: 'proj-1' },
  { id: 'tag-1-b', name: 'TagB', projectId: 'proj-1' },
  { id: 'tag-2-a', name: 'taga', projectId: 'proj-2' } // casing difference 'taga' vs 'TagA'
]

const mockProjects = [
  { id: 'proj-1', name: 'Timer2Ticket', externalId: 'ext-proj-1' },
  { id: 'proj-2', name: 'SP2-EDU-2025', externalId: 'ext-proj-2' }
]

describe('Tag Swapping and Mismatch Validation Logic', () => {
  it('should auto-swap tag when project changes case-insensitively and not show tag mismatch warning', async () => {
    const form = reactive({
      projectId: 'proj-1',
      tagIds: ['tag-1-a'],
      isProjectManuallySelected: true
    })

    const triggerProjectWatch = (newVal: string) => {
      // Auto-swap tags
      if (form.tagIds && form.tagIds.length > 0) {
        const newTagIds: string[] = []
        for (const oldId of form.tagIds) {
          const oldTag = mockTags.find((t) => t.id === oldId)
          if (oldTag) {
            const newTag = mockTags.find(
              (t) =>
                t.name.trim().toLowerCase() === oldTag.name.trim().toLowerCase() &&
                t.projectId === newVal
            )
            if (newTag) newTagIds.push(newTag.id)
          }
        }
        form.tagIds = newTagIds
      }
      form.projectId = newVal
    }

    triggerProjectWatch('proj-2')
    expect(form.tagIds).toEqual(['tag-2-a']) // Swapped successfully despite casing difference

    const targetProjectId = form.projectId
    let tagMismatch = false
    const validTagIds = form.tagIds.filter((tagId) => {
      const tag = mockTags.find((t) => t.id === tagId)
      if (tag && tag.projectId && targetProjectId && tag.projectId !== targetProjectId) {
        tagMismatch = true
        return false
      }
      return true
    })

    expect(tagMismatch).toBe(false)
    expect(validTagIds).toEqual(['tag-2-a'])
  })

  it('should clear system issue ID on project change when no external issue is selected', () => {
    const form = reactive({
      projectId: 'proj-1',
      issueId: 'system-no-issue-proj-1' as string | undefined,
      externalIssueId: undefined as string | undefined
    })

    const triggerProjectWatch = (newVal: string) => {
      if (!form.externalIssueId) {
        form.issueId = undefined
      }
      form.projectId = newVal
    }

    triggerProjectWatch('proj-2')
    expect(form.issueId).toBeUndefined() // Successfully cleared system issue
  })

  it('should allow choosing a mismatched issue and show project mismatch warning', () => {
    // Simulate dialog form state
    const form = reactive({
      projectId: 'proj-1', // Timer2Ticket
      issueId: 'system-no-issue-proj-1' as string | undefined,
      externalIssueId: undefined as string | undefined,
      issueTitle: '',
      isProjectManuallySelected: true
    })

    const selectedIssueProjectName = ref('')

    // Mock search results and cache
    const issueResults = ref([
      {
        external_id: 11476,
        issue_title: 'Oprava KOM',
        project_name: 'SP2-EDU-2025',
        project_external_id: 'ext-proj-2'
      }
    ])

    const issueCache = new Map<string, (typeof issueResults.value)[0]>()
    issueCache.set('#11476 - Oprava KOM', issueResults.value[0])

    // Simulate onIssueSelected
    const onIssueSelected = (title: string) => {
      if (!title) {
        form.externalIssueId = undefined
        form.issueId = undefined
        form.issueTitle = ''
        selectedIssueProjectName.value = ''
        return
      }

      let match = null
      const matchId = title.trim().match(/^#(\d+)/)
      if (matchId) {
        const extId = Number(matchId[1])
        match =
          Array.from(issueCache.values()).find((r) => r.external_id === extId) ||
          issueResults.value.find((r) => r.external_id === extId)
      }

      if (!match) {
        const key = title.trim()
        match =
          issueCache.get(key) ||
          issueResults.value.find(
            (r) => `#${r.external_id} - ${r.issue_title}` === key || r.issue_title === key
          )
      }

      if (match) {
        form.externalIssueId = String(match.external_id)
        form.issueId = undefined // clear local/system issue ID
        form.issueTitle = `#${match.external_id} - ${match.issue_title}`
        selectedIssueProjectName.value = match.project_name
      } else {
        form.externalIssueId = undefined
        form.issueId = undefined
        form.issueTitle = ''
        selectedIssueProjectName.value = ''
      }
    }

    // Act: select the mismatched issue
    onIssueSelected('#11476 - Oprava KOM')

    // Assert: Issue is selected
    expect(form.externalIssueId).toBe('11476')
    expect(form.issueId).toBeUndefined() // Cleared the system issue ID
    expect(form.issueTitle).toBe('#11476 - Oprava KOM')
    expect(selectedIssueProjectName.value).toBe('SP2-EDU-2025')

    // Project ID should remain proj-1
    expect(form.projectId).toBe('proj-1')

    // Mismatch warning condition should be true
    const showWarning =
      selectedIssueProjectName.value &&
      form.projectId &&
      mockProjects.find((p) => p.id === form.projectId)?.name !== selectedIssueProjectName.value

    expect(showWarning).toBeTruthy()
  })
})
