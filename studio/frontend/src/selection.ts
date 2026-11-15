/** Conservative mapping between a clicked STL surface and editable CAD fields.
 * STL knows triangles but not native OCCT feature identities. Do NOT infer
 * hole IDs or radii from arbitrary triangles; that requires B-rep metadata.
 */
export type PrincipalAxis = 'x' | 'y' | 'z'

export interface FaceSelection {
  axis: PrincipalAxis | null
  direction: number
  outerBoundary: boolean
  normal: [number, number, number]
}

export function fieldForSelectedFace(
  part: string, face: FaceSelection, available: string[],
): string | null {
  const map: Record<string, Partial<Record<PrincipalAxis, string[]>>> = {
    washer: { z: ['thickness'] },
    mounting_plate: { x: ['width'], y: ['depth'], z: ['thickness'] },
    open_box: { x: ['width'], y: ['depth'], z: ['height'] },
    metric_screw: { z: ['length'] },
    metric_nut: { z: ['thickness'] },
    spur_gear: { z: ['thickness'] },
    box_lid: { z: ['thickness'] },
    bottle_cap: { z: ['height'] },
    corner_plate: { x: ['width'], y: ['depth'], z: ['thickness'] },
    machined_block: { x: ['width'], y: ['depth'], z: ['height'] },
    // The highest Z of a feature-model may belong to a boss, not the base.
    feature_model: { x: ['width'], y: ['depth'] },
  }
  // A drilled cylindrical wall can have an X/Y normal too, but is not a
  // width or depth face. Only match surfaces on the overall bounds.
  const candidates = face.axis && face.outerBoundary ? map[part]?.[face.axis] ?? [] : []
  return candidates.find(key => available.includes(key)) ?? null
}

export function faceAxisLabel(face: FaceSelection, language: 'es' | 'en'): string {
  if (!face.axis) return language === 'es' ? 'Superficie inclinada o curva' : 'Curved or angled surface'
  const axis = face.axis.toUpperCase()
  return language === 'es' ? 'Cara perpendicular al eje ' + axis : 'Face perpendicular to ' + axis
}
