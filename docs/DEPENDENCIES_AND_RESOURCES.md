# External AI, CAD and 3D resources

**Status:** reference catalog, **not** a list of installed or integrated dependencies. All integrations require compatibility and license checks before shipping. Updated: 2026-11-15.

Every implemented adapter or ComfyUI workflow must record: upstream name/URL, release or Git commit, model revision/checksum (when applicable), license and redistribution rights, supported operating systems, GPU/VRAM/RAM observations, test evidence, invocation contract, output types, and failure modes.

## CAD geometry and engineering

| Resource | Official reference | Intended role | Integration status |
| --- | --- | --- | --- |
| OpenSCAD | https://openscad.org / https://github.com/openscad/openscad | Scriptable 2D/3D CSG, CLI and SCAD/STL workflows | Proposed |
| BOSL2 | https://github.com/BelfrySCAD/BOSL2 | Parametric mechanical shapes, screws, nuts, gears and utilities | Proposed |
| FreeCAD | https://www.freecad.org / https://github.com/FreeCAD/FreeCAD | Editable B-rep CAD, dimensional constraints, technical drawings, STEP | Proposed |
| CadQuery | https://cadquery.readthedocs.io / https://github.com/CadQuery/cadquery | Python-parametric CAD solids, STEP, DXF, STL and 3MF according to backend | Proposed |
| Open CASCADE / OCCT | https://dev.opencascade.org | Solid modelling kernel underneath selected CAD integrations | Indirect/proposed |
| FreeCAD FCGear | https://github.com/looooo/freecad.gears | Parametric gear examples and reference implementation | Candidate; evaluate compatibility |
| Blender | https://www.blender.org / https://github.com/blender/blender | Mesh editing, retopology, UV mapping, asset preparation | Proposed |
| Trimesh | https://trimesh.org / https://github.com/mikedh/trimesh | Mesh inspection, slicing, conversions, repairs (with backend limits) | Proposed |
| Open3D | https://www.open3d.org / https://github.com/isl-org/Open3D | Point clouds, registration, geometry processing | Candidate |
| Inkscape | https://inkscape.org | SVG cleanup, vector editing, DXF interchange | Candidate |
| Bambu Studio | https://github.com/bambulab/BambuStudio | Optional downstream slicing for 3D printing | Candidate |
| OrcaSlicer | https://github.com/SoftFever/OrcaSlicer | Optional downstream slicing for 3D printing | Candidate |

CAD format notes: STEP is for suitable solid/B-rep geometry, not an automatic equivalent of a triangular mesh. STL/3MF are usually downstream manufacturing artifacts. DXF/SVG preserve 2D vector geometry but do not automatically preserve design constraints.

## AI models and visual workflows

| Resource | Official reference | Proposed role | Integration status |
| --- | --- | --- | --- |
| Ollama | https://ollama.com / https://github.com/ollama/ollama | Local inference endpoint and model management | Proposed |
| Qwen vision/coding models | https://huggingface.co/Qwen | Vision, measurement interpretation, structured CAD requests or coding | Candidate; choose and pin variants |
| GLM-OCR | https://huggingface.co/zai-org/GLM-OCR | Read text, annotations, dimensions and tables on scans | Candidate |
| ComfyUI | https://github.com/Comfy-Org/ComfyUI | Visual workflow execution, OCR/vision/image-to-3D adapter | Proposed |
| Lineart2Vector | https://github.com/TJ16th/TJ_ComfyUI_Lineart2Vector | Raster sketch/plan to SVG linework | Candidate |
| Hunyuan3D 2.1 | https://huggingface.co/Comfy-Org/Hunyuan-3D-2.1 | Single-image approximate 3D mesh creation | Candidate |
| TRELLIS.2 / Pixal3D | https://github.com/Comfy-Org/docs/blob/main/tutorials/3d/trellis2.mdx | Image-to-3D with PBR asset pipeline | Candidate |
| SAM 2 | https://github.com/facebookresearch/sam2 | Object segmentation and mask preparation | Candidate |
| Depth Anything V2 | https://github.com/DepthAnything/Depth-Anything-V2 | Relative depth prior from photographs (not a metric measurement by itself) | Candidate |
| COLMAP | https://colmap.github.io / https://github.com/colmap/colmap | Structure-from-motion and multi-view reconstruction | Candidate |

Single- and multi-image reconstruction are **not** metrology: accurate dimensional CAD needs measured references, camera calibration, geometric constraints and user verification.

## Optional hosted AI provider APIs

| Provider | Canonical developer documentation | Notes |
| --- | --- | --- |
| OpenAI | https://platform.openai.com/docs | Explicit opt-in; credentials supplied by user |
| Anthropic Claude | https://docs.anthropic.com | Explicit opt-in; credentials supplied by user |
| Google Gemini | https://ai.google.dev/gemini-api/docs | Explicit opt-in; credentials supplied by user |

Remote providers must use a common typed request/response contract and return **validated structured parameters**, not raw code executed with unrestricted privileges. Model IDs and APIs change: configure model names instead of hardcoding unverified versions. Verify current pricing, availability, licensing, privacy and retention terms separately.

## Frontends and orchestration

| Resource | Official reference | Planned role |
| --- | --- | --- |
| Tauri 2 | https://tauri.app | Lightweight native desktop shell |
| Rust | https://www.rust-lang.org | Desktop bridge and controlled process operations |
| React / TypeScript | https://react.dev / https://www.typescriptlang.org | Studio UI and typed controls |
| Three.js | https://threejs.org | In-app interactive 3D preview |
| FastAPI | https://fastapi.tiangolo.com | Optional local/LAN API |
| n8n | https://n8n.io | Optional batch automation |

## Quality gates for adoption

1. Identify the specific upstream release/commit and actual license (code **and model weights separately**).
2. Reproduce a minimal example on the target OS with isolated environments.
3. Measure GPU VRAM, RAM, execution time, model size and output consistency on the target machine.
4. Confirm redistribution constraints and attribution; never bundle third-party model weights by default.
5. Add unit/integration test fixtures and document limitations before marking a dependency as **supported**.

## Attribution and third-party notices

This catalog references independent upstream projects; their trademarks and ownership remain with their respective holders. Attribution is not a license grant. Add a `THIRD_PARTY_NOTICES.md` inventory with exact versions and licenses before distributing packages or copied source/assets.
