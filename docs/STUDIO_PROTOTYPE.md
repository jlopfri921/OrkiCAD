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

## Troubleshooting: empty JSON / failed Generate SCAD

If Studio showed `Failed to execute 'json' on 'Response': Unexpected end of JSON input`, the frontend attempted to parse an empty response. A more informative frontend error was added in commit `fea6a5e`. This usually means the Python service was not started, stopped, or the Vite proxy could not reach port 8765.

1. Check http://127.0.0.1:8765/api/health in the browser. Expected: `{"status":"ok","service":"orkicad-studio-api"}`.
2. Keep `python -m orkicad_core.studio_server` running in one PowerShell window.
3. Keep `npm run dev` running in another PowerShell window.
4. Run `git pull --ff-only origin main` and refresh the Studio page after updating the frontend.
5. If health works but part generation still fails, inspect both terminal outputs and the browser Network tab for `POST /api/scad`, including HTTP status and response body.

To test API generation without the browser, run in a third PowerShell window:

```powershell
$body = @{type='washer';outer_diameter=18;inner_diameter=6.5;thickness=2} | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/scad' -Method Post -ContentType 'application/json' -Headers @{'X-OrkiCAD-Client'='studio'} -Body $body
```

The `GET /api/health` and `POST /api/scad` endpoints test Python and OpenSCAD source generation only. STL export and mesh validation are separate operations.
