/** Browser-local OrkiCAD project snapshots. No network calls or geometry execution. */
export const PROJECT_STORAGE_KEY = 'orkicad.studio.projects.v1'

export type LocalCADProject = {
  schemaVersion: 1
  id: string
  name: string
  partType: string
  parameters: Record<string, unknown>
  prompt: string
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function validProject(value: unknown): value is LocalCADProject {
  return isRecord(value) && value.schemaVersion === 1 &&
    typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 100 &&
    typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 100 &&
    typeof value.partType === 'string' && value.partType.length <= 100 &&
    isRecord(value.parameters) &&
    typeof value.prompt === 'string' && value.prompt.length <= 2000 &&
    typeof value.updatedAt === 'string'
}

export function readLocalProjects(): LocalCADProject[] {
  try {
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY)
    if (!raw || raw.length > 2_000_000) return []
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(validProject).slice(0, 30).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch { return [] }
}

export function saveLocalProject(project: LocalCADProject): LocalCADProject[] {
  if (!validProject(project)) throw new Error('Invalid project')
  const current = readLocalProjects().filter(p => p.id !== project.id)
  const next = [project, ...current].slice(0, 30)
  // Persist first: never claim success if storage is disabled or full.
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function removeLocalProject(projectId: string): LocalCADProject[] {
  const next = readLocalProjects().filter(p => p.id !== projectId)
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function newLocalProjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `project-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
