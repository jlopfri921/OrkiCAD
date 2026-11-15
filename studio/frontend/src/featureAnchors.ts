import type { Feature } from './FeatureOperationsEditor'

export type FeatureAnchor = 'absolute-origin' | 'base-center' | 'top-center'

/** Canonical Core units: millimetres.
 * Box positions refer to their minimum XYZ corner.
 * Cylinder positions refer to its axis centre X/Y and base Z.
 * These are editing shortcuts, NOT changes to the global CAD origin.
 */
export function anchoredFeature(
  feature: Feature, anchor: FeatureAnchor,
  base: { width: number; depth: number; height: number },
): Feature {
  const w = Math.max(0, Number(base.width))
  const d = Math.max(0, Number(base.depth))
  const h = Math.max(0, Number(base.height))
  if (![w, d, h].every(Number.isFinite)) return feature
  if (anchor === 'absolute-origin') {
    return { ...feature, position: [0, 0, 0] }
  }
  const x = feature.shape === 'box' ? w / 2 - (feature.size?.[0] ?? 0) / 2 : w / 2
  const y = feature.shape === 'box' ? d / 2 - (feature.size?.[1] ?? 0) / 2 : d / 2
  const z = anchor === 'top-center'
    ? h - (feature.shape === 'box' ? (feature.size?.[2] ?? 0) : (feature.height ?? 0)) / 2
    : feature.position[2]
  return { ...feature, position: [x, y, z] }
}
