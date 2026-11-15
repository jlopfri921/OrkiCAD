# OrkiCAD AI

**Open-source AI-assisted parametric CAD ecosystem.**

> **Project status: planning / foundation.** This repository currently documents the project; CAD generators, custom ComfyUI nodes and production workflows are **not yet implemented**.

OrkiCAD AI is designed around **one reusable Python CAD core and two user experiences**:

- **OrkiCAD Studio** — independent desktop app built with **Tauri 2, Rust, React and TypeScript**, with a possible web edition.
- **OrkiCAD ComfyUI** — custom ComfyUI nodes and visual workflows sharing the same backend.

## Planned capabilities

- Parametric screws, nuts, washers, gears, pulleys, brackets and enclosures.
- Precise CAD via **OpenSCAD/BOSL2**, **CadQuery** and **FreeCAD** adapters.
- Text-to-parameters with **Ollama (local)** and optional **OpenAI**, **Anthropic Claude**, and **Google Gemini** adapters.
- OCR, technical drawing vectorization and image-to-3D through ComfyUI integrations.
- Engine-dependent exports: **SCAD, STL, 3MF, STEP, DXF, SVG, GLB**.
- Validation, reproducible builds, dimensional tests and manufacturing-oriented checks.

**Important:** generated meshes are not automatically accurate engineering solids. Fabrication-critical dimensions, clearances, threads and tolerances require validation.

## Documentation

- [Project status](docs/STATUS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Requirements and scope](docs/REQUIREMENTS.md)
- [AI providers and security](docs/AI_PROVIDERS.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Versioning and releases](docs/VERSIONING.md)
- [Architecture decisions](docs/adr/README.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Guiding principles

1. **Engine-first:** deterministic parameters and geometry; AI assists interpretation but does not replace CAD validation.
2. **Provider-neutral:** local-first; external API use is opt-in and replaceable.
3. **One core:** Studio and ComfyUI consume the same typed contracts.
4. **Safe by default:** no arbitrary untrusted code execution, no API keys in source control.
5. **Transparent progress:** documentation distinguishes proposals, prototypes, verified capabilities and releases.

## Get involved

See [ROADMAP.md](ROADMAP.md) and [CONTRIBUTING.md](CONTRIBUTING.md). This is an early-stage project; contributions and design discussion are welcome.
