<p align="center">
  <img src="logo_OrkiCAD-AI.png" alt="OrkiCAD AI logo" width="420" />
</p>

# OrkiCAD AI

**Open-source multimodal CAD, 2D/3D reconstruction, AI-assisted design and manufacturing ecosystem.**

> **Project status: active source prototype, no stable installers or hosted release.** Windows ComfyUI Desktop workflows for local Ollama, validated parametric features and STL/3MF/native OCCT STEP exports have been reported working by the maintainer. Studio Web source now has part/feature editing and STL/3MF/STEP routes, but its current update needs a new browser test. Independently installable Tauri apps and a secure hosted web service are **not yet shipped**.

OrkiCAD AI is designed around **one reusable Python CAD core and two user experiences**:

- **OrkiCAD Studio Web + Desktop** — required browser edition and independently installable Tauri 2 / Rust desktop edition sharing the same React/TypeScript UI and Core contracts.
- **OrkiCAD ComfyUI** — optional custom nodes and visual workflows sharing the same backend.

## Three clients, one CAD product

The same validated part designs and ordered `feature_model` operations must work in **OrkiCAD Studio Web**, **OrkiCAD Studio Desktop** (Windows/Linux/macOS) and the optional **ComfyUI** extension. A feature is not considered fully delivered until relevant client support and tests are in place.

**User experience target:** one-click native STEP, STL and 3MF export using a product-managed CAD engine, without installing FreeCAD or entering Python/interpreter paths. In the development source tree, OCCT can be discovered automatically when installed into a project-local virtual environment; production installer bundling is still pending. Web exports run on a secured CAD backend, not natively inside the browser. See [ADR 0007](docs/adr/0007-three-clients-one-core.md), [architecture](docs/ARCHITECTURE.md) and [status](docs/STATUS.md).

## First runnable source prototype

The initial Python package generates validated OpenSCAD source for **washers, mounting plates with four holes, open-top boxes, metric screws/nuts and spur gears**. An installed OpenSCAD CLI can convert these templates to STL; screws, nuts and gears additionally require **BOSL2**. It includes JSON examples, basic unit tests and a GitHub Actions test workflow (execution not yet independently verified). See [Getting started](docs/GETTING_STARTED.md) and [BOSL2 setup](docs/BOSL2_SETUP.md).

## Planned capabilities

- Parametric screws, nuts, washers, gears, pulleys, brackets and enclosures.
- Precise CAD through **native OpenCascade (OCCT)** B-rep exports and **OpenSCAD/BOSL2** meshes; FreeCAD support is optional and never required for STEP.
- Text-to-parameters with **Ollama (local)** and optional **OpenAI**, **Anthropic Claude**, and **Google Gemini** adapters.
- OCR, technical drawing vectorization and image-to-3D through ComfyUI integrations.
- Engine-dependent exports: **SCAD, STL, 3MF, STEP, DXF, SVG, GLB**.
- Validation, reproducible builds, dimensional tests and manufacturing-oriented checks.

**Important:** generated meshes are not automatically accurate engineering solids. Fabrication-critical dimensions, clearances, threads and tolerances require validation.

## License and third-party software

The original OrkiCAD AI source code is licensed under the **Apache License, Version 2.0** (SPDX `Apache-2.0`). See [LICENSE](LICENSE) and [NOTICE](NOTICE). This permits use, modification and redistribution under the license conditions, including commercial use; it does not grant rights to use the official OrkiCAD AI branding for unrelated products.

The official project name and logo are governed separately; see [branding rules](docs/BRANDING.md). Third-party engines, packages, ComfyUI, AI models and optional native libraries keep their **own licenses and model terms**; see [third-party notices](THIRD_PARTY_NOTICES.md). This source license does **not** certify a distributable executable or bundled dependencies.

**ComfyUI integration policy:** only tested, headless, composable Core operations should become nodes. Graph automation is optional and does not replicate the CAD 2D/3D/Drawing UI. See [ComfyUI parity policy](docs/COMFYUI_PARITY.md).

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

## Mesh inspection and early Studio preview

- **Mesh inspector:** basic watertightness, connected-component count, volume and bounding-box checks, with a JSON report; requires the optional Python `mesh` extra. [Mesh validation guide](docs/MESH_VALIDATION.md).
- **Studio Web + Desktop developer prototype:** one shared React/TypeScript interface with a modern responsive three-panel CAD workspace, local AI and optional cloud models, parametric operation editor, real STL 3D viewport and SCAD/STL/3MF/native OCCT STEP exports. A Tauri 2 desktop developer shell now starts its local Core worker automatically. **No independently installable production Desktop package or secured hosted Web edition is released.** [Web instructions](docs/STUDIO_PROTOTYPE.md) · [Desktop developer setup and limits](docs/STUDIO_DESKTOP.md).
- Windows validation of the initial STL samples is logged in [project status](docs/STATUS.md); the new inspector and Studio frontend still need local execution testing.

## Languages

OrkiCAD Studio is designed as a multilingual application. The initial React prototype has **Español** and **English** UI translations and a language selector; additional languages are planned. CAD parameter keys remain language-neutral. See [internationalization requirements](docs/I18N.md). This feature still requires validation in the maintainer's local build.

## Measurement units

OrkiCAD Studio now offers **Metric (mm)** and **Imperial (inches)** display/input for linear dimensions, independently of its Spanish/English interface selection. The core and exported files remain in millimetres; changing display units alone does not rescale the model. Standard metric thread identifiers and metric gear module are not converted into imperial standards. [Requirements and limitations](docs/REQUIREMENTS.md).
