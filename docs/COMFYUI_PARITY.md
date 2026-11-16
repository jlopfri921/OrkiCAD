# OrkiCAD AI — Minimal ComfyUI integration policy

**2026-11-16. Decision:** ComfyUI is an **optional automation adapter**, not a clone of Web or Desktop. It shall expose only concrete, composable, deterministic capabilities of the shared OrkiCAD Core. Feature parity is **not** a goal when a feature is primarily graphical/interactive.

## Gate: a new node is accepted only if all conditions hold

1. The underlying Core feature already runs without a graphical UI and has an explicit input/output contract (versioned JSON or a supported file).
2. It is usefully **composable** with other ComfyUI nodes: it accepts and/or produces native strings, file paths, supported mesh/3D outputs or well-defined metadata; no nested CAD desktop interaction needed.
3. Inputs are allowlisted and validated; errors tell the user exactly which parameter is invalid. AI proposals must require deliberate review where export or modifications matter.
4. The job is deterministic for identical parameters, except deliberately stochastic AI interpretation, and can run in a standard ComfyUI queue with bounded time/resources.
5. File paths are restricted to ComfyUI-managed import/output locations. Models and proprietary data are not uploaded without explicit approval.
6. Tests verify Core semantics, a ComfyUI node registration/import smoke test, valid output contents and target ComfyUI Desktop workflow execution.
7. New nodes reuse the shared Python package instead of duplicating geometry, import, or section algorithms.

## Current node inventory — source available, runtime verification varies

| Source node | ComfyUI value | Current status |
|---|---|---|
| `OrkiCADPartSpec` | Select a registered part + JSON dimension overrides | Source implemented; ComfyUI acceptance required |
| `OrkiCADGenerateSCAD` | Validated spec → OpenSCAD text | Source implemented; runtime depends on Core |
| `OrkiCADRenderSTL` | Validated spec → STL file and preview path | Source implemented; requires OpenSCAD and appropriate BOSL2 |
| `OrkiCADExportMesh` | Validated spec → 3MF/OBJ/OFF/AMF/STL | Source implemented; format/engine support must be verified |
| `OrkiCADExportOCCTSTEP` | Supported analytic part → native STEP file | Source implemented; requires compatible OCCT/OCP runtime and supported part family |
| `OrkiCADInterpretLocal` | Ollama prompt → proposed spec | Source implemented; depends on local installed model |
| `OrkiCADReviewSpec` | Human review/edit + approval before export | Source implemented; source semantics to be verified in runtime |
| `OrkiCADSavedDesign` | Stored JSON design + overrides → new spec | Source implemented; no CAD editor embedded |
| `OrkiCADExportSTEP` (legacy FreeCAD adapter) | STEP through optional FreeCADCmd | Existing source, optional compatibility path; **do not promote** as default |

**Do not confuse source presence with verified runtime support.** Actual ComfyUI release capability is restricted to the subset that passes end-to-end tests with its dependencies and target ComfyUI Desktop version.

## Good ComfyUI workflows to support

- **Text → CAD:** local Ollama prompt → typed, validated CAD parameters → review gate → STL or STEP export for supported families.
- **Parametric variations:** generate a family of parameterized shapes → export per design → hand over paths to downstream preview, render or print-preparation nodes.
- **Batch validation/export:** same single Core validation engine, a finite list of explicit designs, standardized file outputs and readable failures.
- **CAD to image/video workflows:** use exported supported geometry/meshes as input to rendering/visual ComfyUI nodes, without implying that ComfyUI is an interactive geometric editor.

## Keep in Web/Desktop, NOT ComfyUI nodes by default

- Live selection of B-rep faces and edges, drag-to-edit constraints, and complex on-canvas 2D sketching.
- Dynamic orthographic drafting layout, manual dimension placement, A0–A4 title blocks, text annotations, section-plane gizmos and interactive isometric cutaways.
- 3D assembly manipulation, interactive constraints and CAM-like shop-floor editor controls.
- General STEP/FCStd/SCAD import-and-edit promises until the shared Core has a robust, secure headless import/operation pipeline.
- Generic “AI CAD node” that claims support for unknown/unsupported geometry and silently fabricates invalid results.

Once Core supports **headless** validated section/profile extraction, a *single* finite node (e.g., solid → one selected plane section profile as DXF/SVG and metadata) could be considered. Do not port the entire Planimetry UI into a ComfyUI graph.

## Development workflow alongside Studio

1. Develop and test each CAD capability **once** in Core.
2. Deliver its interactive editing and inspection experience in Web/Desktop.
3. Independently assess whether a small ComfyUI node adds real pipeline value.
4. If yes, implement an adapter, schema/version check, workflow fixture and runtime acceptance. If not, document **Studio only**.
5. Update `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, and the acceptance evidence matrix when shipping.

The minimal set of **well-tested** nodes is more valuable than dozens of fragile or overlapping nodes.


## Studio-only accounts and AI preferences boundary (2026-11-16)

- Collapsible AI settings, saved provider/model preferences, authenticated users, account
  isolation, local application databases, secure credential vaults and usage billing
  **belong only to OrkiCAD AI Studio Web/Desktop**.
- The current per-browser/WebView preference store is **not an authenticated
  per-user profile** and must never contain API keys.
- **ComfyUI must not import or depend on Studio user accounts, SQLite/Postgres
  profile databases, localStorage or private account credentials.** Users select
  relevant node input/model connections inside ComfyUI workflows only as that
  host supports, without duplicating the Studio settings UI.
- Multiuser account design and acceptance are tracked in
  [issue #12](https://github.com/jlopfri921/orkicad-ai/issues/12).
