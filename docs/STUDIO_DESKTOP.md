# OrkiCAD Studio: shared Web and Desktop workspace

**Status: modern UI and Tauri 2 developer scaffold committed; no released desktop installer.**

## Modern interface

Studio Web and Studio Desktop use exactly the same React source in studio/frontend/src. The responsive dark CAD workspace has a compact project header, AI assistant sidebar, prominent real STL viewport, output controls (SCAD/STL/3MF/STEP), and parametric properties/feature-history inspector.

The assistant supports Spanish and English prompts, usable example prompts, automatic Ollama model discovery, and optional OpenAI, Claude and Gemini provider API keys. AI-generated CAD proposals require user review. The schematic of CAD primitives is distinct from the final STL mesh.

## Test Studio Web

Start the local Python API in one PowerShell window:

    cd F:\orkicad-ai-github
    .\.venv-occt\Scripts\python.exe -m orkicad_core.studio_server

Start Vite in another:

    cd F:\orkicad-ai-github\studio\frontend
    npm install
    npm run dev

Open http://127.0.0.1:5173. The current local API is **not Internet safe**.

## Test Tauri Desktop developer scaffold

Tauri 2 lives under studio/frontend/src-tauri and wraps the same React frontend. Windows developer prerequisites: Node, npm, a Rust toolchain, Tauri Windows/WebView2 build prerequisites, and an existing local project Python venv with the installed OrkiCAD Core.

    cd F:\orkicad-ai-github\studio\frontend
    npm install
    npm run tauri:dev

The Tauri Rust launcher automatically starts the OrkiCAD Python CAD worker, chooses an ephemeral loopback port, sets a per-session token, waits for worker health, and cleans up its child process on exit. React calls the same API through a Rust IPC command instead of talking directly to the worker. No manual worker Python path or separate server terminal is required in *developer mode*, provided the supported project venv exists.

**Do not distribute this as a ready-made installer.** Bundling is deliberately disabled until a license-reviewed native runtime containing OpenSCAD, OCCT and OrkiCAD Core is packaged for Windows, Linux and macOS. A packaged release must need no FreeCAD, ComfyUI, manually installed Python, separately installed OpenSCAD, or configurable engine path.

## Privacy and security

Studio Web currently binds to localhost only. Desktop requires a session-specific X-OrkiCAD-Token for both GET and POST and sends it only over private loopback IPC. The desktop bridge restricts method and endpoint allowlists and does not execute model-generated source code. Optional cloud API keys are submitted only for an explicit request, are not embedded in URLs or CAD files, and need production-grade protected storage before public Web/desktop releases.

## Acceptance checklist

1. Existing Python unittest suite plus new desktop token tests.
2. Frontend TypeScript build (npm run build).
3. Native Tauri compile and one-command run (npm run tauri:dev).
4. Test Ollama prompts in Spanish, feature editing, real 3D viewport, SCAD/STL/3MF/OCCT STEP and clean shutdown.
5. Verify responsive desktop Web and desktop app share the same appearance.
6. Package the native engines, perform clean-install smoke tests, and validate STEP imports with independent CAD readers on each supported OS.

These are acceptance requirements; committing source does not prove they have passed.

## World origin and three CAD reference planes (Studio Web / Desktop)

After generating an STL, enable **Planos 0,0,0** in the central viewer. The three translucent planes intersect at the **global CAD origin**:

- **XY, Z=0:** horizontal construction/reference plane.
- **XZ, Y=0:** vertical construction/reference plane.
- **YZ, X=0:** the other vertical construction/reference plane.

The white marker identifies **(0,0,0)**, not the centre of the displayed part. The frame is correctly offset when the STL mesh is centered purely for camera navigation. Orbiting/zooming does not change part coordinates. Hiding planes only affects the viewer, not the model or exported geometry.

The Feature model inspector includes placement presets: **Origen absoluto (0,0,0)**, **Centro de la base (X/Y)**, and **Centro de la cara superior**. A box uses its minimum XYZ corner, whereas a cylinder uses its axis centre X/Y and base Z. These shortcuts compute canonical millimetre values and can still be refined manually. Changing a feature invalidates the preview: regenerate STL to see final CSG output.

A click on an STL exterior face highlights it and, when safely mapped, focuses the corresponding width, depth or height/upper thickness field. The click is approximate *mesh* selection. It does not yet supply native OCCT/STEP face identities, editable fillets, holes, sketches, persistent references or parametric dependencies. Precise B-rep selection is the next phase and must be implemented in shared Core rather than separately in the Web/Desktop clients.
