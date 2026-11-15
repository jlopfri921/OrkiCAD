# Getting started — prototype CAD core

**Status:** first prototype. Only washer, mounting plate and open box are included. No AI, ComfyUI node or desktop application is implemented here yet.

## Windows PowerShell

From your Git checkout, intended location: `F:\orkicad-ai`:

```powershell
cd F:\orkicad-ai
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\washer.json -o outputs\washer.scad
```

Open `outputs\washer.scad` in OpenSCAD to inspect the generated part.

To export an STL, install OpenSCAD separately and add `openscad.exe` to PATH, or provide its full path:

```powershell
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\washer.json -o outputs\washer.stl --openscad "C:\Program Files\OpenSCAD\openscad.exe"
```

## Supported JSON parameters

| Type | Parameters (millimetres) |
| --- | --- |
| `washer` | `outer_diameter`, `inner_diameter`, `thickness` |
| `mounting_plate` | `width`, `depth`, `thickness`, `hole_diameter`, `hole_inset` |
| `open_box` | `width`, `depth`, `height`, `wall` |

This prototype validates positive finite dimensions, basic consistency and an allowlisted shape type. It does **not** guarantee tolerance, thread compliance, slicing success or print quality.

### Next milestones

BOSL2-based screws/nuts/gears, FreeCAD/CadQuery STEP exports, dimensions and constraints, ComfyUI workflow adapters and Studio frontend.
