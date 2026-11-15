"""Render allowlisted, parameter-validated OrkiCAD specs to STL via OpenSCAD.

Run only on localhost in development; external OpenSCAD/BOSL2 are optional tools.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Mapping

from .geometry import ParameterError, generate_scad

MAX_STL_BYTES = 25 * 1024 * 1024
MESH_EXPORT_FORMATS = frozenset({"stl", "3mf", "obj", "off", "amf"})
MECHANICAL = frozenset({"metric_screw", "metric_nut", "spur_gear"})


class RenderError(RuntimeError):
    """OpenSCAD could not export the requested mesh."""


def render_mesh(spec: Mapping[str, Any], *, format: str = "stl", timeout: int = 120) -> bytes:
    """Return OpenSCAD mesh bytes for a validated, allowlisted format.

    STEP/IGES/BREP are explicitly excluded: mesh conversion does not recreate
    mathematically precise CAD surfaces.
    """
    if format not in MESH_EXPORT_FORMATS:
        raise RenderError("Unsupported mesh export format. Use stl, 3mf, obj, off or amf.")
    source = generate_scad(spec)
    executable = os.environ.get("ORKICAD_OPENSCAD", "openscad")
    openscad = shutil.which(executable)
    if not openscad:
        raise RenderError(
            "No se encuentra OpenSCAD. Configura ORKICAD_OPENSCAD con "
            "la ruta de openscad.exe y reinicia el servidor Python."
        )

    environment = os.environ.copy()
    if spec["type"] in MECHANICAL:
        bosl2_path = os.environ.get("ORKICAD_BOSL2_DIR", "")
        folder = Path(bosl2_path).expanduser() if bosl2_path else None
        if not folder or not all((folder / name).is_file() for name in
                                 ("std.scad", "screws.scad", "gears.scad")):
            raise RenderError(
                "La pieza necesita BOSL2. Configura ORKICAD_BOSL2_DIR "
                "con la carpeta BOSL2 y reinicia el servidor Python."
            )
        environment["OPENSCADPATH"] = os.pathsep.join(
            p for p in (str(folder.resolve().parent),
                        environment.get("OPENSCADPATH", "")) if p
        )

    with tempfile.TemporaryDirectory(prefix="orkicad_studio_") as temp:
        input_path = Path(temp) / "source.scad"
        output_path = Path(temp) / f"result.{format}"
        input_path.write_text(source, encoding="utf-8")
        try:
            finished = subprocess.run(
                [openscad, "-o", str(output_path), str(input_path)],
                env=environment,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise RenderError(
                f"OpenSCAD superó el límite de {timeout} segundos."
            ) from exc
        except OSError as exc:
            raise RenderError(f"No se pudo ejecutar OpenSCAD: {exc}") from exc

        log = (finished.stderr or "") + "\n" + (finished.stdout or "")
        if finished.returncode != 0 or any(fragment in log for fragment in (
            "Can't open include file", "Ignoring unknown module",
            "Unable to convert file", "ERROR:",
        )):
            raise RenderError(
                "OpenSCAD no pudo generar la geometría: " + log.strip()[-1000:]
            )
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise RenderError(f"OpenSCAD no ha generado un archivo {format.upper()} válido.")
        if output_path.stat().st_size > MAX_STL_BYTES:
            raise RenderError(f"Archivo {format.upper()} demasiado grande para este prototipo (25 MiB).")
        return output_path.read_bytes()


def render_stl(spec: Mapping[str, Any], *, timeout: int = 120) -> bytes:
    """Backward-compatible STL entry point shared by Studio and ComfyUI."""
    return render_mesh(spec, format="stl", timeout=timeout)
