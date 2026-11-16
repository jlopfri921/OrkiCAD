# Third-party software and model notices

OrkiCAD AI's **original source code is licensed under Apache-2.0**; third-party components are **not** relicensed by OrkiCAD AI. See [LICENSE](LICENSE), [NOTICE](NOTICE) and [licensing decision](docs/LICENSING_DECISION.md).

**Status (2026-11-16):** source development; no verified redistributable desktop bundle. Existing code can call separately installed engines or optional Python/Node dependencies. This list is not yet a dependency lockfile or a completed license audit.

| Dependency | Actual/project role | License/terms to audit before packaging |
| --- | --- | --- |
| Open CASCADE Technology (OCCT) / OCP | Native B-rep geometry and STEP where supported; optional runtime | OCCT **LGPL-2.1 + OCCT exception**; verify OCP bindings and their dependency notices independently |
| OpenSCAD | External CAD mesh renderer when installed | GPL-family software; verify exact release and any distribution details |
| BOSL2 | Optional OpenSCAD mechanical library for screws/gears | Audit exact BOSL2 revision and its license before bundling |
| React, Three.js, Vite, Tauri, Rust, Python and additional libraries | Web/Desktop frameworks and Core runtimes | Record exact versions, licenses and copyright notices during release packaging |
| ComfyUI | Optional integration with separately installed ComfyUI environment | Audit ComfyUI and extension dependencies if any code is copied/redistributed |
| Ollama and external/open-weight AI models | Local model runtime and optional separately downloaded weights | Check runtime, individual model licenses and distribution restrictions independently |
| OpenAI, Anthropic and Google Gemini | Optional external services enabled by user API key | Their service terms apply separately; no service is included in Apache-2.0 grant |

**OCCT-specific user notice:** OrkiCAD AI can make use of Open CASCADE Technology (© 1999–2026 OPEN CASCADE S.A.S.). OCCT is available under LGPL-2.1 with its exception, and end users have rights in the OCCT library itself. Refer to [OCCT documentation](https://occt3d.com/dev/doc/overview/html/) and [upstream license and exception](https://github.com/Open-Cascade-SAS/OCCT). For distributed runtimes provide the relevant LGPL license, exception, source/build/relink information and a way to use compatible modified versions, as applicable.

For **every component actually included** in a release, record exact version/commit, origin URL, copyright, SPDX identifier if verified, applicable notice text, changes and whether binary code or model weights are redistributed. Refer to [dependency catalog](docs/DEPENDENCIES_AND_RESOURCES.md). Do not claim all AI model weights are open-source.
