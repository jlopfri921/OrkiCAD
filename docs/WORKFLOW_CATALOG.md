# Workflow catalog — proposed, not yet implemented

Each workflow will eventually have a versioned ComfyUI JSON, matching custom node package, example input, expected output, required model/engine versions and verification log.

| ID | Name | Backend / integration |
| --- | --- | --- |
| W01 | Text → structured part parameters → CAD | Ollama/OpenAI/Claude/Gemini + core |
| W02 | Parametric screws, nuts, washers | OpenSCAD/BOSL2 + core |
| W03 | Gears, pulleys, shafts, couplings | OpenSCAD/BOSL2; CadQuery/FreeCAD |
| W04 | Enclosures, brackets and supports | Parametric CAD engine |
| W05 | Hand sketch → SVG/DXF | ComfyUI line detection/vectorization |
| W06 | Scanned plan/PDF → dimensions + 2D drawing | OCR + vectorization + validation |
| W07 | 2D drawing → dimensioned 3D CAD | FreeCAD/CadQuery |
| W08 | Single photo → 3D asset | ComfyUI image-to-3D (e.g. Hunyuan3D/TRELLIS.2) |
| W09 | Multi-photo → measured reconstruction | Multi-view processing + calibration + CAD |
| W10 | Annotated image → constrained CAD | Vision model + measurement association + core |
| W11 | Solid/mesh → 3D printing preparation | Mesh inspection/repair + slicer integration |
| W12 | Mesh → game-ready asset | Retopology + UV/PBR + LOD + glTF/GLB |
| W13 | Batch conversion, verification and reports | API/jobs/n8n |
| W14 | Product visualization and design variants | ComfyUI + CAD preview |

All rows describe **planned capabilities only**. Existing external workflow examples are not presented as OrkiCAD-verified until tested.

## First source implementation — parametric STL workflow

A draft LiteGraph workflow is now tracked at `comfyui/workflows/orkicad_parametric_stl.json`, connecting `OrkiCADPartSpec` to `OrkiCADGenerateSCAD` and `OrkiCADRenderSTL` for a sample box lid. Native node definitions are in `comfyui/orkicad_nodes/__init__.py`. **Status: committed, not yet tested inside ComfyUI Desktop**; do not mark W01–W04 as operational until runtime evidence is recorded. See [integration guide](COMFYUI_INTEGRATION.md).
