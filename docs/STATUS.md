# Project status

**As of 2026-11-15 — Foundation / planning; no released application yet.**

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

## Not yet implemented

- Parametric geometry engine, component catalogs and export pipeline.
- ComfyUI custom node package and importable JSON workflows.
- Studio desktop application.
- Provider integrations, automated tests and CI release artifacts.

## Evidence policy

Only mark features as **implemented** after code is committed; mark them **verified** only after automated tests and/or reproducible manual validation. Release notes must disclose limitations.

## Next technical milestone

Build deterministic components (washer, nut, screw, simple spur gear) with typed parameter schemas, one engine adapter, mesh export, validation and tests.
