# OrkiCAD Studio — First React prototype

**Status:** development-only React frontend connected to the Python core through a localhost API. This is not yet a Tauri/Rust desktop installer. It currently shows generated OpenSCAD code, not a 3D viewer.

## Requirements

- OrkiCAD Python virtual environment already installed.
- Node.js and npm available on PATH.
- OpenSCAD/BOSL2 needed later for rendering mechanical SCAD files, not for the code-generation UI.

## Windows instructions — use two PowerShell windows

**Window 1: Python CAD core API**

```powershell
cd F:\orkicad-ai-github
git pull --ff-only origin main
.\.venv\Scripts\python.exe -m orkicad_core.studio_server
```

**Window 2: React frontend**

```powershell
cd F:\orkicad-ai-github\studio\frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173, select a component, adjust parameters, press Generate SCAD, and click Download .scad. Mechanical components generated as SCAD will need external BOSL2/OpenSCAD to create STL.

## Boundaries and security

- Frontend is React + TypeScript + Vite.
- Python API uses the standard library, binding to 127.0.0.1:8765 only.
- API accepts JSON part parameters; it never executes arbitrary user code or opens file paths.
- Prototype has no authentication. The custom client header is not a password. Do not expose it to the LAN or Internet.
- Tauri/Rust packaging, native file dialogs, model viewer, STEP, project persistence, ComfyUI integration, Ollama/cloud providers, and 3D slicing remain future milestones.
- Test on Windows and report defects before marking this Studio prototype verified.
