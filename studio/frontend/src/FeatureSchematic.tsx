import React, { useEffect, useRef } from 'react'
import { createFeatureViewport, type FeatureViewportInstance } from './feature_viewport'
import type { Feature } from './FeatureOperationsEditor'

type Props = {
  width: number
  depth: number
  height: number
  operations: Feature[]
  selected: number
  onSelect: (index: number) => void
  language: 'es' | 'en'
}

/** Same framework-neutral SVG module as the ComfyUI editor; no CAD kernel
 * in the browser. Shows individual primitives, not the Boolean output.
 */
export default function FeatureSchematic({
  width, depth, height, operations, selected, onSelect, language,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const viewer = useRef<FeatureViewportInstance | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!container.current) return
    viewer.current = createFeatureViewport({
      container: container.current,
      language,
      onSelect: index => onSelectRef.current(index),
    })
    return () => {
      viewer.current = null
      container.current?.replaceChildren()
    }
  }, [language])

  useEffect(() => {
    viewer.current?.update({ width, depth, height, operations }, selected)
  }, [width, depth, height, operations, selected, language])

  return <div className="feature-schematic" ref={container} />
}
