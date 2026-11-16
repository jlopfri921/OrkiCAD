"""Dedicated OCCT geometric section worker; never executes user CAD code.

Milestone v1: intersection curves of a validated circular plate and Y=0 plane,
as XY coordinates in the section view's XZ world frame, millimetres.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

# Both python -m orkicad_core.occt_section_worker and direct execution from
# the subprocess launcher must resolve the same authoritative CAD B-rep maker.
if __package__:
    from .occt_worker import make_shape
else:
    from occt_worker import make_shape


SECTION_SUPPORTED_TYPES = frozenset({
    "solid_shaft", "washer", "hollow_tube", "circular_plate",
})


def section_catalog_part(spec: dict) -> dict:
    from OCP.BRepAlgoAPI import BRepAlgoAPI_Section
    from OCP.BRepAdaptor import BRepAdaptor_Curve
    from OCP.GeomAbs import GeomAbs_Line
    from OCP.TopAbs import TopAbs_EDGE
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopoDS import TopoDS
    from OCP.gp import gp_Dir, gp_Pln, gp_Pnt

    if spec["type"] not in SECTION_SUPPORTED_TYPES:
        raise ValueError("OCCT section milestone supports circular_plate, washer, hollow_tube and solid_shaft only")
    solid = make_shape(spec)
    # XZ plane, world Y=0; not a guessed projected silhouette.
    plane = gp_Pln(gp_Pnt(0, 0, 0), gp_Dir(0, 1, 0))
    operation = BRepAlgoAPI_Section(solid, plane, False)
    operation.Approximation(True)
    operation.Build()
    if not operation.IsDone() or operation.Shape().IsNull():
        raise RuntimeError("OCCT could not intersect this solid with the XZ plane")
    downcast = getattr(TopoDS, "Edge_s", None) or getattr(TopoDS, "Edge", None)
    if downcast is None:
        raise RuntimeError("This OCCT build cannot access geometric section edges")

    segments: set[tuple[tuple[float, float], tuple[float, float]]] = set()
    explorer = TopExp_Explorer(operation.Shape(), TopAbs_EDGE)
    while explorer.More():
        curve = BRepAdaptor_Curve(downcast(explorer.Current()))
        # For these supported cylinders/annular solids cut by their axial plane, intersected
        # surfaces have straight segments. Do not approximate curved B-rep
        # edges as straight lines without explicitly sampling them.
        if curve.GetType() != GeomAbs_Line:
            raise RuntimeError("Unexpected curved section edge; approximation is not allowed")
        first = curve.Value(curve.FirstParameter())
        last = curve.Value(curve.LastParameter())
        if abs(first.Y()) > 1e-5 or abs(last.Y()) > 1e-5:
            raise RuntimeError("OCCT section contains an off-plane edge")
        points = (
            (round(float(first.X()), 7), round(float(first.Z()), 7)),
            (round(float(last.X()), 7), round(float(last.Z()), 7)),
        )
        if not all(math.isfinite(v) for point in points for v in point):
            raise RuntimeError("OCCT section contains invalid coordinates")
        if points[0] != points[1]:
            segments.add(tuple(sorted(points)))
        if len(segments) > 256:
            raise RuntimeError("OCCT section exceeds prototype edge limit")
        explorer.Next()
    if not segments:
        raise RuntimeError("OCCT returned an empty section")
    return {
        "source": "occt-brep",
        "units": "mm",
        "plane": {"name": "XZ", "origin_mm": [0, 0, 0], "normal": [0, 1, 0]},
        "segments": [[list(a), list(b)] for a, b in sorted(segments)],
    }


def main() -> None:
    source = Path(os.environ["ORKICAD_OCCT_SPEC_PATH"])
    output = Path(os.environ["ORKICAD_OCCT_OUT_PATH"])
    spec = json.loads(source.read_text(encoding="utf-8"))
    result = section_catalog_part(spec)
    output.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print("ORKICAD_OCCT_SECTION_OK")


if __name__ == "__main__":
    main()
