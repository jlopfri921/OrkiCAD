# Changelog

All notable changes will be recorded here, grouped by released version. The project uses a SemVer-inspired policy described in [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

### Planning — CAD workspaces, photo references, reverse engineering (2026-11-16)

- Consolidated the execution order for common CAD document, CAD 2D editor, B-rep modeling, drawing/sections, import/edit, multi-photo measurements, depth reconstruction and **reverse engineering**.
- Added design contracts for photo IDs F01…Fnn, markers P/D/C/S, user-confirmed dimensions, plane-specific scale calibration and cross-image feature associations.
- Defined partial/full-axis revolutions, extrusion, circle-to-rectangle loft and sweep operations with typed inputs, validation and independent measurement gates.
- Defined inverse-modeling workflows for measured physical parts, STEP B-reps, STL/3MF meshes, dimensioned plans and scans, with original-vs-reconstructed deviation review.
- All entries above describe **future architecture, not implemented or tested product features**.


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
