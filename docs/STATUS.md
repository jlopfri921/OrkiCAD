# Project status

**As of 2026-11-15 — Initial source prototype committed; no packaged application or tagged release yet.**

## Confirmed decisions

- Project name: **OrkiCAD AI**.
- Single repository with shared **Python CAD core**.
- Desktop UI: **Tauri 2 + Rust + React/TypeScript**.
- Separate ComfyUI extension, reusing core services.
- Optional web experience through a Python HTTP API.
- CAD backends: OpenSCAD/BOSL2 and CadQuery/FreeCAD, introduced incrementally.
- AI adapter architecture: Ollama, OpenAI, Anthropic Claude and Google Gemini.

## Implemented

- Initial repository documentation and development plan.
- Python CAD source generator for washer, 4-hole mounting plate and open-top box (millimetres, validated parameters).
- JSON examples, CLI, unit test suite and GitHub Actions workflow (CI results not yet independently verified).
- Optional external OpenSCAD CLI export to STL; requires compatible local OpenSCAD installation.

## Not yet implemented

- Full engineering-grade parametric geometry engine, standards-based fasteners/gears and complete export pipeline.
- ComfyUI custom node package and importable JSON workflows.
- Studio desktop application.
- Provider integrations, automated tests and CI release artifacts.

## Evidence policy

Only mark features as **implemented** after code is committed; mark them **verified** only after automated tests and/or reproducible manual validation. Release notes must disclose limitations.

## Next technical milestone

Build deterministic components (washer, nut, screw, simple spur gear) with typed parameter schemas, one engine adapter, mesh export, validation and tests.

## Multimodal CAD scope agreed 2026-11-15

The project must extend beyond parameterized screws, nuts and gears to: bidirectional 2D/3D CAD; natural-language drawings/parts; sketch/photo/PDF digitization; OCR of handwritten and printed dimensions; single/multi-angle photographic reconstruction with calibration and text-defined measurements; SVG/DXF technical drawing export; STL/mesh splitting, joinery and print preparation; game/design meshes and PBR/UV/LOD assets. Optional AI providers include Ollama, OpenAI, Anthropic Claude and Google Gemini. All are **planned**, not yet verified implementations.

## Windows verification update (2026-11-15)

- Maintainer successfully installed `orkicad-core 0.0.1` in a dedicated virtual environment.
- The sample washer `.scad` file was generated successfully from JSON using the CLI.
- Initial Windows unit tests: 4 passed, 1 failed because the test incorrectly treated a valid shallow open box as invalid. The test fixture was corrected and a valid shallow-box regression case was added in commit `57b7e75`.
- **Pending confirmation:** rerun all 6 unit tests on the Windows machine; test OpenSCAD CLI export to STL and inspect generated geometry.
- This is not yet an end-to-end CAD/mesh validation or a stable release.

## Mechanical CAD source milestone (2026-11-15)

- Committed a BOSL2-based generator for M3–M12 metric screws and nuts, plus an involute spur gear source generator.
- Added sample M6 × 30 screw, M6 nut and 24-tooth module-2 gear JSON definitions.
- Added parameter-validation/unit-test source and a CLI option `--bosl2-dir` for OpenSCAD include paths.
- [BOSL2 setup and testing instructions](BOSL2_SETUP.md) published.
- **Not yet verified:** rendering these new components into STL on the maintainer's Windows workstation, dimensional quality, thread mating, and the new test-suite pass rate. No production readiness claimed.

## Windows integration verification — 2026-11-15

Maintainer-reported results from Windows PowerShell in `F:\orkicad-ai-github`:

- `git pull --ff-only origin main` succeeded.
- `python -m unittest discover -s tests -v`: **10 tests run, OK**.
- BOSL2 cloned at `F:\orkicad-deps\BOSL2`.
- Three SCAD files generated successfully: `screw_M6x30.scad`, `nut_M6.scad`, `gear_24T.scad`.
- **`screw_M6x30.stl` successfully reported generated** by OpenSCAD CLI via `--bosl2-dir`.

**Still pending:** render/export nut and spur gear STL, independent mesh inspection (manifoldness, nonempty mesh, bounding dimensions), thread assembly clearance and print test. These are maintainer-provided logs, not independent geometric validation or a tagged release.

## Four STL export milestone — maintainer Windows validation (2026-11-15)

Maintainer-provided PowerShell output confirms all four prototype STL files were generated using OrkiCAD Core + OpenSCAD/BOSL2:

| File | Size (bytes) | Status |
| --- | ---: | --- |
| `gear_24T.stl` | 469961 | OpenSCAD CLI reports created |
| `nut_M6.stl` | 132183 | OpenSCAD CLI reports created |
| `screw_M6x30.stl` | 563850 | OpenSCAD CLI reports created |
| `washer.stl` | 172947 | Present in output directory |

Previous maintainer test run: 10/10 Python unit tests passed. These outputs are **not yet validated** for watertightness, dimensions, normals, manifoldness, printed fit or standards compliance. Next milestone: inspect and report actual mesh topology and bounding boxes with a local geometry validator, then make any needed corrections and document test environment versions.

## Preliminary Trimesh gear inspection (2026-11-15)

Maintainer ran Trimesh 5.2.1 / NumPy 2.2.6 on Windows. The generated `gear_24T.stl` loaded with 2,752 triangles, `is_watertight=True`, volume 13,836.84 mm³, bounding-box extents [51.98, 51.98, 8.00] mm. For an unshifted standard module-2, 24-tooth spur gear, theoretical outside diameter is 52 mm; this matches the observed bounding-box diameter within mesh tessellation.

The inspection script then failed at `mesh.split(only_watertight=False)` with `ImportError: no graph engines available!` because no Trimesh connectivity graph backend was installed. Remaining STL files were **not inspected** by that run; next step: install `networkx` into the OrkiCAD virtual environment and rerun. The current watertight result does not establish full topology, tooth-profile accuracy, printing quality or mating fit.

## Mesh topology verification — Windows 2026-11-15

Maintainer-provided Trimesh results:

| File | Faces | Watertight | Volume mm³ | Extents XYZ (mm) | Components | is_volume |
| --- | ---: | --- | ---: | --- | ---: | --- |
| gear_24T.stl | 2752 | True | 13836.84 | 51.98 × 51.98 × 8 | 1 | True |
| nut_M6.stl | 672 | True | 308.35 | 10 × 11.55 × 5.2 | 1 | True |
| screw_M6x30.stl | 2948 | True | 1009.37 | 10 × 10 × 36 | 1 | True |
| washer.stl | 1024 | True | 442.39 | 18 × 18 × 2 | 1 | True |

All four samples passed these preliminary topological checks. Mechanical tolerances, thread fit, tooth-profile accuracy and physical print tests remain unverified.

## New features committed (awaiting independent execution)

- Added reusable Python mesh inspector and JSON report, using optional Trimesh + NetworkX (see [Mesh validation](MESH_VALIDATION.md)).
- Added first React/TypeScript Studio frontend with six parametric part forms, SCAD source generation and file download.
- Added localhost-only Python JSON-to-SCAD endpoint. The backend does not execute arbitrary scripts or read user paths.
- Added server smoke tests and mesh inspector unit/integration tests.
- Studio is **not** yet a Tauri/Rust desktop application, and the frontend/backend integration is **not yet verified** on Windows. See [Studio prototype](STUDIO_PROTOTYPE.md).

## Studio 3D viewport verified by maintainer — Windows (2026-11-15)

The maintainer confirms that OrkiCAD Studio starts successfully using the local Python backend, React/Vite frontend, BOSL2 and an OpenSCAD 2026 release candidate installed under `F:\OpenSCAD-2026`. The prior GUI crashes in OpenSCAD 2021.01 no longer occur with the newer release candidate. The maintainer explicitly confirmed that the M6 screw renders and is visible in the built-in Studio 3D viewport following the STL generation workflow.

**Verified by maintainer:** local backend/frontend connectivity and viewing the generated screw geometry inside Studio.
**Not independently confirmed:** downloaded STL via Studio, automated view updating, all six part types in the viewer, release build, native Tauri packaging, and manufacturing fit/accuracy.

Next suggested step: improve the 3D viewport with camera controls, dimensional overlays and parameter-change handling, then pursue native desktop packaging.

## Multilingual Studio foundation (2026-11-15)

- Added an internationalization catalog and a visible selector for Spanish/English to the React Studio prototype.
- Translated primary UI labels, component names, parameter labels, 3D viewer empty state and frontend error messages.
- Automatic Spanish detection based on browser locale, otherwise English. CAD data contracts remain unchanged.
- **Pending local verification:** TypeScript production build and actual language switching in the browser after git pull. Backend errors and enum values have not yet been fully localized.
- See [I18N.md](I18N.md).

## Metric / Imperial Studio parameter inputs (2026-11-15)

- Committed an independent **Metric (mm) / Imperial (in)** units selector alongside the language selector.
- Linear dimensional inputs display/accept inches in imperial mode; conversions take place exclusively at the frontend boundary. All backend JSON dimensions remain canonical millimetres.
- Changing display units does not mutate a generated part or its stored dimensions. Editing a parameter invalidates outdated SCAD/STL previews to avoid mismatched downloads.
- Metric screw nominal designation and gear module remain metric standard values; angles and counts are unchanged.
- **Pending maintainer verification:** run `npm run build` and confirm unit switch and STL dimensions remain unchanged for a sample washer.

## First ComfyUI node integration — source committed (2026-11-15)

- Added `comfyui/orkicad_nodes/__init__.py` with native `OrkiCADPartSpec`, `OrkiCADGenerateSCAD`, `OrkiCADRenderSTL` and `OrkiCADInterpretLocal` nodes.
- Added `comfyui/workflows/orkicad_parametric_stl.json` and `tests/test_catalog_and_comfyui.py`.
- Added English integration guide in [COMFYUI_INTEGRATION.md](COMFYUI_INTEGRATION.md).
- **Unverified:** local Python tests after commit, actual ComfyUI Desktop node discovery and workflow import/run, new box lid/cap mesh quality, Studio production build and Ollama inference. No prerelease is tagged.
- **Next verification:** run the test suite and actual ComfyUI workflow, then inspect the generated lid STL. Keep the project internal version at `0.0.1` until evidence supports the proposed `0.1.0-alpha.1`.

## Maintainer Windows test results — 2026-11-15, 18:17 local

The maintainer pulled the latest ComfyUI source integration through commit `d5b114f` and ran `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -v`: **28 tests ran, all OK** (1.085 seconds). The suite includes shared catalog validation, closure source checks, ComfyUI node registration, workflow JSON structure, original CAD generators and development API smoke tests. A deliberately missing STL file prints an expected diagnostic but its unit test passed.

The maintainer also ran `npm run build` in `studio/frontend`: TypeScript compilation succeeded and Vite 5.4.21 successfully generated a production build (36 modules, 1.52 seconds). Rollup reported one approximately 650 kB JavaScript bundle above its 500 kB advisory chunk threshold; this is a **performance warning**, not a build failure.

The earlier `npm install` audit reported **two dependency vulnerabilities (one moderate, one high)**. Investigate with `npm audit`; avoid blindly running `npm audit fix --force` without assessing major-version or API changes.

**Still not verified:** loading nodes inside ComfyUI Desktop, importing/running the supplied workflow, rendering the newly added lid/cap via OpenSCAD, working Ollama inference and Studio interaction tests for units/languages. No official alpha release yet.

## ComfyUI Desktop first end-to-end STL output — maintainer confirmation (2026-11-15)

The maintainer installed the OrkiCAD custom nodes in ComfyUI Desktop on Windows and confirmed that all four nodes appear in the node search. The provided parametric box-lid workflow runs and **does create an STL file in the ComfyUI output directory**, despite having no in-UI mesh preview or visibly reported output file at this stage. This is the first maintainer-confirmed ComfyUI-to-OrkiCAD-Core-to-STL workflow result.

**Remaining validation:** independently inspect the produced box-lid STL dimensions, manifoldness, component count and printing fit. The ComfyUI UI currently lacks an embedded 3D preview and an explicit saved-file notification. The optional local AI node has not yet been executed end-to-end. Native application release and official alpha tag remain pending.

## External STL viewer smoke test — maintainer report (2026-11-15)

The maintainer reports that the box-lid STL produced by the OrkiCAD ComfyUI workflow **opens and displays correctly in SolidCraft**, an external 3D viewer. This is an additional visual compatibility check, not yet a quantitative mesh inspection or a verification of printing tolerances/physical fit.

## Local Ollama → ComfyUI → STL workflow source (2026-11-15)

- Added `comfyui/workflows/orkicad_ollama_text_to_stl.json`: `OrkiCADInterpretLocal` feeds the existing `OrkiCADGenerateSCAD` and `OrkiCADRenderSTL` nodes.
- Added structural workflow and bad-prompt regression tests, and extended the English ComfyUI guide with Ollama preflight and known limitations.
- The sample `qwen3-coder:30b` model name is provisional and must be verified with `ollama list` on the maintainer machine.
- **Not yet runtime-verified:** Ollama output compatibility, actual AI-generated STL, the revised unit-test suite and dimensional validation. The prototype currently passes AI-generated parameters directly to export without a separate approval gate; production flows will require parameter review.

## Ollama AI node timeout diagnostic / fix (2026-11-15)

The maintainer's ComfyUI `OrkiCADInterpretLocal` run failed with `AIError: Local Ollama unavailable: timed out`. This is an AI-provider response timeout (previously fixed at 75 seconds), **not evidence of an OpenSCAD/STL failure**. An unverified source patch increases the default request deadline to 180 seconds (configurable via `ORKICAD_OLLAMA_TIMEOUT`, range 5–600) and gives targeted timeout, HTTP and connection messages. Offline tests were added for timeout and configuration validation. Check actual `ollama list`, `ollama ps`, loopback service status and local model warm-up before re-running the workflow. **The end-to-end AI workflow has not yet passed.**

## Local Ollama → ComfyUI workflow maintainer retest (2026-11-15)

After the Ollama timeout handling update, the maintainer reports **"ya funciona"** (now works) for the previously failing ComfyUI local-AI workflow. This is a user-reported end-to-end runtime success following the timeout fix. Exact model, output STL path, dimensions, mesh quality, and whether each stage was individually inspected were not supplied; these remain open verification tasks. The native ComfyUI preview, parameter-review gate, and first official alpha release remain pending.

## Experimental ComfyUI interactive STL preview and manual AI review (2026-11-15)

The maintainer requested an in-ComfyUI 3D viewer. Added a `preview_path` output (relative to ComfyUI output) alongside the existing absolute `stl_path` on `OrkiCADRenderSTL`; introduced the `OrkiCADReviewSpec` approval node with strict validated overrides and opt-in default; added `comfyui/workflows/orkicad_ollama_review_preview_stl.json` connecting AI → review → STL → built-in `Preview3D`. Added offline workflow/review tests and documentation. The upstream `Preview3D` String input is available on supported ComfyUI builds but deprecated in newer upstream builds; **viewer behavior, exact file resolution, and the updated tests remain unverified on the maintainer's ComfyUI Desktop installation**. This is experimental and not a release tag.

## Maintainer confirmation: AI approval workflow and native 3D preview (2026-11-15)

The maintainer reran `comfyui/workflows/orkicad_ollama_review_preview_stl.json` after setting `approve_for_export = true` in `OrkiCADReviewSpec` and reports **"ahora, sí"** in response to whether the STL appears in ComfyUI's 3D viewer. This confirms, by maintainer report, that the integrated Ollama → manual parameter approval → STL → native ComfyUI preview flow displays the model in their Desktop installation. Initial manual-approval refusal was expected behavior. Further work: editable parameter controls, quantitative mesh quality/dimensional checks, clearer approval UX, and an official alpha release. No automated or independent validation of the latest build is claimed.

## Catalog-driven ComfyUI visual editor code committed — pending Desktop test (2026-11-15)

Implemented an experimental bilingual DOM form embedded in `OrkiCADReviewSpec` using `WEB_DIRECTORY` and ComfyUI JavaScript extension hooks. The form obtains schema metadata via `GET /orkicad/catalog`, displays per-part numeric/categorical fields, toggles mm/in units without changing canonical geometry, saves changes to `overrides_json`, and resets manual approval when parameters change. `OrkiCADInterpretLocal` now emits `ui.proposed_spec` to populate the review node on AI execution while retaining the original STRING result. Added offline tests for the UI payload and extension assets and updated the English integration guide. **The revised code, frontend extension loading, and tests have not yet been run on the maintainer's Windows installation.** The approval gate continues to throw on unapproved execution, and model-specific approval is not yet cryptographically bound on the backend.

## Visual parameter editor validated in ComfyUI Desktop — maintainer confirmation (2026-11-15)

The maintainer reports **"funciona"** after installing and trying the new catalog-driven visual editor in the ComfyUI `OrkiCADReviewSpec` node. This confirms user-visible functionality in their installation, following the previous successful Ollama → review → STL → Preview3D workflow. Exact edited fields, unit-switch behavior, per-field validation, and regression test outputs have not been supplied, so detailed edge-case acceptance remains pending. This is a prototype milestone, not an alpha release.

## Decoupled parametric redesign without Ollama — source ready, pending Desktop retest (2026-11-15)

Added a self-contained `OrkiCADSavedDesign` node that builds a validated part spec from local `base_spec_json` and editable `overrides_json`, with no AI provider call. Added `comfyui/workflows/orkicad_saved_design_preview_stl.json` linking SavedDesign → RenderSTL → Preview3D. Extended the existing bilingual ComfyUI frontend editor to support saved designs and added a button in AI review to copy the current proposal plus overrides to clipboard for transfer into the independent workflow. Added no-Ollama, rejected-field and offline-workflow regression tests. **These changes are committed but have not yet been run on the maintainer's Windows ComfyUI instance or tested in a JS runtime.** Editing updates the next queued STL; it is not yet continuous live geometry preview. No new release tag.

## Export formats beyond STL — mesh-format support committed (2026-11-15)

Added an allowlisted `render_mesh` Core API and `OrkiCADExportMesh` ComfyUI node to export OpenSCAD-supported **3MF, OBJ, OFF, AMF, STL** formats, retaining the existing STL interface. Added the standalone workflow `comfyui/workflows/orkicad_saved_design_preview_export_3mf.json` with simultaneous STL preview and 3MF export. Added tests validating the format boundary and workflow graph, and an English explanation of why true STEP/IGES/BREP needs a separate native FreeCAD/OpenCascade B-rep backend. **No STEP exporter exists yet**; mesh-to-STEP faceting is intentionally not represented as precise CAD. Updated code not yet run on maintainer's Desktop or real OpenSCAD 2026 for 3MF output; no release tag.
