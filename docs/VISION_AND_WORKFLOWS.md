# OrkiCAD AI — Full vision and workflow families

## Mission
An open-source, **multimodal CAD + 3D design + manufacturing ecosystem**. Convert text, dimensions, hand sketches, scanned plans/PDFs, one or several photographs, annotated images and existing models into 2D/3D outputs. Include both engineering-grade parametric designs and artistic assets.

## Product surfaces
- **OrkiCAD ComfyUI**: native custom nodes and composable visual workflows.
- **OrkiCAD Studio Desktop**: independent Tauri 2/Rust + React/TypeScript application.
- **OrkiCAD Studio Web** (planned): browser access through a secured backend.
- Both share **OrkiCAD Core (Python)** and optional visual AI services; Studio must also operate without ComfyUI.
- Ollama local and optional provider adapters for OpenAI, Anthropic Claude and Google Gemini; no forced cloud calls.

## Comprehensive workflow catalog
| Area | Input | Target results | Notes |
| --- | --- | --- | --- |
| Text-to-CAD | Natural-language request + dimensions | SCAD, STEP, STL | Validate structured parameters first |
| Parametric component generation | Numerical controls or prompts | Screws, nuts, washers, gears, pulleys, shafts, bearings/housings, enclosures, brackets, mounts, couplings | Standards/tolerances require explicit checks |
| Drawing/scan-to-vector | Sketch, image, PDF, technical plan | SVG, DXF | OCR dimensions and line geometry separately |
| Drawing/sketch-to-CAD | 2D profile + depth/features | Editable solid, FCStd/STEP | Constraint/rebuild rather than blind meshing |
| Annotated photo-to-CAD | Photo with measurement labels, arrows or text | Measured geometry candidate | Scale and anchor association require review |
| Single photo-to-3D | Object image | GLB/mesh, optionally textured | Geometry approximate; not metrology |
| Multi-photo-to-3D | Multiple views + calibration/known dimensions | Mesh or CAD reconstruction candidate | Camera calibration and scale constraints |
| 3D printing preparation | CAD solid or mesh | Validated STL/3MF, slicer-ready data | Manifoldness, size, wall thickness, orientation, supports and clearances |
| Game assets | Prompt, image, sketches or 3D mesh | GLB/OBJ/FBX via capable tools, PBR textures | Retopo, UV unwrap, LODs, normal/roughness maps and engine presets |
| Product and concept design | Text, photo, CAD baseline | 3D visualizations and editable design iterations | Compare variants |
| Model repair & conversion | Imported mesh/solid | Fixed mesh, safe format conversion | Preserve metadata, dimensions and provenance when possible |
| Automation | Batch files/parameters | Reproducible jobs and reports | Optional n8n/web API; supervised defaults |

## Output semantics
- **CAD solids**: STEP, native FreeCAD/FCStd, SCAD where appropriate.
- **2D vectors**: DXF and SVG (do not assume all drawings are dimensionally accurate).
- **Print meshes**: STL and 3MF; slicing with Bambu Studio, OrcaSlicer or Cura outside core until integrated.
- **Game/design assets**: GLB/glTF and PBR texture sets; other formats only through supported converters.

## Acceptance principles
- Separate **visual plausibility** from **engineering precision**.
- A single photograph does not reveal all hidden geometry or true dimensions.
- For multiple photos, require view correspondence, scale evidence and uncertainty display.
- Every workflow declares its required nodes, models, CAD engines and output capabilities.
- Claim a workflow *working* only when tested with a reproducible input/output example.
- Avoid executing arbitrary LLM-generated code as trusted machine instructions.
