# Architecture (proposed)

```text
OrkiCAD Studio Desktop (Tauri 2 / Rust / React / TypeScript)
OrkiCAD Studio Web (optional React client)
OrkiCAD ComfyUI (custom Python nodes + JSON workflows)
                    │
             OrkiCAD API/contracts
                    │
         OrkiCAD Core (Python)
         ├── typed part schemas and standards
         ├── parameter validation
         ├── part generators
         ├── geometry and mesh quality checks
         ├── job management + sandboxed exporters
         ├── engine adapters (OpenSCAD/BOSL2; CadQuery; FreeCAD)
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
comfyui/          Custom nodes + workflow JSON definitions
studio/           Tauri/Rust shell and React/TypeScript frontend
api/              Optional Python API for Studio Web / remote workers
tests/            Schema, geometry and integration tests
docs/             Architecture, decisions, user/developer guides
.github/          Issue templates and CI
```

Keep interfaces versioned and stable. A backend's unsupported export formats must fail explicitly rather than silently emitting wrong geometry.
