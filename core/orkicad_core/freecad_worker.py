"""FreeCADCmd worker: construct native B-rep solids from OrkiCAD parameters.

Executed ONLY by FreeCADCmd's bundled Python interpreter. Inputs are JSON
files created by orkicad_core.step_export, not scripts emitted by AI models.
Supported prototype families: washer, mounting_plate, open_box, box_lid.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import FreeCAD as App
import Part


def _solid(spec):
    k = spec["type"]
    vector = App.Vector
    box = Part.makeBox
    cylinder = Part.makeCylinder
    if k == "corner_plate":
        width, depth, thickness = (
            spec[key] for key in ("width", "depth", "thickness")
        )
        shape = box(width, depth, thickness)
        vertical = []
        for edge in shape.Edges:
            vertices = edge.Vertexes
            if (len(vertices) == 2 and
                    abs(vertices[0].Point.x - vertices[1].Point.x) < 1e-7 and
                    abs(vertices[0].Point.y - vertices[1].Point.y) < 1e-7 and
                    abs(vertices[0].Point.z - vertices[1].Point.z) > thickness - 1e-7):
                vertical.append(edge)
        if len(vertical) != 4:
            raise RuntimeError("Could not find four corner edges")
        if spec["corner_style"] == "round":
            shape = shape.makeFillet(spec["corner_size"], vertical)
        elif spec["corner_style"] == "chamfer":
            shape = shape.makeChamfer(spec["corner_size"], vertical)
        else:
            raise ValueError("Unsupported corner style")
        for x in (spec["hole_inset"], width - spec["hole_inset"]):
            tool = cylinder(spec["hole_diameter"] / 2, thickness + .2,
                            vector(x, depth / 2, -.1))
            shape = shape.cut(tool)
    elif k == "machined_block":
        width, depth, height = (spec[key] for key in ("width", "depth", "height"))
        shape = box(width, depth, height)
        for x in (spec["hole_inset"], width - spec["hole_inset"]):
            hole = cylinder(spec["hole_diameter"] / 2, height + .2,
                            vector(x, depth / 2, -.1))
            shape = shape.cut(hole)
        pocket_w = spec["pocket_width"]
        pocket_d = spec["pocket_depth"]
        cut = spec["pocket_cut_depth"]
        pocket = box(pocket_w, pocket_d, cut + .1,
                     vector((width - pocket_w) / 2,
                            (depth - pocket_d) / 2, height - cut))
        shape = shape.cut(pocket)
    elif k == "washer":
        outer = cylinder(spec["outer_diameter"] / 2, spec["thickness"])
        bore = cylinder(spec["inner_diameter"] / 2,
                        spec["thickness"] + 0.2, vector(0, 0, -0.1))
        shape = outer.cut(bore)
    elif k == "mounting_plate":
        width, depth, thickness = spec["width"], spec["depth"], spec["thickness"]
        inset = spec["hole_inset"]
        shape = box(width, depth, thickness)
        for x in (inset, width - inset):
            for y in (inset, depth - inset):
                tool = cylinder(spec["hole_diameter"] / 2, thickness + 0.2,
                                vector(x, y, -0.1))
                shape = shape.cut(tool)
    elif k == "open_box":
        width, depth, height, wall = (spec[key] for key in
                                       ("width", "depth", "height", "wall"))
        body = box(width, depth, height)
        cavity = box(width - 2 * wall, depth - 2 * wall, height,
                     vector(wall, wall, wall))
        shape = body.cut(cavity)
    elif k == "box_lid":
        width, depth = spec["box_width"], spec["box_depth"]
        wall, overhang, clearance = (spec[key] for key in
                                     ("box_wall", "overhang", "clearance"))
        plate = box(width + 2 * overhang, depth + 2 * overhang, spec["thickness"])
        plug = box(width - 2 * (wall + clearance),
                   depth - 2 * (wall + clearance),
                   spec["plug_depth"] + 0.01,
                   vector(overhang + wall + clearance,
                          overhang + wall + clearance, -spec["plug_depth"]))
        shape = plate.fuse(plug)
    else:
        raise ValueError("STEP B-rep export not implemented for part type: " + str(k))
    shape = shape.removeSplitter()
    if shape.isNull() or not shape.isValid() or len(shape.Solids) != 1:
        raise RuntimeError("FreeCAD generated an invalid or non-single B-rep solid")
    return shape


def main():
    spec_path = Path(os.environ["ORKICAD_FC_SPEC_PATH"])
    out_path = Path(os.environ["ORKICAD_FC_OUT_PATH"])
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    shape = _solid(spec)
    shape.exportStep(str(out_path))
    if not out_path.is_file() or out_path.stat().st_size == 0:
        raise RuntimeError("STEP output missing or empty")
    print("ORKICAD_STEP_EXPORT_OK")


if __name__ == "__main__":
    main()
