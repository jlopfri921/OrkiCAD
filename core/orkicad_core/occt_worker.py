"""OrkiCAD native OCCT STEP worker (no FreeCAD dependency).

This script runs inside a dedicated Python environment containing cadquery-ocp.
Only a previously validated JSON specification is provided; no user code is
evaluated and no ComfyUI/PyTorch dependencies are required.
"""
from __future__ import annotations

import json
import os
from pathlib import Path


def make_shape(spec):
    from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
    from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder
    from OCP.gp import gp_Pnt

    def box(width, depth, height, x=0, y=0, z=0):
        return BRepPrimAPI_MakeBox(
            gp_Pnt(float(x), float(y), float(z)),
            float(width), float(depth), float(height),
        ).Shape()

    def cylinder(radius, height, x=0, y=0, z=0):
        from OCP.gp import gp_Ax2, gp_Dir
        return BRepPrimAPI_MakeCylinder(
            gp_Ax2(gp_Pnt(float(x), float(y), float(z)), gp_Dir(0, 0, 1)),
            float(radius), float(height),
        ).Shape()

    kind = spec["type"]
    if kind == "feature_model":
        from OCP.BRepCheck import BRepCheck_Analyzer
        from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
        shape = box(spec["width"], spec["depth"], spec["height"])
        for index, feature in enumerate(spec["operations"]):
            x, y, z = feature["position"]
            if feature["shape"] == "box":
                tool = box(*feature["size"], x, y, z)
            elif feature["shape"] == "cylinder":
                tool = cylinder(feature["radius"], feature["height"], x, y, z)
            else:
                raise ValueError("Unrecognized feature primitive")
            operation = (BRepAlgoAPI_Fuse(shape, tool) if feature["op"] == "add"
                         else BRepAlgoAPI_Cut(shape, tool))
            operation.Build()
            if not operation.IsDone() or operation.Shape().IsNull():
                raise RuntimeError(f"OCCT feature operation {index} failed")
            shape = operation.Shape()
            if not BRepCheck_Analyzer(shape).IsValid():
                raise RuntimeError(f"OCCT feature operation {index} produced an invalid solid")
    elif kind == "corner_plate":
        from OCP.BRepFilletAPI import (
            BRepFilletAPI_MakeFillet, BRepFilletAPI_MakeChamfer
        )
        from OCP.TopExp import TopExp_Explorer
        from OCP.TopAbs import TopAbs_EDGE
        from OCP.TopoDS import TopoDS
        from OCP.BRepAdaptor import BRepAdaptor_Curve

        width, depth, thickness = (
            spec[key] for key in ("width", "depth", "thickness")
        )
        radius = spec["corner_size"]
        base = box(width, depth, thickness)
        style = spec["corner_style"]
        if style == "round":
            finishing = BRepFilletAPI_MakeFillet(base)
        elif style == "chamfer":
            finishing = BRepFilletAPI_MakeChamfer(base)
        else:
            raise ValueError("Unsupported corner style")
        edges = TopExp_Explorer(base, TopAbs_EDGE)
        selected = set()
        while edges.More():
            edge = TopoDS.Edge_s(edges.Current())
            curve = BRepAdaptor_Curve(edge)
            first = curve.Value(curve.FirstParameter())
            last = curve.Value(curve.LastParameter())
            key = (round(first.X(), 7), round(first.Y(), 7))
            if (abs(first.X() - last.X()) < 1e-7
                    and abs(first.Y() - last.Y()) < 1e-7
                    and abs(first.Z() - last.Z()) >= thickness - 1e-7
                    and key not in selected):
                finishing.Add(radius, edge)
                selected.add(key)
            edges.Next()
        if len(selected) != 4:
            raise RuntimeError("Could not identify four vertical corner edges")
        finishing.Build()
        if not finishing.IsDone() or finishing.Shape().IsNull():
            raise RuntimeError("OCCT corner finishing operation failed")
        shape = finishing.Shape()
        for x in (spec["hole_inset"], width - spec["hole_inset"]):
            tool = cylinder(spec["hole_diameter"] / 2,
                            thickness + .2, x, depth / 2, -.1)
            shape = BRepAlgoAPI_Cut(shape, tool).Shape()
    elif kind == "machined_block":
        width, depth, height = (
            spec[key] for key in ("width", "depth", "height")
        )
        shape = box(width, depth, height)
        hole = spec["hole_diameter"]
        inset = spec["hole_inset"]
        for x in (inset, width - inset):
            shape = BRepAlgoAPI_Cut(
                shape, cylinder(hole / 2, height + .2, x, depth / 2, -.1)
            ).Shape()
        pocket_w = spec["pocket_width"]
        pocket_d = spec["pocket_depth"]
        cut = spec["pocket_cut_depth"]
        tool = box(pocket_w, pocket_d, cut + .1,
                   (width - pocket_w) / 2, (depth - pocket_d) / 2,
                   height - cut)
        shape = BRepAlgoAPI_Cut(shape, tool).Shape()
    elif kind == "washer":
        outer = cylinder(spec["outer_diameter"] / 2, spec["thickness"])
        hole = cylinder(
            spec["inner_diameter"] / 2, spec["thickness"] + .2, z=-.1
        )
        shape = BRepAlgoAPI_Cut(outer, hole).Shape()
    elif kind == "mounting_plate":
        width, depth, thickness = (spec[key] for key in
                                   ("width", "depth", "thickness"))
        shape = box(width, depth, thickness)
        inset = spec["hole_inset"]
        for x in (inset, width - inset):
            for y in (inset, depth - inset):
                tool = cylinder(spec["hole_diameter"] / 2,
                                thickness + .2, x, y, -.1)
                shape = BRepAlgoAPI_Cut(shape, tool).Shape()
    elif kind == "open_box":
        width, depth, height, wall = (
            spec[key] for key in ("width", "depth", "height", "wall")
        )
        shell = box(width, depth, height)
        cavity = box(width - 2 * wall, depth - 2 * wall,
                     height, wall, wall, wall)
        shape = BRepAlgoAPI_Cut(shell, cavity).Shape()
    elif kind == "box_lid":
        width, depth = spec["box_width"], spec["box_depth"]
        wall, overhang, clearance = (
            spec[key] for key in ("box_wall", "overhang", "clearance")
        )
        plate = box(width + 2 * overhang,
                    depth + 2 * overhang, spec["thickness"])
        plug = box(width - 2 * (wall + clearance),
                   depth - 2 * (wall + clearance),
                   spec["plug_depth"] + .01,
                   overhang + wall + clearance,
                   overhang + wall + clearance, -spec["plug_depth"])
        shape = BRepAlgoAPI_Fuse(plate, plug).Shape()
    else:
        raise ValueError("OCCT STEP part family not supported: " + str(kind))

    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopAbs import TopAbs_SOLID
    if shape.IsNull() or not BRepCheck_Analyzer(shape).IsValid():
        raise RuntimeError("OCCT generated an invalid B-rep")
    iterator = TopExp_Explorer(shape, TopAbs_SOLID)
    count = 0
    while iterator.More():
        count += 1
        iterator.Next()
    if count != 1:
        raise RuntimeError(f"Expected one solid, got {count}")
    return shape


def main():
    from OCP.STEPControl import STEPControl_Writer, STEPControl_AsIs
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.Interface import Interface_Static

    source = Path(os.environ["ORKICAD_OCCT_SPEC_PATH"])
    output = Path(os.environ["ORKICAD_OCCT_OUT_PATH"])
    spec = json.loads(source.read_text(encoding="utf-8"))
    shape = make_shape(spec)
    # All OrkiCAD linear dimensions are expressed in millimetres.
    Interface_Static.SetCVal_s("xstep.cascade.unit", "MM")
    Interface_Static.SetCVal_s("write.step.unit", "MM")
    writer = STEPControl_Writer()
    writer.Transfer(shape, STEPControl_AsIs)
    if writer.Write(str(output)) != IFSelect_RetDone:
        raise RuntimeError("OCCT STEPControl_Writer failed")
    if not output.is_file() or output.stat().st_size == 0:
        raise RuntimeError("OCCT did not produce a STEP file")
    print("ORKICAD_OCCT_STEP_OK")


if __name__ == "__main__":
    main()
