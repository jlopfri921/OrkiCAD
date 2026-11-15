/** OrkiCAD stores all CAD dimensions in millimetres regardless of display units. */
export type UnitSystem = 'metric' | 'imperial'
export const MM_PER_INCH = 25.4

// These fields are discrete/angle/standard designations, not free lengths.
// An M6 screw remains M6 in either display system; involute gear module is
// specified by the standardized metric module, not an imperial inch dimension.
const FIXED_FIELDS = new Set(['teeth', 'pressure_angle', 'module'])
export function usesLinearUnits(type: string, field: string): boolean {
  if (FIXED_FIELDS.has(field)) return false
  if ((type === 'metric_screw' || type === 'metric_nut') && field === 'diameter') {
    return false
  }
  return true
}

export function displayNumber(mmValue: number, system: UnitSystem, linear: boolean): number {
  if (system === 'metric' || !linear) return mmValue
  // Round only the displayed input, not the stored engineering value.
  return Number((mmValue / MM_PER_INCH).toFixed(7))
}

export function canonicalNumber(displayValue: number, system: UnitSystem, linear: boolean): number {
  return system === 'imperial' && linear ? displayValue * MM_PER_INCH : displayValue
}

export function fieldUnit(type: string, field: string, system: UnitSystem): string {
  if (field === 'pressure_angle') return '°'
  if (field === 'teeth') return ''
  if (field === 'module') return 'mm'
  if ((type === 'metric_screw' || type === 'metric_nut') && field === 'diameter') return 'M (mm)'
  return system === 'metric' ? 'mm' : 'in'
}
