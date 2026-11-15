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
