# Changelog

All notable changes will be recorded here, grouped by released version. The project uses a SemVer-inspired policy described in [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

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
