import React, { useState } from 'react'
import FeatureSchematic from './FeatureSchematic'

export type Feature = {
  op: 'add' | 'cut'
  shape: 'box' | 'cylinder'
  position: [number, number, number]
  size?: [number, number, number]
  radius?: number
  height?: number
}

type Props = {
  operations: Feature[]
  onChange: (next: Feature[]) => void
  language: 'en' | 'es'
  width: number
  depth: number
  height: number
}

const defaultFeature = (shape: 'box' | 'cylinder' = 'box', op: 'add' | 'cut' = 'cut'): Feature =>
  shape === 'box'
    ? { op, shape, position: [10, 10, 3], size: [20, 20, 5] }
    : { op, shape, position: [12, 12, -0.1], radius: 3, height: 12.2 }

/** Reusable React editor for Studio Web and the future Tauri desktop shell.
 * Canonical dimensions are always millimetres. The core validates the result.
 */
export default function FeatureOperationsEditor({ operations, onChange, language, width, depth, height }: Props) {
  const [selected, setSelected] = useState(0)
  const isEs = language === 'es'
  const text = {
    add: isEs ? 'Añadir' : 'Add', cut: isEs ? 'Restar' : 'Cut',
    box: isEs ? 'Caja' : 'Box', cylinder: isEs ? 'Cilindro' : 'Cylinder',
    position: isEs ? 'Posición' : 'Position', size: isEs ? 'Dimensiones' : 'Size',
    radius: isEs ? 'Radio' : 'Radius', height: isEs ? 'Altura' : 'Height',
    remove: isEs ? 'Eliminar' : 'Remove', up: isEs ? 'Subir' : 'Up',
    down: isEs ? 'Bajar' : 'Down', new: isEs ? 'Añadir operación' : 'Add operation',
    note: isEs ? 'Historial paramétrico (mm). El orden altera el sólido.' : 'Parametric history (mm). Order changes geometry.',
  }
  const setFeature = (index: number, feature: Feature) =>
    onChange(operations.map((item, i) => i === index ? feature : item))
  const swap = (index: number, target: number) => {
    if (target < 0 || target >= operations.length) return
    const next = [...operations]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSelected(target)
    onChange(next)
  }
  const number = (value: number, aria: string, update: (n: number) => void) =>
    <input aria-label={aria} type="number" step="any" value={value}
      onChange={event => {
        if (event.target.value.trim() === '') return
        const parsed = Number(event.target.value)
        if (Number.isFinite(parsed) && Math.abs(parsed) <= 500) update(parsed)
      }} />

  return <section className="feature-history" aria-label={text.note}>
    <p className="hint">{text.note}</p>
    <FeatureSchematic width={width} depth={depth} height={height}
      operations={operations} selected={selected} onSelect={setSelected} language={language} />
    {operations.map((item, index) => <article key={index}
      className={index === selected ? 'feature-card selected' : 'feature-card'}>
      <div className="feature-toolbar">
        <button className="secondary" onClick={() => setSelected(index)}
          aria-label={'Select operation ' + (index + 1)}>{index === selected ? '●' : '○'} {index + 1}</button>
        <select aria-label={'Operation mode ' + (index + 1)} value={item.op}
          onChange={event => setFeature(index, { ...item, op: event.target.value as Feature['op'] })}>
          <option value="add">{text.add}</option><option value="cut">{text.cut}</option>
        </select>
        <select aria-label={'Primitive shape ' + (index + 1)} value={item.shape}
          onChange={event => {
            const shape = event.target.value as Feature['shape']
            setFeature(index, { ...defaultFeature(shape, item.op), position: item.position })
          }}>
          <option value="box">{text.box}</option><option value="cylinder">{text.cylinder}</option>
        </select>
      </div>
      <div className="feature-toolbar">
        <button className="secondary" disabled={index === 0} onClick={() => swap(index, index - 1)}>{text.up} ↑</button>
        <button className="secondary" disabled={index === operations.length - 1}
          onClick={() => swap(index, index + 1)}>{text.down} ↓</button>
        <button className="secondary" disabled={operations.length <= 1}
          onClick={() => onChange(operations.filter((_, i) => i !== index))}>{text.remove}</button>
      </div>
      <div className="feature-numbers">
        <strong>{text.position} (X / Y / Z mm)</strong>
        <div className="feature-three">
          {item.position.map((value, axis) => <label key={axis}>{'XYZ'[axis]}
            {number(value, 'Feature ' + (index + 1) + ' position ' + 'XYZ'[axis],
              parsed => setFeature(index, {
                ...item, position: item.position.map((v, i) => i === axis ? parsed : v) as Feature['position'],
              }))}
          </label>)}
        </div>
        {item.shape === 'box' ? <>
          <strong>{text.size} (X / Y / Z mm)</strong>
          <div className="feature-three">
            {(item.size ?? [20, 20, 5]).map((value, axis) => <label key={axis}>{'XYZ'[axis]}
              {number(value, 'Feature ' + (index + 1) + ' size ' + 'XYZ'[axis],
                parsed => setFeature(index, { ...item,
                  size: (item.size ?? [20,20,5]).map((v, i) => i === axis ? parsed : v) as Feature['position'],
                }))}
            </label>)}
          </div>
        </> : <div className="feature-two">
          <label>{text.radius} (mm)
            {number(item.radius ?? 3, 'Feature radius ' + (index + 1),
              parsed => setFeature(index, { ...item, radius: parsed }))}
          </label>
          <label>{text.height} (mm)
            {number(item.height ?? 12.2, 'Feature height ' + (index + 1),
              parsed => setFeature(index, { ...item, height: parsed }))}
          </label>
        </div>}
      </div>
    </article>)}
    <button className="secondary" disabled={operations.length >= 8}
      onClick={() => { onChange([...operations, defaultFeature()]); setSelected(operations.length) }}>
      + {text.new} ({operations.length}/8)
    </button>
  </section>
}
