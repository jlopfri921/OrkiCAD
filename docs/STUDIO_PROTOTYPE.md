# OrkiCAD Studio — First React prototype

**Status:** development-only React frontend connected to the shared Python core through a localhost API. It includes an STL 3D preview, feature-model operation history editing, and STL/3MF/STEP download actions. It is **not** a secured hosted web edition or a Tauri/Rust desktop installer. New functions are committed and require a fresh local integration test.

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

Open http://127.0.0.1:5173, select a part, adjust parameters, and generate an STL. Choose **Feature model** to edit the ordered add/subtract operations. **Export 3MF** and **Export STEP (OCCT)** use the shared Python core through the development API: `/api/3mf` and `/api/step`, not a browser-side CAD executable. When the project-local `.venv-occt` contains OCP, the source prototype can discover it with the default `Auto` runtime setting. These are developer-mode conveniences; future production installers will bundle the CAD engine and expose no Python path field.

## Boundaries and security

- Frontend is React + TypeScript + Vite.
- Python API uses the standard library, binding to 127.0.0.1:8765 only.
- API accepts JSON part parameters; it never executes arbitrary user code or opens file paths.
- Prototype has no authentication. The custom client header is not a password. Do not expose it to the LAN or Internet.
- Tauri/Rust packaging, production authentication, project persistence, secure cloud providers, multi-client viewport selection parity, and 3D slicing remain future milestones. Studio already has an STL preview and local Ollama proposal endpoint; their acceptance must be tested separately.
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

## Shared three-client roadmap

Studio Web is **one of three required product interfaces**, alongside Studio Desktop and ComfyUI. The canonical Core, part catalog, `feature_model` JSON, validation and OCCT export logic are shared. Tauri Desktop will package the **same React app** rather than create a second editor. ComfyUI is an optional adapter that never gates Studio use.

**Current source-level progress (not yet runtime accepted):** Studio now has a dedicated React feature history editor with ordered add/cut operations; exports 3MF/STEP via the new development API endpoints; uses OCCT with optional automatic project-local runtime discovery; and has an automated React build / API smoke-test CI job. The visual operation schematic currently runs in ComfyUI; Studio Web/Desktop should share a packaged viewport component next. The previous Studio STL viewer displays a real mesh but has no direct topology/face selection.

The development HTTP server binds only to 127.0.0.1 and uses a non-secret client header. It is **not suitable for publishing to the Internet**. Hosted web deployment requires a hardened authenticated API, isolation, quotas, rate limiting, access controls, and protected file streaming.

For real desktop packaging, OrkiCAD must distribute a license-reviewed OCCT runtime, not ask a user to install FreeCAD, Python or ComfyUI, and not expose OS-dependent interpreter path fields. See [ADR 0007](adr/0007-three-clients-one-core.md).
