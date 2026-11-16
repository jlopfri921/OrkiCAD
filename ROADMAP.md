# OrkiCAD AI — Master Roadmap

**Canonical technical documentation: English only (for now).**  
**Planning baseline:** 2026-11-15.  
**Current internal source version:** `0.0.1` (no official tagged release).  
**Next proposed prerelease:** `0.1.0-alpha.1` (pending integration tests).

> This is the canonical long-term product vision. The 140 items below are target capabilities, **not** a statement that all are implemented or guaranteed stable in v1.0.0. Every milestone is evidence-based and has no promised calendar date.

## 2026-11-16: Agreed integrated delivery plan (current priority)

**Project name: OrkiCAD AI.** The app is OrkiCAD AI Studio. This section supersedes older milestone **priorities**, but does not retroactively certify features or published versions. Track review-branch features as **under review**, not shipped. See [project status](docs/STATUS.md), [versioning](docs/VERSIONING.md), [feature operation design](docs/FEATURE_OPERATIONS_SPEC.md), [photo references](docs/MULTIVIEW_PHOTO_REFERENCES.md) and [depth reconstruction](docs/DEPTH_RECONSTRUCTION_PLAN.md).

### Product workspaces and common engine

1. **CAD 2D:** real editable vector entities, layer/blocks, constraints, dimension input, local prompt-to-typed commands and DXF import/export.
2. **CAD 3D:** native/parametric solids, reliable regeneration, STEP/STP as the first exact CAD import; STL/3MF as mesh workflows; SCAD and FCStd using suitably restricted/optional adapters; extrude, revolve, loft, sweep and a persistent feature history.
3. **Drawings, views and sections:** top/front/side, arbitrary planar cuts, hatching, isometric cutaways, technical templates and automatic associative dimensions from exact geometry.

The three modes share one document, units, absolute coordinates, named sketch planes, selected entities, history, undo/redo, error state and a single **Core** CAD backend. The AI proposes typed operations requiring validation and approval; it never executes arbitrary model-generated Python/SCAD/shell scripts.

### Implementation order — practical vertical slices

| Slice | Main work | Deliverable and acceptance gate | Status |
| --- | --- | --- | --- |
| **A0. Stabilize & audit** | Restore/compile latest Web + Desktop, test geometry regeneration, stale model guards, localized invalid-parameter errors, version display and changelog | Same valid part updates after a parameter edit in Web/Desktop; invalid dimensions produce an actionable warning; no stale STL export | Mixed local prototype; follow-up PRs #4/#5 under review |
| **A1. Shared CAD document** | Versioned IDs for sketches, faces/features, dimensions, source files, coordinate frames, operation history, dependency revisions, undo/redo | Save/reopen a sample, preserve IDs and mm units, reject bad references and conflicting dimensions | Planned |
| **A2. CAD 2D foundation** | Editable lines, arcs, circles, polyline loops, 2D blocks and dimension constraints; DXF import/export | Simple drawing round-trips to DXF preserving scale, arcs, layers and parametric constraints where representable | Planned; initial nominal SVG preview in PR #6 under review |
| **A3. Native 3D modeling** | OCCT sketches→extrude (add/cut), axis-angle revolve, loft between profiles (circle→rectangle), sweep along path | Genuine B-rep solid validity, STEP/STL exports, measured dimensions, reproducible invalid-input errors, editable operation history | Planned |
| **A4. Technical drawings** | B-rep top/front/side projection, hidden lines, section planes/isometric sections, associative measurements | A verified solid produces accurate, nonduplicated dimensions and consistent views; updated solid regenerates drawing | Planned; partial nominal orthographic prototype in PR #6 |
| **A5. CAD import and edit** | STEP/STP geometric import first, then STL/3MF mesh editing, controlled SCAD/FCStd adapters | Open a real supplied part, apply reviewed operation, save and independently reimport result; preserve source/provenance | Planned |
| **A6. Dimensioned photo/sketch ingestion** | Number F01…Fnn photos, tag P/D/C/S markers and associate measures to photo and feature; input ruler/two-point calibration; OCR provisional annotations | No ambiguity about which image/element a measurement belongs to; conflicts surfaced; calibration restricted to the correct plane | Design contract documented; implementation pending |
| **A7. Multiview depth and reconstruction** | Camera/view alignment, relative depth/triangulation where possible, dimensional constraints, feature fitting and reprojection | Known 10 mm thickness overrides monocular estimate; uncertainty labeled; underconstrained solids not claimed as exact STEP | Design contract documented; implementation pending |
| **A8. Reverse engineering** | Accurate editable CAD reconstruction from measured original parts/STEP/STL/3MF and drawings, analytic feature fitting and deviation reports | Reconstructed geometry is independently dimension-checked against source and user measurements | Planned; dedicated R0–R5 track |
| **A9. Broader design/assemblies** | Mechanical parts, mates, interferences, parametric linked drawings and sensible AI changes | Interoperable assembly geometry, dependency rebuild and tests | Planned |

Slices can overlap when one **validated Core interface** allows progress in Web/Desktop and a relevant ComfyUI headless adapter, but no UI-only mock shall be represented as a completed CAD feature. Prioritize A0 → A1 → A2/A3 → A4/A5 → A6/A7/A8 (reverse engineering), with validation at each gate rather than shipping many unverified features.

### Reverse engineering — independent core product capability

The reverse-engineering track recreates **editable, dimensionally validated CAD** from existing physical parts, imported STEP/STP B-reps, STL/3MF meshes, DXF plans, scans and photo sets. It is **not synonymous with image-to-mesh**, and it is not optional ComfyUI functionality.

- **R0:** preserve provenance, calibration, units, stable entity references and measured-vs-estimated dimensions in the shared project.
- **R1:** import STEP analytic B-reps, classify faces/holes and reconstruct simple editable features. Verify export and round-trip dimensions.
- **R2:** import STL/3MF, measure/fit planar and cylindrical primitives, report mesh approximation errors and rebuild editable geometry only where supported.
- **R3:** extend to annotated photos, OCR and 3-view DXF drawings; align source data via F01 and P/D/C/S markers, depth constraints and user review.
- **R4:** infer a *proposed* feature tree (extrusion, axis-angle revolution, loft, sweep, cut) with explicit verification and manual editing.
- **R5:** fit inspection, deviations, assemblies and functional redesign.
- Show side-by-side original/reconstruction, actual dimension checks, unknown areas, deviations and source-linked measurement evidence. Never call a reverse engineered part production-ready solely because it looks similar.

See [dedicated reverse-engineering plan](docs/REVERSE_ENGINEERING_PLAN.md).

### Constrained photo measurements: mandatory UX

- Auto-assign immutable image IDs **F01, F02, F03...**, view labels (planta/alzado/perfil/isométrica) and cross-photo feature identities; user can reorder images without breaking references.
- User clicks points `P01`, segments `D01`, circles `C01`, faces/planes `S01`; prompts refer to **image + marker + dimension** (e.g. `F02.D03 = 12 mm`).
- User-supplied confirmed lengths are constraints; OCR readings and depth estimates are **provisional**. Use reference rulers only when their plane and perspective are properly calibrated.
- The reconstruction engine may use **multiview feature matching and camera poses for depth**, or monocular depth for a rough *hypothesis*. None justifies unlabeled micron/millimeter claims without measurements.
- All missing, conflicting or inferred values remain visible; inspect the reconstructed silhouette projected onto each original image before approval.

### Modeling operations: mandatory UX

- Extrude named planar sketches using an explicit direction, signed distance and additive/subtractive mode.
- Revolve a selected profile about **a line defined by a point and axis direction** through an explicit signed angular span (including non-360° rotations).
- Loft between two or more identified profiles/planes, such as **circle→rectangle**, with controlled correspondences and verified solid validity.
- Sweep a profile along a chosen path, controlling orientation/twist when the engine supports it.
- Keep operation order, parameter changes, reference geometry, invalid-operation diagnostics and live preview in the **same saved design**.

### ComfyUI is intentionally small

**Not a third full CAD editor.** Offer only independently useful, **headless, testable** Core actions (e.g. prompt→validated spec→review→STL/STEP, bounded batch variants, an accepted geometry/dimension report). No interactive drawing canvas, arbitrary section gizmos or photo-marker editor as ComfyUI nodes. See [ComfyUI parity policy](docs/COMFYUI_PARITY.md) in the separate PR #5.

### Versioning and current evidence

- **Internal development** `v0.0.1 · DEV` with `CHANGELOG.md` entries under `[Unreleased]`; do not treat PRs or untested source as tagged releases.
- PR #4: stale mesh safeguards. PR #5: brand/version/license/About/prompt guidance/ComfyUI scope. PR #6: three workspace early preview. Each awaits source compilation and Windows interaction tests before merge.
- A future `0.1.0-alpha.1` requires an intentional accepted snapshot with Python, frontend, Tauri and (for declared ComfyUI nodes) runtime workflow evidence. Do not increment versions by calendar date or feature count.
- **Source license:** Apache-2.0 adopted in PR #5 but not yet on `main`; third-party CAD engines and branding have separate terms.

### Immediate verification checklist

1. Run Core Python tests and `npm run build` from the selected integrated branch; resolve broken contracts rather than merge overlapping branches blindly.
2. In Web and Desktop, modify a circular plate hole pattern and a screw drive; verify regeneration, save validity, and clear messages for impossible geometry.
3. Confirm 2D/3D/drawings tabs share dimensions and language and never fabricate unsupported projections.
4. Verify accurate version, official logo, About modal and bilingual prompting guide.
5. Establish versioned shared-document schema and implement a first standalone CAD 2D sketch→OCCT extrusion→dimensioned 2D projection, with real measurements.
6. Then implement photo identifier/marker/calibration MVP and multi-photo depth only after trustworthy feature correspondence exists.

## Mission

OrkiCAD AI is a local-first, multilingual **parametric CAD, 2D/3D, AI and manufacturing ecosystem**. Its interfaces share a Python core:

- **OrkiCAD Studio Desktop:** Tauri 2 / Rust shell sharing Studio Web React UI, with a bundled native OCCT runtime and no ComfyUI dependency.
- **OrkiCAD Studio Web:** required browser client using the same React UI and an authenticated server-side CAD runtime.
- **OrkiCAD ComfyUI:** optional nodes, JSON workflows and reusable parameter editor.
- **OrkiCAD Core:** versioned part schemas, validated geometric generators, exporters, mesh inspection, provider adapters and jobs.
- **Engine adapters:** OpenSCAD/BOSL2 initially; CadQuery/OCCT and FreeCAD for more advanced solid modeling, B-rep and STEP.
- **AI adapters:** local Ollama initially; optional explicit connections to OpenAI, Anthropic Claude and Google Gemini.
- **Multimodal adapters:** OCR, image/PDF-to-vector, photo reconstruction, image-to-3D, texture and asset workflows via ComfyUI.

**Non-negotiable:** AI transforms requests into *structured, validated parametric specifications* and **must not execute arbitrary AI-generated Python, SCAD or shell code**. Both product interfaces consume one shared, versioned catalog of part types and parameter metadata.

## Mandatory three-client parity (2026-11-15)

OrkiCAD is **one product with three synchronized interfaces**: independent **Windows/Linux/macOS desktop**, authenticated **web**, and optional **ComfyUI**. No divergent geometry engines, inconsistent editable project formats, or separate feature roadmaps.

- **Desktop:** one-click installation, a license-reviewed bundled OCCT native runtime and one-click STEP export; no FreeCAD, manual Python paths or ComfyUI prerequisite. Tauri 2 wraps the same React Studio UI as the web edition.
- **Web:** shared Studio editor plus authenticated/sandboxed backend exports. Never expose the unauthenticated localhost development server to the public Internet.
- **ComfyUI:** workflow and node adapters use Core contracts and automatic backend discovery in supported packages; developer overrides do not define the product UX.
- **Acceptance:** every feature tracks Core parity and Web, Desktop and ComfyUI implementation/validation status. Mark missing clients incomplete.

**Progress evidence:** user-confirmed Windows ComfyUI feature-program and visual editor workflows; new Studio Web source includes the same validated feature schema, ordered operation editor and native STEP/3MF endpoints, but requires browser acceptance. Automatic OCCT runtime detection is transitional. Tauri installers and a secure Internet-hosted web edition are not yet delivered. [Architecture decision](docs/adr/0007-three-clients-one-core.md).

## Documentation policy — confirmed 2026-11-15

1. All **technical documentation** in the repository is written and maintained in **English**, including this roadmap, README, architecture, developer/API/testing instructions, changelog and release notes.
2. A **Spanish copy or translated edition** may be evaluated in the future. No second technical documentation track is maintained at present. A future translation must reference the revision of its canonical English source.
3. The product UI remains **multilingual**, initially English and Spanish; selecting a UI language does not switch documentation language or measurement system.

## Engineering and UI requirements

- Switch between **metric (mm)** and **imperial (inches)** independently of UI language; accept decimal values and eventually common fractional-inch input. Store canonical geometry in millimetres; changing display units must not rescale STL or SCAD.
- Treat metric screw designations, UNC/UNF thread families, metric gear module and imperial diametral pitch as distinct design standards, not naive unit conversions.
- Prompt-driven part design must **create the relevant editable form**, e.g., a fitted box lid with width/depth/walls/clearance and a bottle cap with neck dimensions/thread/height/clearance. AI assumptions must be visibly marked.
- Use limits, enums, conditional fields, unit categories, validations and localized labels in the shared catalog. Allow safe addition of part families without hand-authoring another frontend screen.
- A bottle cap's visual resemblance is **not proof of leak tightness or mechanical fit**. Expose guessed geometry, tolerances and measurement uncertainty.
- Offer local Ollama endpoint/model settings, connection tests, opt-in cloud API keys with secure storage, request review and timeout/health reporting. Manual CAD must work without AI.
- Keep the development Python server local-only unless authentication, authorization and network hardening have been completed. Limit rendering resources and isolate engine subprocesses.

## Formats and capability boundaries

| Format | Intended use | Primary engine or pipeline |
| --- | --- | --- |
| SCAD | Parametric source | OpenSCAD |
| STL | 3D printing mesh (OrkiCAD convention: mm) | OpenSCAD, FreeCAD or mesh tools |
| 3MF | Manufacturing model/metadata when supported | Mesh/export pipeline |
| STEP | Editable CAD/B-rep exchange | CadQuery/OCCT, FreeCAD |
| FCStd | Native FreeCAD project | FreeCAD |
| DXF / SVG | Dimensioned 2D profiles/drawings | 2D CAD exporters |
| PDF | Plans and reports | Document/drawing exporter |
| OBJ | Mesh interchange | Mesh pipeline |
| GLB / glTF | Visual and game assets | Visual mesh pipeline |

Format availability is declared per backend. Mesh-to-CAD conversion may lose parametric editability. Reconstruction from photographs is approximate without calibration and measurements.

## Evidence-based starting status

**Verified by maintainer on Windows, 2026-11-15:** Core/BOSL2 generated four sample STLs (washer, screw, nut, gear); preliminary Trimesh checks reported watertight, connected volumes; 10 early Python tests passed; local Python API and React/Vite Studio launched; Studio 3D viewer displayed an M6 screw using a compatible OpenSCAD 2026 release candidate.

**Committed but not yet integration-tested:** Spanish/English UI, metric/imperial conversions, catalog-based dynamic forms, prototype box lid/bottle cap, local Ollama interpreter and provider endpoints. A source commit alone does not prove functionality.

**Not delivered:** native Tauri install, verified ComfyUI plugin/workflow, stable AI settings and secure cloud providers, STEP/B-rep workflow, most visual/2D/printing pipelines and any tagged release.

## Version milestones (proposed, not calendar deadlines)

| Version | Focus | Required proof before release |
| --- | --- | --- |
| `0.0.1` internal | CAD core prototype and web Studio | Partial verification; not a release |
| `0.1.0-alpha.1` | Fix and validate dynamic forms, lid/cap models, local AI and initial ComfyUI bridge | Python tests; frontend build; STL validation; ComfyUI workflow successfully executed |
| `0.1.0-alpha.2` | Studio editing, camera/cotas, settings and project persistence | Unit conversion/round-trip and UI tests |
| `0.2.0` | Installable ComfyUI integration with documented JSON workflows | Tested ComfyUI Desktop import/run/export |
| `0.3.0` | Tauri 2 Windows desktop app | Fresh install and launch without PowerShell servers |
| `0.4.0` | Local + opt-in remote AI providers and configuration | Schema validation, secret storage, explicit cloud consent |
| `0.5.0` | CadQuery/FreeCAD, B-rep STEP, 2D DXF/SVG | Dimensional regression and interoperable export tests |
| `0.6.0` | OCR, sketches/PDF and image-based reconstruction | Reproducible examples, scale review and uncertainty estimates |
| `0.7.0` | Mesh repair, printing prep, splitting and slicer handoff | Sample mesh validation and handoff tests |
| `0.8.0` | Visual assets, GLB/PBR/LOD and automation | Reproducible batch and asset exports |
| `0.9.0-beta` | Security, performance, packaging, compatibility and docs | CI + fresh-install matrix + release candidate acceptance |
| `1.0.0` | First supported stable **core subset** of the product vision | Tagged release, installers, docs, regression tests, limitations |

Version numbers represent **verified milestones**, not daily revisions. Several days of commits belong to the same `[Unreleased]` development cycle. See [versioning](docs/VERSIONING.md).

## Native STEP without mandatory FreeCAD — strategic roadmap

**Product requirement (confirmed 2026-11-15):** OrkiCAD Studio and the ComfyUI integration must **not require end users to install FreeCAD** merely to export native STEP. The present FreeCADCmd adapter is an **optional transitional backend**, not the intended distribution architecture. The final product must use an OrkiCAD-controlled, redistributable native B-rep backend built on OpenCascade Technology (OCCT), with FreeCAD retained only as an optional compatible alternative.

**Cross-platform acceptance requirement (confirmed 2026-11-15):** one common OrkiCAD STEP geometry engine must operate on **Windows, Linux, and macOS**, without OS-specific source forks or mandatory FreeCAD installation. Linux x86-64, macOS x86-64/arm64 and Windows x86-64 are the first targets; Linux ARM64 is an additional supported-package candidate. Device support and package availability do not equal validation. Each platform must pass a native STEP round-trip test and a clean-install smoke test before its installer is called supported. External CAD dependencies, native bindings, runtime diagnostics and installer packaging must be platform-aware without hardcoded OS paths.

**Initial implementation in source (not yet runtime-accepted):** added a separate `cadquery-ocp` worker, a ComfyUI `OrkiCADExportOCCTSTEP` node, an Ollama → reviewed CAD → STL/3MF/OCCT STEP graph, and a Windows/Linux/macOS GitHub Actions test matrix. The worker uses a configurable Python interpreter (venv on Windows: `Scripts/python.exe`; Linux/macOS: `bin/python`). Dependencies are **optional and not yet bundled**. The original FreeCADCmd adapter remains available independently. CI completion status must be verified rather than inferred from the workflow source file.

**Delivery stages, with no committed dates:**

1. **Portable transitional adapter (current prototype):** expose an optional FreeCADCmd path in each workflow and in Studio settings; default to Auto discovery; never hardcode a developer machine path. Allow all non-STEP workflows to run with neither FreeCAD nor OCCT installed. Clearly distinguish available exporters from optional dependencies.
2. **OCCT engine feasibility spike:** choose a maintained binding or native Rust/C++ interop strategy suitable for Windows desktop packaging and a separate ComfyUI worker process; review licensing, dynamic-library redistribution, ABI/toolchain compatibility, install size, cross-platform plans, and secure subprocess isolation.
3. **First native B-rep solids:** reconstruct catalog **washer, mounting plate, open box and fitted box lid** directly as analytic solids (boxes/cylinders, cuts/fusions) from the same validated parameter specifications. No STL triangulation is used as source geometry.
4. **Stand-alone native STEP writer:** serialize STEP from OCCT, add dimensional and topological validation, numerical tolerance checks, volume and bounding-box parity against the existing OpenSCAD/FreeCAD sample outputs. Record interoperability results by importing in at least two independent CAD tools.
5. **Integrate into Studio and ComfyUI:** choose an export backend (`Auto / OrkiCAD OCCT / FreeCAD optional`) and show availability diagnostics. Package the native OCCT runtime with OrkiCAD rather than requiring FreeCAD; include deterministic exports and clear failure handling.
6. **Extend the CAD kernel:** advanced analytic surfaces, fillets/chamfers, standard fasteners, modeled screw threads, gears and compound solids, then IGES/BREP as supported. Treat editable feature-history projects separately from simple STEP B-rep exports.

**Acceptance criteria for FreeCAD-independent STEP:** on a clean supported Windows system without FreeCAD installed, OrkiCAD Studio and a supported ComfyUI workflow can export a valid analytic STEP for the four initial part families, while STL/3MF continue to function; exported STEP round-trips in independent CAD readers with expected units, dimensions, shape validity and solid count; the OCCT runtime is distributed in compliance with its applicable licenses.

**Current status:** Native OCCT STEP without FreeCAD is validated in the maintainer-reported Windows ComfyUI workflow. A path-free installed desktop release, secured hosted web exports, clean-install and independent CAD interoperability remain unverified product delivery gates. See `docs/STATUS.md`.

## Next execution plan (priority ordered)

1. **Stabilize code now:** Windows `git pull`, Python unit tests, `npm run build`, local Studio UI smoke test; verify language and unit switches do not change actual geometry.
2. **Verify new geometries:** check box lid and approximate threaded cap (STL watertightness, dimensions, thread profile, explicit fit limitations). Repair implementation failures.
3. **Complete canonical schemas:** move part definitions and UI fields to versioned typed metadata, bounds, localized labels, standard selection, unit classification and conditional choices.
4. **Complete local AI configuration:** Ollama connection health, model list, selected model and endpoint settings; validated spec proposals and user approval of defaults. Cloud provider keys are a separate secure phase.
5. **Create and verify first ComfyUI custom nodes:** parameters → Core SCAD/STL → mesh inspection → output file; provide JSON workflow, installation instructions and actual ComfyUI Desktop test results.
6. **Publish the first alpha only after proof:** update `CHANGELOG.md`, `docs/STATUS.md`, supported versions and release notes; then tag `v0.1.0-alpha.1`.

## Master capability inventory — 140 targets

**Scope:** These are tracked ambitions of the complete ecosystem. Capabilities requiring extra research may remain experimental or move beyond stable v1.0.0. Verification status lives in `docs/STATUS.md`, not in this wishlist.

### AI-assisted CAD

1. Natural language CAD requests.
2. Multilingual instructions.
3. Automatic part family detection.
4. Dynamic form generation.
5. Extract dimensions and constraints.
6. Ask for missing critical dimensions.
7. Highlight assumed defaults.
8. Conversational editing.
9. Design variants.
10. Parameter explanations.
11. Geometry constraint checks.
12. Local Ollama models.
13. Optional cloud AI.
14. Provider and model selection.
15. Mandatory user review.

### Parametric parts

16. Metric and imperial fasteners.
17. Spur and helical gears.
18. Pulleys shafts and couplings.
19. Mounting brackets.
20. Boxes and enclosures.
21. Box lids and covers.
22. Bottle caps and closures.
23. Internal and external threads.
24. Holes and slots.
25. Spacers and adapters.
26. Hinges and latches.
27. Connectors and joints.
28. Bearing and hardware housings.
29. Reusable part templates.
30. Extensible part families.

### Parametric editing

31. Edit dimensions.
32. Rebuild geometry on change.
33. Metric and imperial inputs.
34. Fractional-inch inputs.
35. Geometry constraints.
36. CAD sketches.
37. Extrusions and revolutions.
38. Boolean operations.
39. Pockets and ribs.
40. Fillets and chamfers.
41. Mirrors and arrays.
42. Multipart designs.
43. Project organization.
44. Saved parameters.
45. Versioned design variations.

### 3D viewer

46. Orbit zoom and pan.
47. Standard camera views.
48. Grids and axes.
49. Dimension overlays.
50. Distance and diameter measures.
51. Wireframe mode.
52. Component coloring.
53. Component visibility.
54. Basic assemblies.
55. Sections and clipping.
56. Model version comparisons.
57. Dimensional comparisons.
58. Geometry inspection.

### 2D CAD and drawings

59. 2D sketches.
60. Lines arcs and circles.
61. 2D dimensional constraints.
62. Orthographic projections.
63. Section drawings.
64. SVG and DXF drawings.
65. PDF technical reports.
66. Vector profile imports.
67. 2D-to-3D extrusion.
68. Drawing templates.

### Photo sketch and PDF reconstruction

69. Object photo input.
70. Hand sketch input.
71. Scanned plan input.
72. PDF extraction.
73. OCR for dimensions.
74. Contour detection.
75. Vectorization.
76. Handwriting recognition.
77. 2D reconstruction.
78. Drawing-to-3D proposals.
79. Multiview input.
80. Reference-based scale.
81. Possible feature detection.
82. Manual correction.

### 3D printing

83. Watertight checks.
84. Component connectivity checks.
85. Volume and dimension checks.
86. Topology inspection.
87. Mesh repair.
88. Wall-thickness analysis.
89. Fit clearances.
90. Split large models.
91. Pins and connectors.
92. FDM and resin preparation.
93. STL and 3MF export.
94. Slicer handoff.
95. Manufacturing reports.
96. Printing presets.

### Game and visualization assets

97. Visual asset meshes.
98. GLB/glTF transfer.
99. Mesh decimation.
100. LOD variants.
101. Textures and materials.
102. PBR maps.
103. Game engine profiles.
104. Visual design variants.

### ComfyUI

105. Installable custom nodes.
106. Text-to-parameter nodes.
107. SCAD generation node.
108. STL generation node.
109. Mesh inspection node.
110. Sketch vectorization workflows.
111. OCR workflows.
112. Image-to-3D integrations.
113. Typed data between nodes.
114. Configurable output paths.
115. End-to-end workflows.
116. Importable JSON examples.
117. Shared Studio part templates.
118. Batch CAD workflows.

### Settings and localization

119. Multilingual interface.
120. Independent language and unit selection.
121. CAD engine configuration.
122. Ollama endpoint setup.
123. AI model selection.
124. Cloud API configuration.
125. Secure API credentials.
126. Cloud consent controls.
127. CAD library paths.
128. Design presets.
129. Job history.
130. Diagnostics.
131. Contextual help.
132. Dependency management.

### Automation and extensibility

133. Integration API.
134. Batch jobs.
135. Parameter sweep.
136. Job queues.
137. Reports.
138. Optional n8n workflows.
139. Plugin interfaces.
140. Dynamic extensible part catalog.

## End-to-end acceptance scenarios

1. **Box lid:** natural-language request with dimensions → editable dynamic field set → validated clearance → CAD solid → inspected STL.
2. **Bottle cap:** measured bottle neck and proposed thread profile → parameters → 3D preview → explicit *unverified fit* warning → prototype print and measurement.
3. **ComfyUI:** import a versioned workflow → create part parameters → render STL using shared Core → validate and save mesh.
4. **Units and language:** switch Spanish/English and mm/in without modifying the canonical CAD dimensions or changing STL scale.
5. **Offline mode:** create and export a part without Ollama or internet; optional local AI can generate a parameter proposal when connected.
6. **2D/3D:** build a dimensioned 2D profile and produce a B-rep solid/STEP when the corresponding engine is ready.
7. **Image/PDF:** extract dimensions and line geometry, review scale and confidence, produce candidate geometry without pretending photographic precision.

## Documentation ownership

- **`ROADMAP.md` (this document):** canonical long-term master plan and feature inventory.
- **`docs/STATUS.md`:** only evidence-based implemented/tested status.
- **`CHANGELOG.md`:** source changes and released features.
- **`docs/WORKFLOW_CATALOG.md`:** planned and verified ComfyUI workflows.
- **`docs/VERSIONING.md`:** release and version discipline.
- Maintain all technical documentation in English; consider a Spanish copy **later**, only if explicitly approved.
