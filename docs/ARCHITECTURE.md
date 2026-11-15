# Architecture — three-client shared-core target

```text
OrkiCAD Studio Desktop (Tauri 2 / Rust / React / TypeScript)
OrkiCAD Studio Web (required React client)
OrkiCAD ComfyUI (optional adapter + JSON workflows)
                    │
             OrkiCAD API/contracts
                    │
         OrkiCAD Core (Python)
         ├── typed part schemas and standards
         ├── parameter validation
         ├── part generators
         ├── geometry and mesh quality checks
         ├── job management + sandboxed exporters
         ├── engine adapters (OpenSCAD/BOSL2; native OCCT; optional FreeCAD)
         └── AI provider adapters (Ollama; OpenAI; Claude; Gemini)
                    │
        CAD assets + engine-specific files
```

## Separations

- **Frontend** configures parts; it does not own geometry logic.
- **Core** has deterministic, testable parameter-to-geometry interfaces.
- **AI** extracts structured intents/parameters. Server-side schema validation occurs before any CAD job.
- **Engines** run in controlled subprocesses with allowlisted binaries, paths and resource limits. Avoid evaluating raw LLM-generated scripts by default.
- **Exports** are capability-based: STEP from solid CAD backends, DXF/SVG from suitable 2D geometry, STL/3MF from mesh-capable backends.
- **ComfyUI** is an adapter; it is not a mandatory runtime for Studio.
- **Remote providers** are optional and require explicit selection and privacy notice.

## Proposed repository boundaries

```text
core/             Python package: geometry, schemas, validators, exports
adapters/         CAD engines and AI providers
shared/           Portable versioned contracts and UI/editor components
comfyui/          Custom nodes + workflow JSON definitions
studio/           Single React/TypeScript UI for Web + Tauri/Rust desktop shell
api/              Optional Python API for Studio Web / remote workers
tests/            Schema, geometry and integration tests
docs/             Architecture, decisions, user/developer guides
.github/          Issue templates and CI
```

Keep interfaces versioned and stable. A backend's unsupported export formats must fail explicitly rather than silently emitting wrong geometry.

## External dependencies and reference models

Maintain a single [catalog of CAD engines, AI models, mesh tools, model licensing and official references](DEPENDENCIES_AND_RESOURCES.md). Provider and CAD engine adapters must declare required versions, installation paths, permitted outputs and test status. Developer-specific paths (e.g. `F:\orkicad-ai`) are not embedded in source code.

## Product-level decision: one app, three presentations

The required interfaces are **Studio Web**, **Studio Desktop on Windows/Linux/macOS** and **OrkiCAD ComfyUI**. Each consumes the same validated `feature_model` and part catalog, uses the same deterministic CAD engine, and must expose compatible STEP, STL and 3MF output capabilities. The desktop application must be independently runnable and its own bundled OCCT runtime must remove manual interpreter paths and any FreeCAD requirement. ComfyUI remains optional.

- **Studio Web** executes exports on an authenticated server-side worker (not a native browser process). The present localhost HTTP server is for development only.
- **Studio Desktop** is the same Studio frontend packaged using Tauri 2, with an application-managed local CAD runtime. No packaged installer is yet available.
- **ComfyUI** adapts Core to node graphs; no dedicated geometry or independent format definitions are allowed.

The existing `feature_viewport.js` is a framework-neutral SVG axonometric **operation schematic**, not a final CAD CSG mesh. The final STL view and the operation selection view have different purposes. The UI should progressively migrate to a reusable package built for all three clients. Full shared UI packaging is **not yet complete**.

The STEP development adapter now auto-discovers project-local `.venv-occt` or future `runtime/occt` folders; this is a developer convenience only and does **not** meet the desktop release requirement of a packaged, license-reviewed OCCT runtime. The optional FreeCAD exporter remains a compatibility adapter, not the primary STEP path.

See [ADR 0007](adr/0007-three-clients-one-core.md) for delivery gates and the requirement that all three interfaces move forward together.
