/** Native OrkiCAD AI project document v1: exactly one validated part.
 *
 * The frontend creates stable IDs; the Python Core validates each project
 * before it can be saved or loaded. Geometry is never sourced from a
 * previously rendered STL or an untrusted imported filename.
 */
import { apiFetch } from './api'

export const PROJECT_SCHEMA = 'orkicad.project/1'
export type NativeCadProject = {
  schema: typeof PROJECT_SCHEMA
  id: string
  name: string
  units: 'mm'
  origin_mm: [0, 0, 0]
  revision: number
  active_part_id: string
  parts: [{ id: string; type: string; parameters: Record<string, unknown> }]
}

const projectId = () => 'project_' + crypto.randomUUID().replace(/-/g, '')
const partId = () => 'part_' + crypto.randomUUID().replace(/-/g, '')

export function newProject(name: string, type: string, parameters: Record<string, unknown>): NativeCadProject {
  const id = partId()
  return {
    schema: PROJECT_SCHEMA,
    id: projectId(),
    name,
    units: 'mm',
    origin_mm: [0, 0, 0],
    revision: 0,
    active_part_id: id,
    parts: [{ id, type, parameters: structuredClone(parameters) }],
  }
}

export function snapshotProject(previous: NativeCadProject, type: string,
  parameters: Record<string, unknown>, name: string): NativeCadProject {
  const part = previous.parts[0]
  return {
    ...previous,
    name,
    revision: previous.revision + 1,
    active_part_id: part.id,
    parts: [{ id: part.id, type, parameters: structuredClone(parameters) }],
  }
}

export async function validateProject(value: unknown): Promise<NativeCadProject> {
  const response = await apiFetch('/api/document/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
    body: JSON.stringify(value),
  })
  const body = await response.json() as { error?: string; project?: NativeCadProject }
  if (!response.ok || !body.project) {
    throw new Error(body.error || 'OrkiCAD project validation failed')
  }
  if (body.project.schema !== PROJECT_SCHEMA || body.project.parts?.length !== 1) {
    throw new Error('Unexpected OrkiCAD project format')
  }
  return body.project
}
