# Changelog

All notable changes will be recorded here, grouped by released version. The project uses a SemVer-inspired policy described in [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

### Modelo compartido de croquis circulares (rama en desarrollo)

- Nueva representación geométrica 2D de círculos, arcos, segmentos y coordenadas absolutas con parámetros conductores, base para evolucionar hacia restricciones de croquis.
- El **mismo croquis XY** alimenta CAD 2D y Planta XY de Planimetría para ejes, arandelas, tubos huecos y placas circulares; selección de contornos y edición contextual de diámetros/radios/distribución de taladros sin menú lateral adicional.
- El anillo abierto reutiliza arcos analíticos y segmentos radiales del modelo de croquis; no cambia su interpretación de la longitud de arco exterior.
- La geometría inválida no se convierte silenciosamente en un rectángulo. Esta etapa no constituye todavía un croquis libre ni proyecciones OCCT HLR universales.
- Contratos Python de interfaz y guía `docs/SHARED_CIRCULAR_SKETCH_V1.md`; compilación y aceptación Windows/Tauri todavía pendientes.



### Corrección de diseño circular y croquis 2D editable (2026-11-16)

- Añadida familia paramétrica `split_ring` de anillo abierto con radio interior, diámetro exterior y sector radial eliminado. El hueco se mide como **longitud del arco exterior** y el perfil tiene dos bordes radiales, no una cuerda o rectángulo.
- En CAD 2D y Planta XY de Planimetría, dibujo SVG específico con dos arcos concéntricos abiertos, aristas exteriores/interiores/radiales seleccionables y edición contextual de sus cotas; los parámetros se comparten con el sólido extruido 3D.
- El intérprete reconoce peticiones de anillos abiertos en español o inglés sin pasar por una plantilla rectangular; si faltan dimensiones críticas rechaza la propuesta en lugar de inventar geometría. Comunica supuestos de diámetro y espesor.
- Ejemplo reproducible en la biblioteca bilingüe; pruebas de fórmulas de arco, extremos radiales, geometría inválida, API y contratos de interfaz. Estado: **pendiente de ejecutar en Windows y de aceptación visual Web/Tauri**.
- No son todavía un croquis 2D genérico ni proyecciones B-rep de alzado/perfil/sección de esta familia; no se anuncia STEP analítico para el nuevo perfil.
- Véase `docs/OPEN_RING_2D.md`.



### Primera sección real OCCT B-rep — desarrollo

- Nuevo cálculo geométrico de sección XZ en el plano Y=0 a partir de sólidos OCCT B-rep verdaderos, comenzando por placas circulares, arandelas, tubos huecos y ejes macizos.
- Exposición mediante la API validada `/api/occt/section`, compartida por Web y el puente privado Tauri.
- Vista de contornos de intersección OCCT en Planimetría con identificación explícita de origen. Si OCCT falla o no está instalado se utiliza una vista nominal provisional señalada como no verificada.
- Pruebas para geometría nativa opcional, ruta HTTP y contratos de interfaz. **Sin validación final de instalación Web/Tauri ni motor OCCT incluido en el instalador.**
- Documentado en `docs/OCCT_BREP_SECTION_V1.md`.



### Extended 2D views and nominal XZ sections (2026-11-16)

- Expanded drawing previews for angle brackets, finished rounded/chamfered corner plates and machined blocks, including holes/pockets and profile outlines where their catalog geometry is known.
- Replaced several unsupported section notices with **catalog-parameter-derived XZ cross sections** for supported plain and hollow shafts, plates, boxes, brackets and machined blocks, including cavities and bores intersecting the defined section plane.
- The section plane is explicit (round parts: central axis Y=0; rectangular parts: central Y=depth/2); this remains a **nominal SVG preview** rather than an independently verified OCCT cutting or hidden-line result. Complex profiles, full imported CAD and arbitrary cuts remain future work.
- Added regression contracts and updated user-facing help instead of fabricating generic rectangular silhouettes.



### Studio AI settings, branding and editorial scope (2026-11-16)

- Collapsed the **AI configuration** section by default in the Studio Web/Tauri sidebar; prompt, examples and generation action stay visible.
- Added versioned **per-browser/WebView storage** for allowlisted AI provider and model choices, including remembering a different model per provider. **Cloud API keys are never persisted.**
- Registered a separate authenticated **per-user** profile/database/credentials roadmap (issue #12) for multiuser Web and optional Tauri; same-browser localStorage is not account isolation.
- Clarified ComfyUI is **out of scope** for Studio user profiles, settings databases and secret vaults.
- Styled the official logo with a bordered rounded-rectangle treatment in the shared Web/Tauri header and the generated Windows application icon.
- Recorded feature request for actual geometric **edge/vertex/circular contour selection** and linked diameter/radius edits (issue #13); this is not implemented by the current mesh-face selector.



### Stabilization & verification (2026-11-16)

- Fixed Windows OCCT verification script quoting: native Python `import OCP` now runs without nested quotes that PowerShell could strip, and added a regression contract. User's local report passed 171 tests (one optional skip) and production Web build; optional `-VerifyOCCT` check was previously blocked by this script-only syntax error.

- Identified an OCCT/cadquery-ocp binding incompatibility causing actual STEP corner finishing tests to fail: older supported bindings expose `TopoDS.Edge` instead of `TopoDS.Edge_s`. Added a compatibility conversion and source-level regression checks; **native B-rep STEP tests are not yet reverified**.
- Added a repeatable local Windows verification entry point `scripts/verify-studio.ps1`: Python Core tests, version guard and Web build, with opt-in actual OCCT integration and localhost preview.
- GitHub Actions provisioner issues may terminate jobs without a runner or any executed steps. CI must be rerun successfully, and Windows GUI acceptance performed, before integrating unverified changes into `main`.



### First native project document slice — 2026-11-16

- Adopted **`.okad`** as the official OrkiCAD AI project extension, retaining JSON inside and legacy `.orkicad.json` import support.

- Added `orkicad.project/1` strictly validated, versioned, single-part project format with persistent document and part IDs, canonical mm units, stable origin and revision number.
- Added project **Open / Save** controls in the shared Web and Tauri interface with `.okad` export, compact editable project name, Core validation on load/save, and complete 3D regeneration after opening.
- Native document loading refuses unsupported fields, geometry, unknown schemas or inconsistent dimensions instead of silently discarding information. Multi-part assemblies, actual 2D sketch documents and external STEP/STL import remain future work.
- Added Python source-level and runtime validation tests, documentation and shared private Tauri API route. Implementation in PR #9, subject to CI and Windows acceptance.



### Testable Web / Tauri integration snapshot (2026-11-16)

- Consolidated the OrkiCAD AI bilingual prompt library, About dialog, official branding/version, CAD 2D/3D/Planimetry tab shell and nominal drawing previews in a shared source branch.
- Added stale STL editing guard and explicit on-canvas warning; current geometry selection and export are distinguished from old previews.
- Added `studio/web_runner.py` and `Start-OrkiCAD-Web.ps1` to run the **built Web app with the Core API on a single localhost port**, no Vite proxy needed.
- Added `Start-OrkiCAD-Desktop.ps1` for local Tauri development with automatic private Python worker startup.
- Added an **experimental Windows Tauri installer CI job** that bundles a minimal local Python Core worker via PyInstaller and the approved OrkiCAD AI logo; it **does not bundle OpenSCAD, BOSL2 or OCCT**.
- Added Web and Desktop GitHub Actions test artifact jobs, source tests, and `docs/TEST_SNAPSHOT.md` with test instructions and dependency limitations. **Actual installer availability requires successful CI**, not just source changes.
- Integrated three-workspace and advanced roadmap documents; DXF import/edit, real B-rep planimetry and photo-to-CAD reconstruction remain planned and are not advertised as operational.



**Development build v0.0.1 (2026-11-16)** — OrkiCAD AI source prototype; no published release, installer or Git tag. Version 0.0.1 is synchronized across Python Core, Studio Web and Desktop. Changes below are under development, not claims of completed Windows acceptance.

### Added — Studio Web / Desktop development (2026-11-16)

- Bilingual prompt example library grouped by difficulty and CAD prompt-writing tips — **PR #5 pending review**.
- Bilingual **About OrkiCAD AI** dialog with creation/project credits, philosophy, technical stack, version, licensing status and third-party notices — **PR #5 pending review**.
- Deliberately small ComfyUI integration policy: only verified headless, composable Core operations; interactive CAD editing, drawings and section gizmos remain Web/Desktop — **PR #5 pending review**.
- `docs/LICENSING_DECISION.md` documents Apache-2.0 as a recommendation, **not an adopted license**, and records the dependency audit required before release.
- Official OrkiCAD AI branding, technical typography and visible `v0.0.1 · DEV` in header/footer — **PR #5 pending review**.
- Build-time version check for Python Core, Studio Web and Tauri Desktop — **PR #5 pending review**.
- First three-workspace CAD 2D / CAD 3D / drawings prototype with nominal dimensions — **PR #6 pending review**.
- Stale-STL guard that pauses face editing during regeneration — **PR #4 pending review**.
- Parametric components, straight bevel-gear prototype, screw head/drive dropdowns and explicit Torx/Phillips sizes.
- Geometry parameter validation and regression tests; Windows runtime acceptance remains pending.

### Licensing, reconstruction roadmap and ComfyUI scope (2026-11-16)

- **Apache License 2.0 adopted** for original OrkiCAD AI source code; added the standard root `LICENSE`, `NOTICE`, package metadata, README and third-party attributions. The official logo/name and external engines retain separate rights. Changes remain in **PR #5 until merged**.
- Added a staged **sketch / DXF technical drawings / multi-photo → validated editable CAD** plan in `docs/RECONSTRUCTION_MULTIVIEW_PLAN.md`; this is a design roadmap, not a working importer or reconstruction model.
- Confirmed deliberately minimal ComfyUI automation: only tested headless, composable Core functionality becomes nodes. No clone of interactive Web/Desktop features.

### Changed — project identity

- Official name is **OrkiCAD AI**, with `Studio` as the editor name, not the product name.
- Source builds are marked `DEV`; released versions require tags and acceptance checks.


### Added

- BOSL2-backed M3–M12 screw/nut and involute spur gear SCAD source generation, validated JSON examples and unit-test source.
- Optional CLI `--bosl2-dir` and Windows guide for external BOSL2 installation.


- First Python prototype: validated washer, mounting plate and open-box OpenSCAD generators, CLI, JSON examples, basic tests and GitHub Actions configuration.

- Initial project vision and planned architecture.
- Initial project scope, roadmap, versioning, security and contribution documentation.
- Planned local Ollama and optional OpenAI, Anthropic Claude and Google Gemini providers.

### Not released

- No downloadable production-ready CAD release, desktop application or ComfyUI workflow has been published yet. A prototype source generator is present.

### In progress — geometry tools and Studio

- Added an optional Trimesh/NetworkX mesh inspection command with machine-readable report and tests.
- Added an early React/TypeScript Studio part-parameter interface connected to a local Python CAD endpoint, with API tests.
- Recorded successful basic topological checks for four sample STL meshes from maintainer-provided Windows logs.
- **Unverified:** Studio frontend build, inspector command and end-to-end browser/API interaction on maintainer machine.

### Source committed — ComfyUI prototype (unverified on ComfyUI Desktop)

- Added the first four ComfyUI-native nodes: part specification, OpenSCAD source generation, STL rendering and local Ollama parameter interpretation.
- Added an example LiteGraph workflow JSON for an editable box lid; workflow execution is **pending validation** on the maintainer's ComfyUI Desktop installation.
- Added Python regression tests for shared catalog entries, prototype box lids and bottle caps, node registration and workflow structure.
- Added English installation and security guidance in `docs/COMFYUI_INTEGRATION.md`.
- The integration reuses `orkicad_core` and does not independently execute AI-generated source code.

### Source committed — local AI to CAD workflow (pending on-device test)

- Added a second ComfyUI JSON example combining local Ollama interpretation with validated parametric SCAD/STL generation.
- Documented required local model selection and the prototype limitation of rendering from AI-proposed values without a dedicated review step.
- Added workflow wiring and validation regression tests. No new release has been tagged.

### Fixed in source (pending Windows retest)

- Local Ollama request timeout is now configurable (180-second default, maximum 600 seconds) with explicit error messages for timeouts and provider connection issues, addressing the first observed ComfyUI AI-node timeout.
- Added offline adapter regression tests. A successful Ollama-to-STL workflow execution remains unverified.
