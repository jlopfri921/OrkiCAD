import React, { useState } from 'react'
import type { Language } from './i18n'

type StarterPart = 'washer' | 'spur_gear' | 'mounting_plate' | 'open_box'

type Props = {
  language: Language
  onOpenEditor: () => void
  onUsePrompt: (prompt: string) => void
  onChoosePart: (part: StarterPart) => void
}

const samples: Array<{ part: StarterPart; icon: string; es: string; en: string; detailEs: string; detailEn: string }> = [
  { part: 'spur_gear', icon: '⚙', es: 'Engranaje', en: 'Gear', detailEs: '24 dientes · módulo 2', detailEn: '24 teeth · module 2' },
  { part: 'mounting_plate', icon: '▤', es: 'Placa de montaje', en: 'Mounting plate', detailEs: '80 × 50 mm · agujeros', detailEn: '80 × 50 mm · holes' },
  { part: 'open_box', icon: '▣', es: 'Caja abierta', en: 'Open enclosure', detailEs: '60 × 40 × 25 mm', detailEn: '60 × 40 × 25 mm' },
  { part: 'washer', icon: '◎', es: 'Arandela', en: 'Washer', detailEs: '18 × 6,5 × 2 mm', detailEn: '18 × 6.5 × 2 mm' },
]

export default function StudioWelcome({ language, onOpenEditor, onUsePrompt, onChoosePart }: Props) {
  const [prompt, setPrompt] = useState('')
  const es = language === 'es'
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = prompt.trim()
    if (value) onUsePrompt(value)
  }
  return <main className="welcome-main" aria-label={es ? 'Inicio de OrkiCAD' : 'OrkiCAD home'}>
    <div className="welcome-container">
      <div className="welcome-heading">
        <span className="welcome-eyebrow">ORKICAD · OPEN SOURCE CAD</span>
        <h1>{es ? '¿Qué quieres diseñar?' : 'What would you like to design?'}</h1>
        <p>{es ? 'Describe una pieza, elige una plantilla o abre el editor paramétrico.' : 'Describe a part, choose a template or open the parametric editor.'}</p>
      </div>
      <form className="welcome-prompt" onSubmit={submit}>
        <label htmlFor="welcome-design-prompt">{es ? 'Describe tu diseño' : 'Describe your design'}</label>
        <textarea id="welcome-design-prompt" rows={3} maxLength={2000} value={prompt}
          onChange={event => setPrompt(event.target.value)}
          placeholder={es ? 'Ej.: Diseña un engranaje recto con 24 dientes, módulo 2 y agujero de 8 mm...' : 'e.g. Design a spur gear with 24 teeth, module 2 and an 8 mm bore...'} />
        <div className="welcome-prompt-actions">
          <span>{es ? 'El asistente te permitirá revisar los parámetros antes de generar.' : 'You can review parameters before generating.'}</span>
          <button type="submit" className="action-primary" disabled={!prompt.trim()}>
            {es ? 'Continuar en el editor' : 'Continue to editor'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
      <div className="welcome-section-head">
        <h2>{es ? 'Empezar con una pieza' : 'Start from a part'}</h2>
        <button type="button" className="welcome-text-button" onClick={onOpenEditor}>
          {es ? 'Explorar biblioteca completa' : 'Explore full library'} <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="welcome-template-grid">
        {samples.map(item => <button type="button" className="welcome-template" key={item.part}
          onClick={() => onChoosePart(item.part)}>
          <span className="welcome-template-icon" aria-hidden="true">{item.icon}</span>
          <strong>{es ? item.es : item.en}</strong>
          <small>{es ? item.detailEs : item.detailEn}</small>
        </button>)}
      </div>
      <div className="welcome-foot">
        <span>{es ? 'Diseño local primero · IA opcional · parámetros editables' : 'Local-first design · Optional AI · Editable parameters'}</span>
        <span>Apache-2.0 · OrkiCAD Core</span>
      </div>
    </div>
  </main>
}
