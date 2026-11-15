"""Prototype consumer closures, generated from measured dimensions (mm).

Neither closure is guaranteed watertight or a match for proprietary threads.
"""
from __future__ import annotations
from typing import Any, Mapping

from .geometry import ParameterError, _fmt, _number


def make_closure(spec: Mapping[str, Any]) -> str:
    kind = spec.get("type")
    if kind == "box_lid":
        width = _number(spec, "box_width")
        depth = _number(spec, "box_depth")
        wall = _number(spec, "box_wall")
        plate = _number(spec, "thickness")
        overhang = _number(spec, "overhang")
        plug_depth = _number(spec, "plug_depth")
        clearance = _number(spec, "clearance")
        if 2 * (wall + clearance) >= min(width, depth):
            raise ParameterError("Box opening too narrow for wall and clearance")
        if plug_depth >= 100:
            raise ParameterError("plug_depth must be smaller than 100 mm")
        plug_width = width - 2 * (wall + clearance)
        plug_height = depth - 2 * (wall + clearance)
        # A solid inset insert with XY clearance; it is not a snap-fit lid.
        scad = (
            "union() {\n"
            f"  cube([{_fmt(width+2*overhang)},{_fmt(depth+2*overhang)},{_fmt(plate)}]);\n"
            f"  translate([{_fmt(overhang+wall+clearance)},{_fmt(overhang+wall+clearance)},-{_fmt(plug_depth)}]) "
            f"cube([{_fmt(plug_width)},{_fmt(plug_height)},{_fmt(plug_depth+0.01)}]);\n"
            "}\n"
        )
    elif kind == "bottle_cap":
        neck = _number(spec, "neck_outer_diameter")
        height = _number(spec, "height")
        wall = _number(spec, "wall")
        top = _number(spec, "top_thickness")
        pitch = _number(spec, "pitch")
        clearance = _number(spec, "clearance")
        thread_depth = _number(spec, "thread_depth")
        if top >= height:
            raise ParameterError("top_thickness must be smaller than cap height")
        if neck < 8 or neck > 120:
            raise ParameterError("neck_outer_diameter must be between 8 and 120 mm")
        if thread_depth >= wall or thread_depth >= pitch / 2:
            raise ParameterError("thread_depth must be smaller than wall and pitch/2")
        if wall < 1 or clearance >= wall:
            raise ParameterError("wall must be >= 1 mm and larger than clearance")
        inner_radius = (neck + clearance * 2) / 2
        outer_radius = inner_radius + wall
        usable = height - top
        if usable < 2 * pitch:
            raise ParameterError("height minus top_thickness must fit at least 2 thread pitches")
        # Internal triangular ridge, centred on the inner cylindrical wall.
        # A simple single-start helical profile, NOT a standard bottle-neck finish.
        turns = usable / pitch - 1
        section = (
            f"polygon(points=[[{_fmt(inner_radius- thread_depth)},0],"
            f"[{_fmt(inner_radius+0.03)},-{_fmt(pitch*0.18)}],"
            f"[{_fmt(inner_radius+0.03)},{_fmt(pitch*0.18)}]]);"
        )
        scad = (
            "union() {\n"
            "  difference() {\n"
            f"    cylinder(h={_fmt(height)}, r={_fmt(outer_radius)}, $fn=160);\n"
            f"    cylinder(h={_fmt(usable)}, r={_fmt(inner_radius)}, $fn=160);\n"
            "  }\n"
            f"  translate([0,0,{_fmt(pitch*0.5)}]) linear_extrude(height={_fmt(turns*pitch)},"
            f" twist={_fmt(360*turns)}, slices={max(48,int(turns*96))}) "
            + section + "\n"
            "}\n"
        )
    else:
        raise ParameterError("Unsupported closure type")
    return (
        "// OrkiCAD prototype closure; units mm; dimensional fit NOT certified.\n"
        + scad
    )
