/**
 * services/index.ts
 *
 * Barrel export for the entire service layer.
 */

export { authService } from './auth.service'
export { timeEntriesService } from './timeEntries.service'
export { workspacesService } from './workspaces.service'
export { timerService } from './timer.service'
// Note: projectsService is a placeholder until the backend adds dedicated project endpoints
export { projectsService } from './projects.service'
