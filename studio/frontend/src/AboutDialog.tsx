import { useEffect, useRef } from 'react'
import type { Language } from './i18n'

type Props = {
  language: Language
  version: string
  onClose: () => void
}

/**
 * In-app legal/about information for OrkiCAD AI.
 *
 * Original OrkiCAD AI source code: Apache-2.0.
 * Branding and third-party dependencies retain their own conditions.
 */
export default function AboutDialog({ language, version, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const es = language === 'es'

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return <div className="about-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="orkicad-about-title"
      aria-describedby="orkicad-about-summary">
      <header className="about-header">
        <img className="about-logo" src="/logo_OrkiCAD-AI.png" alt="OrkiCAD AI"/>
        <div className="about-heading">
          <div className="section-overline">ORKICAD AI / ABOUT</div>
          <h2 id="orkicad-about-title">{es ? 'Acerca de OrkiCAD AI' : 'About OrkiCAD AI'}</h2>
          <span className="about-build">v{version} · DEV · {es ? 'Prototipo de desarrollo' : 'Development prototype'}</span>
        </div>
        <button ref={closeRef} type="button" className="about-close"
          onClick={onClose} aria-label={es ? 'Cerrar acerca de OrkiCAD AI' : 'Close About OrkiCAD AI'}>
          ×
        </button>
      </header>
      <div className="about-content">
        <p id="orkicad-about-summary" className="about-lead">{es
          ? 'OrkiCAD AI es un proyecto de diseño técnico paramétrico, modelado CAD y documentación de piezas asistido por inteligencia artificial. Un mismo núcleo de geometría para Web, escritorio y flujos opcionales de ComfyUI.'
          : 'OrkiCAD AI is an AI-assisted parametric engineering design, CAD modeling and technical documentation project. One shared geometry core serves Web, Desktop and optional ComfyUI workflows.'}</p>
        <div className="about-facts">
          <div><span>{es ? 'Creación y dirección del proyecto' : 'Project creator and lead'}</span><strong>Jorge López Frías</strong></div>
          <div><span>{es ? 'Producto' : 'Product'}</span><strong>OrkiCAD AI · Studio Web / Desktop</strong></div>
          <div><span>{es ? 'Estado actual' : 'Current status'}</span>
            <strong>{es ? 'Código en desarrollo; sin versión estable publicada' : 'Source in development; no stable release published'}</strong></div>
          <div><span>{es ? 'Versión instalada del frontend' : 'Frontend version'}</span><strong>v{version} · DEV</strong></div>
        </div>
        <section className="about-section">
          <h3>{es ? 'Filosofía' : 'Philosophy'}</h3>
          <p>{es
            ? 'CAD primero: medidas exactas, geometría determinista, validación de restricciones y operaciones revisables. La IA interpreta instrucciones y propone parámetros, pero no sustituye las comprobaciones técnicas. Se priorizan el funcionamiento local, la interoperabilidad y el control del usuario.'
            : 'CAD first: accurate dimensions, deterministic geometry, constraint validation and reviewable operations. AI interprets instructions and proposes parameters, but never replaces engineering checks. Local-first operation, interoperability and user control are priorities.'}</p>
        </section>
        <section className="about-section">
          <h3>{es ? 'Tecnología y motores' : 'Technology and engines'}</h3>
          <ul>
            <li><strong>OrkiCAD Core / Python</strong> — {es ? 'catálogo, validación y geometría compartida' : 'shared catalog, validation and geometry'}</li>
            <li><strong>React · TypeScript · Vite</strong> — {es ? 'interfaz Web y Desktop' : 'Web and Desktop interface'}</li>
            <li><strong>Tauri 2 · Rust</strong> — {es ? 'aplicación de escritorio en desarrollo' : 'desktop application under development'}</li>
            <li><strong>OCCT / Open CASCADE · OCP</strong> — {es ? 'sólidos B-rep y exportación STEP para familias compatibles cuando está disponible' : 'B-rep solids and STEP exports for supported part families when available'}</li>
            <li><strong>OpenSCAD · BOSL2</strong> — {es ? 'generación paramétrica de modelos y mallas según instalación y pieza' : 'parametric modeling and meshes depending on installation and part'}</li>
            <li><strong>Ollama</strong> — {es ? 'IA local; modelos en la nube opcionales mediante API' : 'local AI; optional cloud models through API'}</li>
            <li><strong>ComfyUI</strong> — {es ? 'integración opcional para flujos de trabajo' : 'optional workflow integration'}</li>
          </ul>
          <p className="about-muted">{es
            ? 'No todos los motores se incluyen ni están disponibles en todas las instalaciones. Las funciones futuras de CAD 2D, importación y planimetría avanzada no deben confundirse con funciones ya finalizadas.'
            : 'Not every engine is bundled or available in every installation. Future 2D CAD, import and advanced drafting features are not claimed as completed.'}</p>
        </section>
        <section className="about-section">
          <h3>{es ? 'Licencias y reconocimiento' : 'Licensing and attribution'}</h3>
          <p>{es
            ? 'El código original de OrkiCAD AI se publica bajo Apache 2.0 (SPDX: Apache-2.0). Permite usar, modificar y redistribuir bajo sus condiciones, pero no concede derechos de marca sobre el nombre o el logotipo. Cada dependencia conserva su licencia.'
            : 'Original OrkiCAD AI code is licensed under Apache 2.0 (SPDX: Apache-2.0). It allows use, modification and redistribution under its terms but does not grant trademark rights to the project name or logo. Each dependency retains its own license.'}</p>
          <p><strong>Open CASCADE Technology (OCCT)</strong> — © 1999–2026 OPEN CASCADE S.A.S. ·
            LGPL-2.1 {es ? 'con excepción OCCT' : 'with OCCT exception'}. {' '}
            <a href="https://occt3d.com/dev/doc/overview/html/occt_public_license.html"
              target="_blank" rel="noreferrer">{es ? 'Leer condiciones de OCCT' : 'Read OCCT license terms'}</a>.
          </p>
          <p className="about-muted">{es
            ? 'OpenSCAD, BOSL2, las bibliotecas de interfaz y los proveedores de modelos tienen licencias o términos independientes. Antes de distribuir instaladores deben revisarse y documentarse en THIRD_PARTY_NOTICES.md.'
            : 'OpenSCAD, BOSL2, UI libraries and AI providers have independent licenses or terms. Review and document them in THIRD_PARTY_NOTICES.md before distributing installers.'}</p>
        </section>
        <section className="about-section">
          <h3>{es ? 'Proyecto y documentación' : 'Project and documentation'}</h3>
          <div className="about-links">
            <a href="https://github.com/jlopfri921/orkicad-ai" target="_blank" rel="noreferrer">
              {es ? 'Repositorio de OrkiCAD AI' : 'OrkiCAD AI repository'}</a>
            <a href="https://github.com/jlopfri921/orkicad-ai/blob/main/LICENSE"
              target="_blank" rel="noreferrer">{es ? 'Licencia Apache 2.0' : 'Apache 2.0 license'}</a>
            <a href="https://github.com/jlopfri921/orkicad-ai/blob/main/NOTICE"
              target="_blank" rel="noreferrer">{es ? 'Créditos y atribuciones' : 'Credits and attribution'}</a>
            <a href="https://github.com/jlopfri921/orkicad-ai/blob/main/CHANGELOG.md"
              target="_blank" rel="noreferrer">Changelog</a>
            <a href="https://github.com/jlopfri921/orkicad-ai/blob/main/THIRD_PARTY_NOTICES.md"
              target="_blank" rel="noreferrer">{es ? 'Avisos de terceros' : 'Third-party notices'}</a>
          </div>
        </section>
      </div>
      <footer className="about-footer">
        <span>© 2026 OrkiCAD AI · {es ? 'Autoría y contribuciones reconocidas en el proyecto' : 'Authorship and contributions credited in the project'}</span>
        <button type="button" onClick={onClose}>{es ? 'Cerrar' : 'Close'}</button>
      </footer>
    </section>
  </div>
}
