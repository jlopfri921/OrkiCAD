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
