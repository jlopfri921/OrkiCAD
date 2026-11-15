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

## AI-to-3MF in one ComfyUI graph (2026-11-15)

The maintainer confirms that the existing non-AI multi-format exporter generated a 3MF correctly. Following the request that 3MF also be integrated **with Ollama in the same workflow**, added `comfyui/workflows/orkicad_ollama_review_preview_stl_3mf.json`: Ollama → visual approval → parallel STL/Preview3D and direct OpenSCAD 3MF generation. Both branches use a single validated and approved specification. Added a topology regression test. **Awaiting maintainer's real combined-workflow acceptance test.** This does not yet constitute STEP B-rep support.

## Native STEP B-rep prototype source — pending FreeCAD acceptance (2026-11-15)

Added an independent, subprocess-isolated `FreeCADCmd` exporter (`core/orkicad_core/step_export.py` and `freecad_worker.py`) that constructs **analytic B-rep** solids directly for `washer`, `mounting_plate`, `open_box`, and `box_lid`, without tessellated STL-to-STEP conversion. A new `OrkiCADExportSTEP` ComfyUI output node and `comfyui/workflows/orkicad_ollama_review_preview_stl_3mf_step.json` connect the original AI-reviewed specification to STL/Preview3D, 3MF and STEP in parallel. Added offline regression checks for wiring, unsupported parts and absent FreeCAD. **Not yet verified**: local FreeCAD installation, real FreeCADCmd execution on Windows, generated STEP validity/dimensional parity, new tests; no alpha release. Other part types remain STL/3MF-only pending native FreeCAD implementations.

## Maintainer STEP execution error and runtime paths (2026-11-15)

ComfyUI 0.45.4 on Windows successfully loaded the OrkiCAD node set and executed the AI-reviewed multi-export graph, but `OrkiCADExportSTEP` failed with `STEPExportError: FreeCADCmd was not found`. This is a missing/unconfigured external FreeCAD binary, **not a failure of the STL/3MF backend**. The log confirms ComfyUI Desktop uses Python `D:\\Comfy-Desktop\\ComfyUI-Installs\\ComfyUI\\ComfyUI\\.venv\\Scripts\\python.exe` and a **shared output directory** `D:\\Comfy-Desktop\\ComfyUI-Shared\\output`, with OrkiCAD outputs beneath `output\\orkicad`. The earlier review-node approval error in the same logs was expected when approval was false. Next action: locate an existing `FreeCADCmd.exe` / install FreeCAD if absent, set `ORKICAD_FREECAD_CMD` to its actual absolute path, fully restart Desktop, and validate native STEP export. The FreeCAD worker/CLI Windows compatibility remains unverified.

## Portable FreeCAD path and longer-term integrated STEP engine (2026-11-15)

Users correctly identified that distributing a workflow must not hardcode the maintainer's FreeCAD installation path. Added `freecad_path` as an optional user-editable string in `OrkiCADExportSTEP` (default `Auto`), with Core resolution favoring explicit setting, then environment variable, PATH, then common Windows installation directories; the example STEP workflow now includes this optional field. Added offline resolver/interface regression tests. **Not yet tested on Windows Desktop.** The planned long-term OrkiCAD native STEP architecture should package an OCCT-based B-rep backend so full FreeCAD need not be installed; this package-independent backend does not exist yet. The FreeCADCmd adapter remains optional for STEP.

## Cross-platform FreeCAD-independent native STEP prototype — source ready (2026-11-15)

Added `core/orkicad_core/occt_step.py` and `occt_worker.py` for OCCT/OCP analytic STEP output with no FreeCAD dependency, using a separate configurable Python runtime. Four prototype part families are supported: washer, mounting plate, open box and fitted box lid. Added `OrkiCADExportOCCTSTEP` in ComfyUI, the AI → reviewed parameters → STL/3MF/OCCT STEP combined workflow, optional-runtime safety tests, actual B-rep round-trip tests and GitHub Actions jobs for Windows, Linux and macOS on Python 3.11 and 3.13.

**Verified in a separate development container:** `OCP` loads, the required `BRepPrimAPI_MakeBox` and `Interface_Static.SetCVal_s` methods exist, and a sample box's OCCT `STEPControl_Writer` produced a Part 21 STEP file successfully reimported with `STEPControl_Reader`. **Not yet verified:** execution of the OrkiCAD worker for all catalog families, GitHub Actions matrix results, production ComfyUI Desktop integration, cross-platform installers, FreeCAD interoperability and CAD precision parity. The OCCT virtual environment is provisioned separately by the user in this prototype; final packaging remains a roadmap requirement. No new release tag.

## Maintainer acceptance: integrated Ollama → STL/3MF/OCCT STEP on Windows (2026-11-15)

**User-confirmed working:** The maintainer imported and ran the new dedicated `OrkiCAD_AI_OCCT_STL_3MF_STEP_Prueba.json` workflow in ComfyUI Desktop and explicitly reported **"funciona"**. The test graph uses local Ollama, the OrkiCAD manual-review node, an STL/Preview3D branch, a 3MF branch, and the FreeCAD-independent `OrkiCADExportOCCTSTEP` node with a separately configured local `.venv-occt` interpreter. This constitutes **reported Windows end-to-end acceptance of the integrated workflow**. The standalone test JSON was delivered as a conversation artifact; the equivalent repository workflow is `comfyui/workflows/orkicad_ollama_review_preview_stl_3mf_occt_step.json`.

**Not inferred from this report:** a separate inspection of STEP files in another CAD application, measured dimensional/volume parity, validation of all four supported part families, passing results for CI on Linux/macOS, clean-machine packaging, or production readiness. A future acceptance pass must explicitly check each of these. No release is tagged on the basis of this single workflow test.

## Feature-composition prototype: machined block with holes and pocket (2026-11-15)

**Source committed, pending maintainer runtime acceptance.** Added `machined_block` to the shared allowlisted CAD catalog with dimensions for a base extruded block, two vertical through-holes and a centered blind rectangular pocket. Core SCAD construction and OCCT native B-rep STEP use corresponding primitive/boolean operations; the optional FreeCAD STEP backend supports the same family. Added geometric constraints to disallow invalid pockets, overlapping drills or holes outside the solid, plus offline geometry regression tests and a native OCCT STEP round-trip test case.

New end-to-end example: `comfyui/workflows/orkicad_ai_machined_block_stl_3mf_occt_step.json` uses Ollama → visual parameter review/approval → STL/Preview3D, 3MF and OCCT STEP. **User has not yet tested this particular template.** Fillets, chamfers, arbitrary sketch feature trees and generalized CAD operations remain future work.

## Maintainer confirms machined-block AI workflow works on Windows (2026-11-15)

**User-confirmed:** After pulling the implementation and running the new machined-block workflow (`comfyui/workflows/orkicad_ai_machined_block_stl_3mf_occt_step.json`), the maintainer reported **"funciona"**. The workflow combines an Ollama proposal, a reviewed parametric machined block with a centered blind pocket and two through holes, and branches to STL/3MF and OCCT-native STEP. This confirms basic end-to-end operation of the new composition example in the maintainer's Windows ComfyUI Desktop environment. **Not yet independently verified:** exact dimensions and tolerance parity across formats, CAD validity checks in an independent STEP reader, all possible parameter combinations, or other OS installations. Future general feature-tree editing, fillets, and chamfers remain open work.

## Corner finishing operations: rounded/chamfered plate prototype (2026-11-15)

**Committed, pending maintainer acceptance.** Added the shared `corner_plate` template (90 × 55 × 6 mm default) with two holes and mutually exclusive rounded vertical corners or vertical-edge chamfers (`corner_style=round|chamfer`, `corner_size=5`). The catalog enforces enum validation and geometry safety. OpenSCAD forms a 2D rounded/chamfered profile and extrudes it for STL/3MF; the OCCT STEP worker applies analytic B-rep fillet/chamfer operations to four vertical edges and drills cylindrical through-holes. The optional FreeCAD adapter was extended, but its specific new geometry path is unverified.

**Experiment performed in a separate isolated OCCT Python environment:** both `BRepFilletAPI_MakeFillet` and `BRepFilletAPI_MakeChamfer` accepted four deduplicated vertical box edges, built valid analytic solids, and retained shape validity after drilling two through holes. These isolated API-level tests do not validate the full ComfyUI workflow or provide measured agreement with OpenSCAD meshes. Added static schema/SCAD and workflow regression checks, STEP round-trip and comparative-volume tests, and `comfyui/workflows/orkicad_ai_corner_plate_stl_3mf_occt_step.json`. **Maintainer end-to-end testing pending; no new release tag.**

## Maintainer acceptance: rounded and chamfered CAD plate workflow (2026-11-15)

**User-confirmed working:** Following the new `corner_plate` implementation and example `comfyui/workflows/orkicad_ai_corner_plate_stl_3mf_occt_step.json`, the maintainer reported **"funciona"**. The example exercises the Ollama → manual parameter review → STL/3MF/OCCT STEP workflow for a CAD plate with selectable rounded or chamfered vertical corners and mounting holes. This is a successful Windows ComfyUI Desktop acceptance report for the new edge-treatment capability.

**Evidence boundary:** The report does not separately establish which `corner_style` variants were run or independently validate CAD surface radii, precise geometric parity across exporters, exhaustive parameter ranges, or Linux/macOS runtime compatibility. Those remain explicit test goals. No official release is tagged.

## First generic ordered CAD feature program (2026-11-15) — source implemented, Windows workflow pending

Added `core/orkicad_core/feature_program.py`: a bounded and strictly validated `feature_model` consisting of a base box followed by up to eight ordered add/cut operations using box or vertical-cylinder primitives. This is the first CAD model not tied to a fixed one-off part-family operation topology. The shared part catalog, AI JSON examples, OpenSCAD generator, OCCT analytic B-rep worker, visual ComfyUI review editor (JSON textarea for operation list), and `comfyui/workflows/orkicad_ai_feature_program_stl_3mf_occt_step.json` have been updated. Existing STL, 3MF and OCCT STEP output nodes reuse their current validation and exporters; the optional FreeCAD adapter intentionally does not support this feature-program family.

**Evidence:** An isolated OCCT execution of the four example booleans (cut rectangular pocket, cut two cylindrical through holes, fuse connected cylindrical boss) returned `IsDone=True`, valid B-rep analysis and exactly one solid at each step. Unit safety tests and OCCT round-trip tests for `feature_model` were added, and the multi-OS CI source was extended. **Not yet verified:** executing the new workflow in the maintainer's ComfyUI, real Ollama feature-program JSON response, STLs/3MFs via local OpenSCAD, passed repository test suite, CI status or independent STEP reader parity. No new release tag.

## Maintainer acceptance: declarative feature-model workflow on Windows (2026-11-15)

**User-confirmed working:** After installing and running `comfyui/workflows/orkicad_ai_feature_program_stl_3mf_occt_step.json`, the maintainer reported **"funciona"**. This is a successful real-world Windows ComfyUI Desktop acceptance report for the prototype ordered CAD feature grammar: local Ollama proposes a validated `feature_model` with a base block and sequential additive/subtractive box and cylindrical operations; manual review precedes STL/3MF and analytic OCCT STEP export.

**Evidence boundary:** This report confirms basic workflow operation, not exhaustive feature combinations, independent geometric tolerance/STEP dimensional parity, complex topology handling, UI usability across all settings, or CI/installer acceptance on Linux/macOS. These remain future validation requirements. No release tag has been created.

## Visual CAD operation history editor — source committed, UI acceptance pending (2026-11-15)

Extended the existing catalog-driven ComfyUI editor's `feature_operations` rendering with numbered **visual operation cards**. Each card can switch between add/cut, choose box/cylinder, edit typed dimensions and XYZ position, move up/down in the ordered Boolean history, or be deleted. Users can append operations up to the Core's existing eight-feature limit. An optional collapsed JSON editor remains for advanced work. All modifications use the existing `overrides_json` state and clear AI export approval. Nested feature coordinates remain canonical millimetres even if the outer editor displays inches. Backend validation and the STEP solid-integrity checks remain authoritative.

Added `comfyui/workflows/orkicad_visual_feature_editor_stl_3mf_occt_step.json`, an **AI-free** saved-design example using the same editor and simultaneous STL/3MF/OCCT STEP branches. The previously working Ollama-driven example is unchanged. Added source-level regression assertions for the UI controls, invalid geometry rejection and graph wiring; updated the integration documentation.

**Verification boundary:** the implementation is committed, but the maintainer has not yet exercised visual add/delete/reorder/modify interactions or the new AI-free workflow in real ComfyUI Desktop. Python tests, browser compatibility, independent STEP parity and cross-platform UI compatibility remain to be validated. No release tag.

## Maintainer acceptance: visual feature history editor in ComfyUI Desktop (2026-11-15)

**User-confirmed working:** Following the release of visual operation cards and the AI-free `comfyui/workflows/orkicad_visual_feature_editor_stl_3mf_occt_step.json` workflow, the maintainer reported **"funciona"**. This confirms a successful basic Windows ComfyUI Desktop trial of visual feature editing on the parametric model, with the existing STL/3MF/OCCT STEP export pipeline.

**Evidence boundary:** The short success report does not independently confirm that every available add/remove/reorder/shape-switch control was tested, nor establish exact dimensional parity, exhaustive feature history correctness, Linux/macOS compatibility, or passing CI. Those remain separate acceptance criteria. The visual feature history is a sequential Boolean operations list rather than a full constraint-based CAD feature tree. No release tag.

## Three-client architecture alignment and Studio parity increment (2026-11-15)

**Architecture accepted:** Web + independently installable Windows/Linux/macOS Desktop + optional ComfyUI are three interfaces of **one OrkiCAD product**. They must share Core schemas, geometry generation, validation and STL/3MF/native OCCT STEP export. The release UX must not require manually entering a Python path or installing FreeCAD/ComfyUI. See `docs/adr/0007-three-clients-one-core.md`.

**Source changes (not yet accepted in Studio runtime):**
- Added a framework-neutral axonometric operation schematic `comfyui/orkicad_nodes/web/feature_viewport.js` and wired selectable operation outlines to existing ComfyUI operation cards. It is an approximate primitives visualization, *not* the final computed CAD solid. This code currently runs only in the ComfyUI frontend; extraction into a shared UI package and Studio integration remain tasks.
- Extended `studio/frontend/src/main.tsx` with the shared `feature_model` catalog family and typed React `FeatureOperationsEditor.tsx` for ordered add/cut operations. Added end-user 3MF and OCCT STEP export buttons with no interpreter path inputs and ES/EN labels.
- Extended the localhost development Studio API with `POST /api/3mf` and `POST /api/step`, both validating through the same OrkiCAD Core schemas. Added mocked binary-route regression tests; these tests do not prove real export backend availability.
- Extended OCCT runtime resolution to automatically inspect project-local `.venv-occt` and prospective application `runtime/occt` directories before falling back to the running Python, with a source-level regression test. This does not create a bundled installer.
- Added Studio React build and Python web API smoke-test steps to GitHub Actions and updated architecture/roadmap.

**Outstanding acceptance:** Studio frontend TypeScript build and browser test, full STL/3MF/STEP export on the local web prototype, selection interaction inside ComfyUI, native desktop app packaging with bundled OCCT/OpenSCAD runtime, secured hosted web backend, production artifact downloads, and three-client cross-platform parity. The remote repository commits are not evidence of passing CI. No installer or hosted web deployment is claimed.

## Shared visual CAD schematic now wired to Studio Web and ComfyUI (2026-11-15)

The operation-selection schematic was extracted into canonical `shared/ui/feature_viewport.js`; identical generated copies live inside `comfyui/orkicad_nodes/web/` and `studio/frontend/src/`. They are kept in sync with `python scripts/sync_shared_ui.py` and enforced using `--check`, `tests/test_shared_ui.py`, and a CI job. The standalone module requires only browser DOM/SVG APIs and can be consumed by Studio Web, the future Tauri-based Studio Desktop and ComfyUI.

New `studio/frontend/src/FeatureSchematic.tsx` wraps the shared viewer; `FeatureOperationsEditor.tsx` synchronizes the selected operation with the numbered editor cards and base dimensions. ComfyUI still has its own node-specific editor chrome, but shares the **exact schematic source**. The preview shows *primitive wireframes*, not a Boolean-evaluated final solid, which remains visible in the STL mesh viewer.

**Evidence boundary:** parity tests have been added to CI source, but the updated Studio build, live browser selection, ComfyUI schematic selection and installer runtime are **not yet user accepted**. Canonical React UI sharing with Tauri is specified but no desktop distributable has been created.

## Studio text-to-CAD UX and provider parity (2026-11-15)

In response to maintainer feedback, updated Studio Web / future Desktop React UI with an **actual readable text prompt area**, three Spanish/English editable sample prompts, one-click load/copy actions, an explicit AI proposal approval gate before export, **Ollama installed-model discovery** via loopback `/api/tags`, a model dropdown and optional manual model ID entry. Studio no longer assumes a single configured local model.

Added opt-in OpenAI Responses, Anthropic Messages and Google Gemini generateContent adapters at fixed HTTPS endpoints. Cloud API keys are entered into the UI for a **single request** and cleared afterward; they are not saved to CAD projects, browser storage or database. The backend validates provider/model/key bounds, prevents redirects from forwarding credentials, normalizes model output through the same English technical JSON schema system instruction used by Ollama, and rejects any geometry outside the catalog Core schema. Spanish prompts are accepted verbatim and are not required to be manually translated. The development server routes `/api/interpret` by provider and exposes `/api/ollama/models` for local model selection.

Added mocked cloud-response validity, credential handling, Spanish prompts and server route tests to source and CI. The credentials approach is **localhost development-only** and not suitable for a hosted/public version until authentication, encrypted per-user secrets and request hardening exist.

**Verification boundary:** commits exist, but frontend TypeScript build status, browser use/copy and selection interactions, installed-model listing on the maintainer's Ollama runtime, and live cloud vendor API behavior remain unverified. No user-provided API keys have been requested or retained by OrkiCAD in this development iteration.

## Modern shared Web/Desktop UI + first Tauri 2 Rust desktop launcher (2026-11-15)

**Committed implementation:** Replaced the old two-column Studio form with a responsive, dark, professional CAD workspace across **one React frontend** for both Studio Web and a future Tauri Desktop installer: compact app/project header, native prompt+provider sidebar (Spanish/English, Ollama model discovery, optional OpenAI/Claude/Gemini API credentials, copyable examples), dominant WebGL STL stage with a transparent canvas and grid, render/export actions, collapsible OpenSCAD source, and parametric inspector/ordered-operation cards. Styled for desktop and small screens, with keyboard focus indicators and reduced-motion support. No duplicate Web vs Desktop UI source.

Added Tauri 2 developer scaffold at `studio/frontend/src-tauri/` and `studio/frontend/src/api.ts` bridge: React uses normal same-origin `/api` on Web and a restricted Rust IPC command on Desktop. Rust starts the existing Python CAD Core in a project virtualenv in developer mode, selects an ephemeral private loopback port with a random token, performs health checks, proxies allowlisted API calls (including binary STL/3MF/STEP), and terminates the worker on application exit. Python Studio server now supports private `ORKICAD_STUDIO_PORT` and `ORKICAD_STUDIO_TOKEN`; legacy localhost Web development works without the token. No proxy is allowed in Rust loopback transports. Added `tests/test_studio_desktop_auth.py` to CI source.

**Desktop release gate:** Production bundling is explicitly **disabled** in Tauri config. The compiled app runtime has **not yet been packaged** with OpenSCAD, OCCT, licenses and Python Core. The source development scaffold needs Rust/Node and an existing local OrkiCAD Python venv; it is not a standalone Windows/Linux/macOS installer. A clean release must require **no** system FreeCAD, ComfyUI, externally configured Python, manually entered CAD executable paths, or preinstalled OpenSCAD. Internet-facing Web requires authentication and hardening; the existing localhost Python server is not an Internet service.

**Acceptance not yet claimed:** Tauri Rust compile, React TypeScript build, launching `tauri dev` on maintainer PC, UI visual review, working API bridge and automated worker shutdown, real cross-format desktop imports, source regression suite after this increment, and independent clean installations on Windows, Linux and macOS. Repository commits are not test execution evidence. Details: `docs/STUDIO_DESKTOP.md`.

## Windows Tauri boot and Ollama model-list repair (2026-11-15)

Maintainer Windows `npm run tauri:dev` log showed Vite started at port 5173, but Rust's first compile failed inside `tauri-build` because **`src-tauri/icons/icon.ico` was missing**. While Rust compiled, visiting the Vite browser page resulted in `ECONNREFUSED 127.0.0.1:8765` for `/api/catalog`, `/api/providers` and `/api/ollama/models`: the browser proxy expects a separate web development API, while the Tauri app uses its own private ephemeral worker and IPC. This does not establish that Ollama itself lacks models.

Committed fixes:
- `studio/frontend/src-tauri/build.rs` now produces a deterministic valid 32×32 development ICO using only the Rust standard library **before** `tauri_build::build()`, so a fresh Windows checkout no longer requires a manually supplied icon. Production will use the approved project branding instead.
- `studio/frontend/src-tauri/src/lib.rs` bypasses external HTTP proxy settings for private loopback worker requests/health checks.
- `studio/frontend/src/main.tsx` adds an **Actualizar lista / Refresh list** button to retry Ollama discovery after the backend becomes available, automatically choosing an installed model when a list is returned; clear diagnostics distinguish unavailable CAD/Ollama services from an actually empty model catalog.
- Source contract checks updated for Windows icon generation and retry availability.

**Not yet accepted:** fresh Windows Tauri build past `tauri-build`, private worker start, live `/api/ollama/models` and actual dropdown population, full desktop model interpretation. The prior log shows an error in Tauri build, not a completed app launch. For Web preview in a browser, `npm run dev` alone is insufficient: start the Python Studio server on 127.0.0.1:8765 as well. For Tauri Desktop, `npm run tauri:dev` must finish Rust build and open the native window; only then does its private worker initialize.
