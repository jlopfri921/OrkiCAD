export interface FeatureViewportModel {
  width: number
  depth: number
  height: number
  operations: Array<{
    op: 'add' | 'cut'
    shape: 'box' | 'cylinder'
    position: [number, number, number]
    size?: [number, number, number]
    radius?: number
    height?: number
  }>
}
export interface FeatureViewportInstance {
  update: (model: FeatureViewportModel, selectedIndex?: number) => void
  select: (index: number) => void
  element: SVGSVGElement
}
export function createFeatureViewport(options: {
  container: HTMLElement
  onSelect?: (index: number) => void
  language?: 'es' | 'en'
}): FeatureViewportInstance
