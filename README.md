<p align="center">
  <img src="logo_OrkiCAD-AI.png" alt="OrkiCAD AI logo" width="420" />
</p>

# OrkiCAD AI

**Open-source multimodal CAD, 2D/3D reconstruction, AI-assisted design and manufacturing ecosystem.**

> **Project status: early source prototype.** A small deterministic CAD generator (washer, mounting plate and open box) is committed. Full parametric catalogs, AI integrations, custom ComfyUI nodes, Studio and production workflows are **not yet implemented or released**.

OrkiCAD AI is designed around **one reusable Python CAD core and two user experiences**:

- **OrkiCAD Studio** — independent desktop app built with **Tauri 2, Rust, React and TypeScript**, with a possible web edition.
- **OrkiCAD ComfyUI** — custom ComfyUI nodes and visual workflows sharing the same backend.

## First runnable source prototype

The initial Python package generates validated OpenSCAD source for **washers, mounting plates with four holes and open-top boxes**. An installed OpenSCAD CLI can convert these templates to STL. It includes JSON examples, basic unit tests and a GitHub Actions test workflow (execution not yet independently verified). See [Getting started](docs/GETTING_STARTED.md).

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

## Multimodal CAD and 3D workflows — extended scope

This is a **CAD-first 2D/3D ecosystem**, not just a parametric part generator. The following capabilities are **planned**:

- **Parametric components**: screws, nuts, washers, gears, pulleys, shafts, housings, enclosures and brackets.
- **Text/chat/LLM → CAD**: structured dimensional specifications into constrained 2D plans or editable 3D parts.
- **2D ↔ 3D**: plans, SVG/DXF or sketches to solids; 3D solids to orthographic views, sections and dimensioned 2D drawings.
- **Image/sketch/PDF → CAD**: OCR and vectorization of linework, callouts and handwritten dimensions, followed by reconstruction.
- **Single/multiple photos → 3D/CAD**: reconstruct objects from one or several angles, with user-specified dimensions in drawings, annotated photographs or chat. Calibration and engineering validation are mandatory for claimed accuracy.
- **3D model and STL splitting**: split along chosen planes, separate components/shells, create printable sections, connectors, locating pins and clearances.
- **3D printing preparation**: inspect/repair meshes, validate scale, thickness and watertightness; export STL/3MF and integrate slicers.
- **Game/design asset preparation**: mesh optimization, UV mapping, PBR textures, LODs and GLB/glTF.
- **Import/export**: SCAD, STEP, STL, 3MF, DXF, SVG, GLB where the backend and geometry representation permit.

Two planned interfaces share a core: **OrkiCAD Studio** (Tauri 2 + Rust + React/TypeScript) and **OrkiCAD ComfyUI** (custom nodes/workflows). AI providers: local **Ollama** and optional **OpenAI, Anthropic Claude, Google Gemini** APIs.

Read the [complete vision](docs/VISION_AND_WORKFLOWS.md), [workflow catalog](docs/WORKFLOW_CATALOG.md), [reconstruction requirements](docs/RECONSTRUCTION.md), [3D printing and assets](docs/3D_PRINTING_AND_ASSETS.md) and [mesh splitting](docs/MESH_SPLITTING.md).

## External resources and local development

The maintainer's Windows working directory is **`F:\orkicad-ai`**. All application paths must remain configurable rather than hardcoded. See [local development instructions](docs/LOCAL_DEVELOPMENT.md).

See the [CAD, AI and 3D resources catalog](docs/DEPENDENCIES_AND_RESOURCES.md) for official source links, purposes, proposed integration roles and licensing/compatibility checks. Also see [third-party notices](THIRD_PARTY_NOTICES.md). External model weights and CAD applications are **not** included in this repository.

## Brand asset

The official [OrkiCAD AI logo](logo_OrkiCAD-AI.png) is stored in the repository root and displayed above. See [branding documentation](docs/BRANDING.md).
