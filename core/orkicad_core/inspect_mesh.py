"""Inspect STL geometry and produce JSON reports (optional trimesh/networkx)."""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path


def inspect_stl(path):
    try:
        import trimesh
    except ImportError as exc:
        raise RuntimeError("Install mesh tools: python -m pip install -e .[mesh]") from exc
    source = Path(path)
    if source.suffix.lower() != ".stl" or not source.is_file():
        raise ValueError(f"Not an existing STL file: {source}")
    mesh = trimesh.load_mesh(str(source), process=True)
    if not isinstance(mesh, trimesh.Trimesh) or mesh.is_empty:
        raise ValueError(f"No valid triangular mesh in {source}")
    try:
        component_count = len(mesh.split(only_watertight=False))
    except ImportError as exc:
        raise RuntimeError("Graph backend missing: install networkx") from exc
    volume = float(mesh.volume)
    extents = [float(v) for v in mesh.extents]
    flags = {
        "watertight": bool(mesh.is_watertight),
        "positive_volume": bool(mesh.is_volume) and math.isfinite(volume) and volume > 0,
        "one_component": component_count == 1,
        "finite_positive_dimensions": all(math.isfinite(v) and v > 0 for v in extents),
    }
    return {
        "file": str(source),
        "faces": len(mesh.faces),
        "components": component_count,
        "volume_mm3": round(volume, 4),
        "dimensions_mm": [round(v, 4) for v in extents],
        "checks": flags,
        "passed": all(flags.values()),
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="OrkiCAD STL inspection (geometry only)")
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--json", dest="json_path", type=Path)
    args = parser.parse_args(argv)
    reports = []
    for path in args.files:
        try:
            result = inspect_stl(path)
            state = "PASS" if result["passed"] else "CHECK"
            print(f"{state} {path.name}: {result['dimensions_mm']} mm, "
                  f"{result['faces']} faces, {result['components']} components")
        except (ValueError, RuntimeError, OSError) as exc:
            result = {"file": str(path), "passed": False, "error": str(exc)}
            print(f"ERROR {path}: {exc}", file=sys.stderr)
        reports.append(result)
    success = all(x["passed"] for x in reports)
    if args.json_path:
        args.json_path.parent.mkdir(parents=True, exist_ok=True)
        args.json_path.write_text(json.dumps({
            "schema": "orkicad.mesh-report.v1",
            "all_passed": success,
            "files": reports,
            "disclaimer": "No guarantee of mechanical tolerances, fit, or printability.",
        }, indent=2) + "\n", encoding="utf-8")
        print(f"Report saved: {args.json_path}")
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
