# Local development on Windows

**Maintainer's workspace:** `F:\orkicad-ai` (Windows). This is a developer-machine convention, **not** a hardcoded path or requirement for contributors.

## First checkout

In PowerShell:

```powershell
New-Item -ItemType Directory -Path 'F:\orkicad-ai' -Force | Out-Null
git clone https://github.com/jlopfri921/orkicad-ai.git 'F:\orkicad-ai'
Set-Location 'F:\orkicad-ai'
git status
```

**If `F:\orkicad-ai` already contains a Git checkout**, do **not** clone over it. Instead:

```powershell
Set-Location 'F:\orkicad-ai'
git remote -v
git status
git pull --ff-only
```

If the directory exists with unrelated files, inspect or move them first; Git will not overwrite them safely.

## Local configuration philosophy

- Set paths using environment variables or a per-user config file (excluded from Git); don't commit developer disk letters.
- Reuse existing ComfyUI installation by pointing an adapter to its HTTP endpoint (or a supported workflow package). Don't copy its virtual environment or model files into this repository.
- Run CAD engines (OpenSCAD/FreeCAD) via explicit, validated local executable paths, preferably in a separate process environment from ComfyUI Python.
- Keep CAD generated files in a workspace output directory, excluded from Git.
- Keep AI weights outside the repo and load them from user-configured paths.
- Never expose Ollama, ComfyUI or filesystem operations to the internet without appropriate authentication and network controls.

## Example planned paths (not wired to software yet)

```text
F:\orkicad-ai\                 Git repository
F:\orkicad-ai\core\           Shared CAD core (future)
F:\orkicad-ai\studio\         Tauri/React desktop app (future)
F:\orkicad-ai\comfyui\        Extension and JSON workflows (future)
F:\orkicad-ai\docs\           Documentation
F:\orkicad-ai\.env            Machine-local settings, ignored by Git
F:\orkicad-ai\outputs\        Generated CAD files, ignored by Git
```

Optional existing model/workflow installation is separate, for example `D:\comfy-desktop\ComfyUI-Shared\models`; discover actual installation paths during setup.

## Future setup scripts

When working code exists, add `scripts/bootstrap-windows.ps1`, `scripts/doctor.ps1` and dependency lockfiles to create isolated environments, verify engine executables, check versions, and test export pipelines. No such automated setup is implemented in the planning phase.
