<p align="center">
  <picture>\n    <source media="(prefers-color-scheme: dark)" srcset="assets/branding/orkicad-logo-dark.svg">\n    <img src="assets/branding/orkicad-logo-light.svg" alt="OrkiCAD — Design. Refine. Make." width="570">\n  </picture>
</p>

<p align="center"><strong>Design. Refine. Make.</strong><br>Open-source parametric CAD, powered by AI.</p>

<p align="center">
  <a href="ROADMAP.md"><img alt="Internal prototype 0.0.1" src="https://img.shields.io/badge/version-0.0.1%20prototype-087F91"></a>
  <a href="LICENSE"><img alt="Apache 2.0" src="https://img.shields.io/badge/license-Apache--2.0-315DB3"></a>
  <img alt="Windows developer testing; Linux and macOS targets" src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-293C60">
  <a href="https://ko-fi.com/jorgelf"><img alt="Support OrkiCAD on Ko-fi" src="https://img.shields.io/badge/Ko--fi-Support%20OrkiCAD-FF5E5B?logo=kofi&logoColor=white"></a>
</p>

<p align="center">
  <a href="#what-is-orkicad">Overview</a> ·
  <a href="#current-project-status">Current status</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#studio-and-workflows">Studio</a> ·
  <a href="#version-history-and-roadmap">Versions</a> ·
  <a href="#documentation">Docs</a> ·
  <a href="#contributing-and-support">Community</a> ·
  <a href="#license-and-credits">Credits</a>
</p>

# OrkiCAD

**OrkiCAD** is an independent, open-source, local-first CAD studio for parametric mechanical parts, assisted 2D/3D design and fabrication workflows. It is maintained by [jlopfri921](https://github.com/jlopfri921).

The vision is a **simple interface with a powerful engineering core**: describe what you want, review the parameters, generate a real model, edit it and export it to supported tools. Manual design remains available without AI.

> [!IMPORTANT]
> **Prototype, not a production release.** The current internal source version is `0.0.1`; no tagged stable release, production-ready Desktop installer or secured public hosted Web edition has been verified. Some Windows and ComfyUI workflows have been confirmed by the maintainer, but this is not a blanket claim of feature or platform support. [Current evidence](docs/STATUS.md) · [Technical roadmap](ROADMAP.md).

## What is OrkiCAD?

OrkiCAD combines four ideas in one product:

- **Parametric CAD:** measured, editable geometric specifications and deterministic generation rather than an opaque image-to-mesh result.
- **AI assistance:** local Ollama and optional cloud services interpret descriptions into reviewable parameters. An AI suggestion is never a substitute for geometric validation.
- **Multimodal workflows:** the longer-term plan includes sketches, photos, PDFs, orthographic drawings, reconstruction and 3D-printing preparation.
- **Open collaboration:** libraries of components, engines, integrations, tests, translations and accessible UX contributed by a community.

### Product principles

| Principle | What it means |
| --- | --- |
| **Local-first** | Keep manual CAD and local workflows usable without an external service |
| **One Core** | Shared geometry and project contracts across Web, Desktop and ComfyUI |
| **Honest CAD** | Show dimensions, assumptions, uncertainties, errors and format limits |
| **Provider-neutral** | Any remote API is optional, replaceable and requires user authorization |
| **Engineering-oriented** | Verify topology and dimensional accuracy before manufacturing |
| **Open source** | Apache 2.0 source with third-party notices kept separately |

## Current project status

This table distinguishes **working source**, **maintainer-verified tests**, **planned functions** and **released software**.

| Area | Evidence from the project | What is still pending |
| --- | --- | --- |
| **Core & templates** | Python CAD Core and parameter validation; washers, plates, boxes, screws/nuts, spur gears and experimental feature operations | Full standards compliance and broader part catalog |
| **Rendering & STL** | Selected Windows OpenSCAD/BOSL2 outputs and initial mesh topology checks were maintainer-tested | Manufacturing fit, repeated geometric regression and wider compatibility |
| **STEP / 3MF** | Prototype export paths and maintainer-reported Windows OCCT/ComfyUI STEP workflow | Production runtime bundling, independent STEP round trips and installer testing |
| **Studio Web** | React/TypeScript source, STL viewport, parameter and feature editing, exports | Current full browser acceptance, authentication and hosted hardening |
| **Studio Desktop** | Tauri 2 development shell sharing the frontend | Independently installable, tested production packages |
| **ComfyUI** | Optional nodes and example workflows; selected Windows execution confirmed | Full extension compatibility and distribution testing |
| **AI providers** | Local Ollama workflows tested in selected contexts; cloud adapter architecture | Uniform stable integrations, consent and error handling |
| **Language & units** | Spanish/English UI source and mm/in display options | Complete interaction and geometry round-trip acceptance |

**Release policy:** code committed ≠ integration tested ≠ published release. Read the [maintainer evidence log](docs/STATUS.md) before assuming a feature is ready.

## Studio and workflows

### The intended OrkiCAD workspace

1. **Home:** start from a prompt, import a part or choose a parametric template; browse recent projects.
2. **Editor:** main 3D viewport, optional AI chat, inspectable parameter panel and ordered operation history.
3. **Review:** verify units, assumptions, topology, dimensions, cuts and manufacturing constraints.
4. **Export:** show only formats and capabilities supported by the chosen backend.
5. **Reuse:** save design specifications, revise dimensions and create variants.

A minimal, responsive interface with simple and professional modes is **planned**. It should not be interpreted as a completed redesign.

### Starter parametric designs

The early Core supports or prototypes **washers, mounting plates, open-top boxes, metric screws and nuts, spur gears** and other experimental features. Availability varies by backend: BOSL2 is required for some OpenSCAD models.

The [larger target catalog](ROADMAP.md) includes plates and flanges, gears, shafts, bushings, supports, profiles, enclosures, printing components and pipes/connectors.

### CAD + AI flow

```text
Prompt / parameters / drawing
             ↓
  AI interpretation (optional)
             ↓
  Review and validate part specification
             ↓
  OrkiCAD Core and CAD backend
             ↓
  3D preview → inspect → export
```

A mesh can be watertight yet mechanically incorrect. Tolerances, threads, gear profiles, fit and safety-critical dimensions **must** be verified independently.

### Studio clients

| Client | Role | Current delivery |
| --- | --- | --- |
| **Studio Web** | Browser-based CAD workspace on a controlled backend | Local development prototype |
| **Studio Desktop** | Tauri 2/Rust application sharing the same React interface | Developer shell; installer pending |
| **ComfyUI extension** | Optional nodes and workflows reusing the CAD core | Early integration tested on selected Windows flows |

See [three-client architecture](docs/adr/0007-three-clients-one-core.md), [Studio Web](docs/STUDIO_PROTOTYPE.md), [Studio Desktop](docs/STUDIO_DESKTOP.md), and [ComfyUI](docs/COMFYUI_INTEGRATION.md).

## CAD engines, AI and extensions

| Integration | Purpose | Availability / requirement |
| --- | --- | --- |
| **OpenSCAD + BOSL2** | Parametric generation and meshes | Developer dependency for relevant designs |
| **OpenCascade (OCCT)** | Analytic B-rep and STEP | Prototype; packaged runtime pending |
| **FreeCAD / CadQuery** | Compatible auxiliary CAD paths | Optional, not mandatory in the planned end-user app |
| **Ollama** | Local AI interpretation | Requires separately installed/running model |
| **OpenAI / Claude / Gemini** | Optional external inference | Provider-specific configuration and terms |
| **GrandpaCAD API** | Optional third-party text/image-to-CAD generation | **Proposed only:** commercial access, terms, endpoints and costs must be confirmed |

OrkiCAD must not silently upload designs to a cloud provider or execute arbitrary AI-generated Python, shell or SCAD scripts. Remote providers should be isolated behind replaceable adapters. See [AI provider strategy](docs/AI_PROVIDERS.md) and [security policy](SECURITY.md).

## File formats

| Format | Intended workflow | Important limitation |
| --- | --- | --- |
| **SCAD** | Parametric source | Needs a compatible OpenSCAD workflow |
| **STL, 3MF** | Mesh exchange and printing | Validate geometry and scale |
| **STEP** | Analytic solid/B-rep exchange | Export support depends on OCCT backend |
| **DXF, SVG, PDF** | Drawings and 2D profiles | Backend-dependent or planned |
| **FCStd** | FreeCAD-native projects | Optional integration |
| **OBJ, GLB/glTF** | Visual/asset meshes | Planned or adapter-specific |

**STEP does not automatically retain an editable parametric feature tree**; converting STL to STEP does not recover original design intent.

## Quick start

These instructions run the **early Python source prototype**, not a production installer.

### Windows (PowerShell)

```powershell
git clone https://github.com/jlopfri921/OrkiCAD.git
cd OrkiCAD
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\washer.json -o outputs\washer.scad
```

To produce an STL, install a compatible OpenSCAD CLI and follow [Getting started](docs/GETTING_STARTED.md). Screws, nuts and gears require [BOSL2 setup](docs/BOSL2_SETUP.md). The UI has separate development instructions for [Studio Web](docs/STUDIO_PROTOTYPE.md) and [Tauri Desktop](docs/STUDIO_DESKTOP.md).

> [!CAUTION]
> The development HTTP API is localhost-only. Do not expose it publicly without authentication, authorization and resource limits. Back up files before experiments with formats or geometry.

### Screenshots and previews

The README now uses the **OrkiCAD SVG wordmark**, with light/dark variants, and Studio uses the new SVG favicon. The older `logo_OrkiCAD-AI.png` remains archived for compatibility. Tauri raster/ICO/ICNS application icons and a verified screenshot of the redesigned Studio still require separate packaging and UI acceptance.

## Version history and roadmap

Like OrkiLab, OrkiCAD separates an **internal development version**, **candidate milestones** and **published releases**. The following are *planned stages*, not historical releases or promises of dates.

| Version | Phase | Main goal | Status |
| --- | --- | --- | --- |
| **0.0.1** | Foundation | Python Core, early Studio and ComfyUI experiments | Internal prototype; no official release |
| **0.1.0-alpha.1** | Stabilization | Test schemas, forms, local AI and initial workflows | Proposed prerelease; acceptance pending |
| **0.1.x–0.2.x** | Studio experience | Projects, parametric editing, dimensions, simpler UX | Planned |
| **0.3.x** | Distribution and providers | Tauri Windows developer-to-installer path; evaluate optional GrandpaCAD adapter | Planned; external API terms unconfirmed |
| **0.4.x** | Multi-provider AI | Consented cloud/local settings, secrets and structured output | Planned |
| **0.5.x** | Engineering CAD | More B-rep operations, STEP interoperability and drawing formats | Planned |
| **0.6.x** | Reconstruction | Photo/sketch/PDF import, vectorization and calibrated scale review | Planned |
| **0.7.x** | Fabrication | Mesh repair, splitting, printing preparation and validation | Planned |
| **0.8.x** | Assets & automation | Batch tasks, suitable 3D visual assets and extension parity | Planned |
| **0.9.0-beta** | Release preparation | Security, accessibility, compatibility and documentation | Planned |
| **1.0.0** | Stable supported subset | Verified releases, installers and clear limits | Planned |

The comprehensive [master roadmap](ROADMAP.md) remains authoritative for technical scope and evidence gates; [Changelog](CHANGELOG.md) and [Versioning](docs/VERSIONING.md) describe actual development history.

### Next development priorities

1. Validate the current Studio browser experience and geometry/export regressions.
2. Create the **OrkiCAD design system** and minimal home/editor experience.
3. Stabilize local projects, parameters, operation selection and live preview.
4. Prototype a replaceable GrandpaCAD provider with **mock responses** before requesting commercial credentials.
5. Package and test real desktop installs; validate accurate STEP exchange.

## Documentation

| Guide | Content |
| --- | --- |
| [Getting started](docs/GETTING_STARTED.md) | Developer setup and first sample |
| [Project status](docs/STATUS.md) | Evidence, successful tests and remaining limitations |
| [Master roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md) | Future work and development records |
| [Architecture](docs/ARCHITECTURE.md) · [Requirements](docs/REQUIREMENTS.md) | Core structure and contracts |
| [Studio Web](docs/STUDIO_PROTOTYPE.md) · [Desktop](docs/STUDIO_DESKTOP.md) | Development interface and desktop shell |
| [ComfyUI integration](docs/COMFYUI_INTEGRATION.md) | Workflow setup and optional nodes |
| [AI providers](docs/AI_PROVIDERS.md) · [Security](SECURITY.md) | Local/cloud policy and safeguards |
| [Workflow catalog](docs/WORKFLOW_CATALOG.md) · [Vision](docs/VISION_AND_WORKFLOWS.md) | Product use cases |
| [Branding](docs/BRANDING.md) · [Languages](docs/I18N.md) | Brand identity and localization |
| [Third-party notices](THIRD_PARTY_NOTICES.md) | Attribution and licensing of dependencies |

## Contributing and support

OrkiCAD welcomes bug reports, improvements to CAD generators, tests, parameter libraries, translations, accessibility, documentation and adapter prototypes. See [Contributing](CONTRIBUTING.md) and report vulnerabilities through [Security](SECURITY.md).

<p align="center"><a href="https://ko-fi.com/jorgelf"><img alt="Support OrkiCAD on Ko-fi" src="https://img.shields.io/badge/Support%20OrkiCAD-Ko--fi-FF5E5B?logo=kofi&logoColor=white"></a></p>

**Community-supported, not paywalled:** donations and future sponsorship are voluntary. They do not unlock core CAD tools, cover third-party API charges or imply an entitlement to commercial services.

## License and credits

**OrkiCAD** is distributed under the [Apache License, Version 2.0](LICENSE) (`Apache-2.0`) for project-owned source code.

Copyright © 2026 Jorge López Frías and contributors, for contributions they own.

CAD libraries, external tools, AI model weights, APIs and third-party assets may carry separate licenses and terms; refer to [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Apache 2.0 does not license unrelated trademarks, external services or assets owned by others.

---

<p align="center"><strong>OrkiCAD — Design. Refine. Make.</strong><br>Open CAD · Practical AI · Community-driven engineering</p>
