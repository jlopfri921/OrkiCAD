"""Strict subprocess boundary for real OCCT B-rep XZ sections.

The Python HTTP worker remains free of a mandatory OCCT dependency.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path
import subprocess
import tempfile
from typing import Any, Mapping

from .occt_step import OCCTExportError, resolve_occt_python
from .parts_catalog import validated_spec

SECTION_TIMEOUT = 60
MAX_SECTION_BYTES = 128 * 1024


def render_occt_section(
    spec: Mapping[str, Any], *, python_path: str = "Auto", timeout: int = SECTION_TIMEOUT
) -> dict:
    safe = validated_spec(spec)
    if safe["type"] not in {"circular_plate", "solid_shaft", "washer", "hollow_tube"}:
        raise ValueError("First OCCT section supports circular_plate, solid_shaft, washer, hollow_tube only")
    if isinstance(timeout, bool) or not isinstance(timeout, int) or not 5 <= timeout <= 180:
        raise ValueError("OCCT section timeout must be 5..180 seconds")
    worker = Path(__file__).with_name("occt_section_worker.py")
    if not worker.is_file():
        raise OCCTExportError("OrkiCAD section worker is missing")
    executable = resolve_occt_python(python_path)
    with tempfile.TemporaryDirectory(prefix="orkicad_section_") as temp:
        folder = Path(temp)
        source = folder / "spec.json"
        destination = folder / "section.json"
        source.write_text(json.dumps(safe), encoding="utf-8")
        env = os.environ.copy()
        env["ORKICAD_OCCT_SPEC_PATH"] = str(source)
        env["ORKICAD_OCCT_OUT_PATH"] = str(destination)
        try:
            result = subprocess.run(
                [executable, str(worker)], cwd=temp, env=env,
                capture_output=True, text=True, encoding="utf-8",
                errors="replace", timeout=timeout, check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise OCCTExportError("OCCT section timed out") from exc
        except OSError as exc:
            raise OCCTExportError(f"Could not start OCCT section worker: {exc}") from exc
        logs = ((result.stdout or "") + "\n" + (result.stderr or "")).strip()
        if result.returncode != 0 or "ORKICAD_OCCT_SECTION_OK" not in logs:
            if "No module named 'OCP'" in logs or 'No module named "OCP"' in logs:
                raise OCCTExportError("OCCT/OCP unavailable in selected Python environment")
            raise OCCTExportError("OCCT B-rep section failed: " + logs[-1200:])
        if not destination.is_file() or destination.stat().st_size > MAX_SECTION_BYTES:
            raise OCCTExportError("OCCT section output missing or oversized")
        data = json.loads(destination.read_text(encoding="utf-8"))
        if data.get("source") != "occt-brep" or data.get("units") != "mm":
            raise OCCTExportError("Invalid OCCT section result")
        plane = data.get("plane")
        if plane != {"name": "XZ", "origin_mm": [0, 0, 0], "normal": [0, 1, 0]}:
            raise OCCTExportError("Unexpected section coordinate frame")
        edges = data.get("segments")
        if not isinstance(edges, list) or not 1 <= len(edges) <= 256:
            raise OCCTExportError("Invalid OCCT section edge collection")
        for edge in edges:
            if not isinstance(edge, list) or len(edge) != 2:
                raise OCCTExportError("Invalid OCCT section edge format")
            for point in edge:
                if not isinstance(point, list) or len(point) != 2 or any(
                    isinstance(v, bool) or not isinstance(v, (int, float))
                    or not math.isfinite(v) or abs(v) > 10000 for v in point
                ):
                    raise OCCTExportError("Invalid OCCT section coordinate")
        return data
