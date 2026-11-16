"""Versioned allowlisted part catalog driving dynamic CAD forms and AI output.

All length dimensions are canonical millimetres. The UI may display inches.
"""
from __future__ import annotations

CATALOG_VERSION = "0.8-open-annular-sector"
PARTS = {
    "bevel_gear_straight": {"category": "transmission", "subcategory": "bevel", "fields": {
        "module": 2, "teeth": 20, "mate_teeth": 20, "shaft_angle": 90,
        "face_width": 8, "pressure_angle": 20, "bore_diameter": 8,
        "backlash": 0.1
    }},
    "solid_shaft": {"category": "shafts", "fields": {"diameter": 12, "length": 80}},
    "hollow_tube": {"category": "pipes", "fields": {"outer_diameter": 30, "inner_diameter": 24, "length": 100}},
    "angle_bracket": {"category": "supports", "fields": {"width": 40, "depth": 50, "height": 35, "thickness": 4}},
    "split_ring": {"category": "plates", "fields": {
        "outer_diameter": 40, "inner_radius": 10, "outer_arc_gap": 20,
        "thickness": 4,
    }},
    "circular_plate": {"category": "plates", "fields": {"outer_radius": 50, "thickness": 4,
                                    "hole_count": 5, "hole_diameter": 3,
                                    "bolt_circle_radius": 20}},
    "feature_model": {"category": "machining", "fields": {"width": 100, "depth": 60, "height": 12,
                                  "operations": [
                                      {"op": "cut", "shape": "box", "position": [26, 15, 6], "size": [48, 30, 6.2]},
                                      {"op": "cut", "shape": "cylinder", "position": [12, 30, -0.1], "radius": 3, "height": 12.2},
                                      {"op": "cut", "shape": "cylinder", "position": [88, 30, -0.1], "radius": 3, "height": 12.2},
                                      {"op": "add", "shape": "cylinder", "position": [50, 50, 11.8], "radius": 7, "height": 8}
                                  ]}},
    "corner_plate": {"category": "plates", "fields": {"width": 90, "depth": 55, "thickness": 6,
                                  "corner_style": "round", "corner_size": 5,
                                  "hole_diameter": 6, "hole_inset": 17}},
    "machined_block": {"category": "machining", "fields": {"width": 100, "depth": 60, "height": 15,
                                    "hole_diameter": 6, "hole_inset": 12,
                                    "pocket_width": 48, "pocket_depth": 30,
                                    "pocket_cut_depth": 6}},
    "washer": {"category": "fasteners", "fields": {"outer_diameter": 18, "inner_diameter": 6.5, "thickness": 2}},
    "mounting_plate": {"category": "plates", "fields": {"width": 80, "depth": 50, "thickness": 5,
                                   "hole_diameter": 5, "hole_inset": 10}},
    "open_box": {"category": "enclosures", "fields": {"width": 60, "depth": 40, "height": 25, "wall": 2}},
    "metric_screw": {"category": "fasteners", "fields": {"diameter": 6, "pitch": 1, "length": 30,
                                "head": "socket", "drive": "hex"}},
    "metric_nut": {"category": "fasteners", "fields": {"diameter": 6, "pitch": 1, "shape": "hex",
                              "thickness": "normal"}},
    "spur_gear": {"category": "transmission", "fields": {"module": 2, "teeth": 24, "thickness": 8,
                             "shaft_diameter": 8, "pressure_angle": 20}},
    "box_lid": {"category": "enclosures", "fields": {"box_width": 60, "box_depth": 40,
                           "box_wall": 2, "thickness": 3, "overhang": 2,
                           "plug_depth": 5, "clearance": 0.3}},
    "bottle_cap": {"category": "printing", "fields": {"neck_outer_diameter": 28,
                              "height": 16, "wall": 3, "top_thickness": 3,
                              "pitch": 3, "clearance": 0.4,
                              "thread_depth": 1}},
}

# These fields are categorical rather than free-text values.
OPTIONS = {
    "corner_style": ["round", "chamfer"],
    "head": ["socket", "button", "hex", "pan", "flat", "none"],
    "drive": ["hex","torx","t10","t15","t20","t25","t30","t40","none","slot","phillips","ph0","ph1","ph2","ph3","ph4"],
    "shape": ["hex", "square"],
}
# Each item is UI metadata, not arbitrary CAD source.
FIELDS = {
    "outer_radius": {"min": 0.1},
    "bolt_circle_radius": {"min": 0.1},
    "hole_count": {"min": 1, "max": 64, "step": 1},
    "mate_teeth": {"min": 12, "max": 200, "step": 1},
    "shaft_angle": {"min": 10, "max": 179.9, "units": "deg"},
    "face_width": {"min": 0.1},
    "bore_diameter": {"min": 0.1},
    "backlash": {"min": 0, "max": 20},
    "outer_diameter": {"min": 0.1}, "inner_diameter": {"min": 0.1},
    "inner_radius": {"min": 0.1}, "outer_arc_gap": {"min": 0.1},
    "width": {"min": 0.1}, "depth": {"min": 0.1},
    "height": {"min": 0.1}, "wall": {"min": 0.1},
    "thickness": {"min": 0.1}, "hole_diameter": {"min": 0.1},
    "hole_inset": {"min": 0.1}, "diameter": {"min": 1},
    "pitch": {"min": 0.1}, "length": {"min": 0.1},
    "module": {"min": 0.1}, "teeth": {"min": 12, "step": 1},
    "shaft_diameter": {"min": 0.1}, "pressure_angle": {"min": 1},
    "box_width": {"min": 0.1}, "box_depth": {"min": 0.1},
    "box_wall": {"min": 0.1}, "overhang": {"min": 0.1},
    "plug_depth": {"min": 0.1}, "clearance": {"min": 0.01},
    "neck_outer_diameter": {"min": 0.1}, "top_thickness": {"min": 0.1},
    "thread_depth": {"min": 0.1},
    "pocket_width": {"min": 0.1}, "pocket_depth": {"min": 0.1},
    "operations": {"editor": "feature_operations", "units": "mm"},
    "pocket_cut_depth": {"min": 0.1}, "corner_size": {"min": 0.1},
}


def catalog_public():
    return {"version": CATALOG_VERSION, "parts": {
        key: {"category": desc.get("category", "other"), **({"subcategory": desc["subcategory"]} if "subcategory" in desc else {}), "fields": [
            {"key": name, "default": value,
             **({"options": OPTIONS[name]} if name in OPTIONS else {}),
             **(FIELDS.get(name, {}))}
            for name, value in desc["fields"].items()
        ]}
        for key, desc in PARTS.items()
    }}


def validated_spec(value):
    """Strict extraction: ignore invented keys, require supplied schema fields."""
    from .geometry import ParameterError, generate_scad

    if not isinstance(value, dict):
        raise ParameterError("AI response must be a JSON object")
    if value.get("type") == "feature_model":
        from .feature_program import validate_feature_model
        return validate_feature_model(value)
    kind = value.get("type")
    if not isinstance(kind, str) or kind not in PARTS:
        raise ParameterError("Unsupported part type. Supported: " + ", ".join(PARTS))
    permitted = PARTS[kind]["fields"]
    missing = [key for key in permitted if key not in value]
    if missing:
        raise ParameterError("Missing required measurements: " + ", ".join(missing))
    spec = {"type": kind}
    for key, default in permitted.items():
        item = value[key]
        if type(default) is str:
            if not isinstance(item, str):
                raise ParameterError(f"{key} must be text")
            if key in OPTIONS and item not in OPTIONS[key]:
                raise ParameterError(f"{key} must be one of: {', '.join(OPTIONS[key])}")
        if type(default) in (int, float) and (
            isinstance(item, bool) or not isinstance(item, (int, float))
        ):
            raise ParameterError(f"{key} must be numeric")
        spec[key] = item
    generate_scad(spec)
    return spec
